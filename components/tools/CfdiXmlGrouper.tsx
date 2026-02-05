'use client';

import { useState, useCallback } from 'react';
import JSZip from 'jszip';

/**
 * CFDI XML Grouper Component
 *
 * PURPOSE:
 * This component processes Mexican CFDI (Comprobante Fiscal Digital por Internet)
 * invoices entirely in the browser. It groups XML files by their emitter's RFC
 * (Registro Federal de Contribuyentes) and allows downloading each group as a ZIP.
 *
 * WHY CLIENT-SIDE PROCESSING?
 * - Avoids Vercel's 4.5MB request body limit for serverless functions
 * - Eliminates server costs for file processing
 * - Ensures privacy: files never leave the user's browser
 * - No storage costs since files remain in memory only
 * - Faster processing without network latency
 *
 * CFDI XML STRUCTURE:
 * Mexican electronic invoices follow the SAT (Tax Administration Service) schema.
 * The relevant structure for RFC extraction is:
 *
 * ```xml
 * <cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" ...>
 *   <cfdi:Emisor Rfc="ABC123456XYZ" Nombre="Company Name" ... />
 *   <cfdi:Receptor Rfc="XYZ987654ABC" Nombre="Customer Name" ... />
 *   ...
 * </cfdi:Comprobante>
 * ```
 *
 * Key points:
 * - CFDI uses XML namespaces (cfdi: prefix)
 * - Version 3.3 uses namespace: http://www.sat.gob.mx/cfd/3
 * - Version 4.0 uses namespace: http://www.sat.gob.mx/cfd/4
 * - The Emisor (emitter) node contains the RFC of the invoice issuer
 * - RFC format: 12-13 alphanumeric characters (12 for companies, 13 for individuals)
 */

/**
 * Represents the emitter info extracted from CFDI
 */
interface EmitterInfo {
  rfc: string;
  nombre: string;
}

/**
 * Represents a parsed XML file with its metadata
 */
interface ParsedFile {
  file: File;
  rfc: string;
  nombre: string;
  fileName: string;
  content: string;
}

/**
 * Represents a file that failed to parse
 */
interface FailedFile {
  fileName: string;
  error: string;
}

/**
 * Represents a group of files from the same RFC
 */
interface RfcGroup {
  rfc: string;
  nombre: string;
  files: ParsedFile[];
  isDownloading: boolean;
  isSavingToFolder: boolean;
}

/**
 * Processing state for UI feedback
 */
interface ProcessingState {
  current: number;
  total: number;
  currentFileName: string;
}

/**
 * CFDI XML namespace URIs for different versions
 * These are required for proper XML namespace resolution
 */
const CFDI_NAMESPACES = {
  'cfdi3': 'http://www.sat.gob.mx/cfd/3',  // CFDI version 3.3
  'cfdi4': 'http://www.sat.gob.mx/cfd/4',  // CFDI version 4.0
};

/**
 * Extracts the emitter RFC and Name from a CFDI XML document
 *
 * HOW EMITTER EXTRACTION WORKS:
 * 1. Parse the XML string into a DOM document
 * 2. Look for the cfdi:Emisor element using namespace-aware queries
 * 3. Read the "Rfc" and "Nombre" attributes from the Emisor element
 *
 * The function tries both CFDI 4.0 and 3.3 namespaces since both are in use.
 *
 * @param xmlContent - The raw XML string content
 * @returns EmitterInfo with RFC and Nombre, or null if not found
 */
function extractEmitterFromCfdi(xmlContent: string): EmitterInfo | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  // Check for XML parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format');
  }

  /**
   * Helper function to extract RFC and Nombre from an Emisor element
   */
  const extractFromElement = (emisor: Element): EmitterInfo | null => {
    const rfc = emisor.getAttribute('Rfc');
    const nombre = emisor.getAttribute('Nombre');
    if (rfc) {
      return {
        rfc: rfc.toUpperCase().trim(),
        nombre: nombre?.trim() || 'Sin nombre',
      };
    }
    return null;
  };

  /**
   * Try to find Emisor element using getElementsByTagNameNS
   * This is the most reliable method for namespaced XML
   * We try CFDI 4.0 first (most recent), then fall back to 3.3
   */
  for (const ns of [CFDI_NAMESPACES.cfdi4, CFDI_NAMESPACES.cfdi3]) {
    const emisorElements = doc.getElementsByTagNameNS(ns, 'Emisor');
    if (emisorElements.length > 0) {
      const result = extractFromElement(emisorElements[0]);
      if (result) return result;
    }
  }

  /**
   * Fallback: Try to find the Emisor element without namespace
   * Some malformed or exported XMLs might not have proper namespaces
   */
  const emisorFallback = doc.querySelector('[Rfc]');
  if (emisorFallback && emisorFallback.tagName.includes('Emisor')) {
    const result = extractFromElement(emisorFallback);
    if (result) return result;
  }

  // Try an alternative approach using attribute selector with local-name
  const allElements = doc.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const localName = el.localName || el.nodeName.split(':').pop();
    if (localName === 'Emisor') {
      const result = extractFromElement(el);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Validates that a string looks like a valid Mexican RFC
 *
 * RFC FORMAT:
 * - Companies (Personas Morales): 12 characters
 *   Pattern: 3 letters + 6 digits (date) + 3 alphanumeric (homoclave)
 * - Individuals (Personas Físicas): 13 characters
 *   Pattern: 4 letters + 6 digits (date) + 3 alphanumeric (homoclave)
 *
 * This is a basic format check, not a full SAT validation
 */
function isValidRfcFormat(rfc: string): boolean {
  // RFC should be 12-13 alphanumeric characters
  const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
  return rfcPattern.test(rfc);
}

export default function CfdiXmlGrouper() {
  // State for tracking file groups and processing
  const [rfcGroups, setRfcGroups] = useState<RfcGroup[]>([]);
  const [failedFiles, setFailedFiles] = useState<FailedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState | null>(null);
  const [dragActive, setDragActive] = useState(false);

  /**
   * Reads a file as text using FileReader API
   * Returns a Promise for async/await usage
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  /**
   * Processes uploaded XML files
   *
   * GROUPING LOGIC:
   * 1. Read each file's content as text
   * 2. Parse the XML and extract the emitter RFC
   * 3. Group files by RFC into a Map structure
   * 4. Convert the Map to an array for React state
   *
   * Files that fail parsing are tracked separately for user feedback
   */
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      file => file.name.toLowerCase().endsWith('.xml')
    );

    if (fileArray.length === 0) {
      return;
    }

    setIsProcessing(true);
    setFailedFiles([]);

    // Use a Map for efficient RFC-based grouping
    const groupMap = new Map<string, ParsedFile[]>();
    const failed: FailedFile[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      // Update progress state for UI feedback
      setProcessingState({
        current: i + 1,
        total: fileArray.length,
        currentFileName: file.name,
      });

      try {
        const content = await readFileAsText(file);
        const emitterInfo = extractEmitterFromCfdi(content);

        if (!emitterInfo) {
          failed.push({
            fileName: file.name,
            error: 'No se encontró el RFC del emisor (cfdi:Emisor)',
          });
          continue;
        }

        if (!isValidRfcFormat(emitterInfo.rfc)) {
          failed.push({
            fileName: file.name,
            error: `RFC con formato inválido: ${emitterInfo.rfc}`,
          });
          continue;
        }

        const parsedFile: ParsedFile = {
          file,
          rfc: emitterInfo.rfc,
          nombre: emitterInfo.nombre,
          fileName: file.name,
          content,
        };

        /**
         * HOW RFC GROUPING WORKS:
         * - Use the RFC as a Map key for O(1) lookups
         * - If the RFC exists, append to existing array
         * - If new RFC, create a new array with this file
         * This ensures files from the same emitter are grouped together
         */
        const existing = groupMap.get(emitterInfo.rfc) || [];
        existing.push(parsedFile);
        groupMap.set(emitterInfo.rfc, existing);

      } catch (error) {
        failed.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Error al procesar el archivo',
        });
      }
    }

    // Convert Map to array and sort by RFC for consistent display
    // Use the nombre from the first file in each group (all files in a group have the same emitter)
    const groups: RfcGroup[] = Array.from(groupMap.entries())
      .map(([rfc, files]) => ({
        rfc,
        nombre: files[0]?.nombre || 'Sin nombre',
        files,
        isDownloading: false,
        isSavingToFolder: false,
      }))
      .sort((a, b) => a.rfc.localeCompare(b.rfc));

    setRfcGroups(groups);
    setFailedFiles(failed);
    setIsProcessing(false);
    setProcessingState(null);
  }, []);

  /**
   * Handle file input change event
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  /**
   * Drag and drop handlers for better UX
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  /**
   * Downloads a ZIP file containing all XMLs for a specific RFC
   *
   * ZIP GENERATION PROCESS:
   * 1. Create a new JSZip instance
   * 2. Add each file's original content to the ZIP
   * 3. Generate the ZIP as a Blob (binary)
   * 4. Create a temporary download link and trigger click
   * 5. Clean up the temporary URL
   *
   * WHY BROWSER-SIDE ZIP?
   * - No server processing needed
   * - Works offline after page load
   * - Faster for the user
   * - No upload bandwidth required
   */
  const downloadZip = async (rfc: string) => {
    // Find the group and mark as downloading
    const groupIndex = rfcGroups.findIndex(g => g.rfc === rfc);
    if (groupIndex === -1) return;

    // Update state to show downloading indicator
    setRfcGroups(prev => prev.map((g, i) =>
      i === groupIndex ? { ...g, isDownloading: true } : g
    ));

    try {
      const group = rfcGroups[groupIndex];
      const zip = new JSZip();

      // Add each original XML file to the ZIP
      for (const parsedFile of group.files) {
        /**
         * We use the original file content to ensure
         * the XML is not modified during the process.
         * This preserves the digital signature integrity.
         */
        zip.file(parsedFile.fileName, parsedFile.content);
      }

      // Generate the ZIP as a Blob
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CFDI_${rfc}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the temporary URL to free memory
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Error al crear el archivo ZIP. Por favor intente de nuevo.');
    } finally {
      // Reset downloading state
      setRfcGroups(prev => prev.map((g, i) =>
        i === groupIndex ? { ...g, isDownloading: false } : g
      ));
    }
  };

  /**
   * Downloads all groups as separate ZIP files
   */
  const downloadAllZips = async () => {
    for (const group of rfcGroups) {
      await downloadZip(group.rfc);
      // Small delay between downloads to avoid browser blocking
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  /**
   * Checks if the File System Access API is available
   */
  const supportsFileSystemAccess = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const [isSavingAllToFolder, setIsSavingAllToFolder] = useState(false);

  /**
   * Writes all files for a given group into a directory handle
   */
  const writeGroupToFolder = async (dirHandle: any, group: RfcGroup) => {
    const subDirHandle = await dirHandle.getDirectoryHandle(`CFDI_${group.rfc}`, { create: true });
    for (const parsedFile of group.files) {
      const fileHandle = await subDirHandle.getFileHandle(parsedFile.fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(parsedFile.content);
      await writable.close();
    }
  };

  /**
   * Saves XML files for a specific RFC directly to a user-selected folder
   * Uses the File System Access API (Chromium browsers only)
   */
  const downloadToFolder = async (rfc: string) => {
    const groupIndex = rfcGroups.findIndex(g => g.rfc === rfc);
    if (groupIndex === -1) return;

    setRfcGroups(prev => prev.map((g, i) =>
      i === groupIndex ? { ...g, isSavingToFolder: true } : g
    ));

    try {
      const group = rfcGroups[groupIndex];
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await writeGroupToFolder(dirHandle, group);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error saving to folder:', error);
      alert('Error al guardar los archivos en la carpeta. Por favor intente de nuevo.');
    } finally {
      setRfcGroups(prev => prev.map((g, i) =>
        i === groupIndex ? { ...g, isSavingToFolder: false } : g
      ));
    }
  };

  /**
   * Saves all RFC groups as subdirectories in a user-selected folder
   */
  const downloadAllToFolder = async () => {
    setIsSavingAllToFolder(true);
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      for (const group of rfcGroups) {
        await writeGroupToFolder(dirHandle, group);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error saving to folder:', error);
      alert('Error al guardar los archivos en la carpeta. Por favor intente de nuevo.');
    } finally {
      setIsSavingAllToFolder(false);
    }
  };

  /**
   * Resets the component state
   */
  const reset = () => {
    setRfcGroups([]);
    setFailedFiles([]);
    setProcessingState(null);
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calculate totals for summary
  const totalFiles = rfcGroups.reduce((sum, g) => sum + g.files.length, 0);
  const totalSize = rfcGroups.reduce(
    (sum, g) => sum + g.files.reduce((s, f) => s + f.file.size, 0),
    0
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Subir Archivos CFDI XML
        </h2>

        <p className="text-gray-600 mb-6">
          Selecciona múltiples archivos XML de facturas CFDI (versión 3.3 o 4.0).
          Los archivos se agruparán automáticamente por el RFC del emisor.
        </p>

        {/* Upload Options - Files or Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Individual Files Upload */}
          <div
            className={`relative ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label
              htmlFor="xml-upload"
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center justify-center p-4">
                <svg
                  className={`w-10 h-10 mb-3 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-700 font-semibold mb-1">
                  Archivos individuales
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Click o arrastra archivos XML
                </p>
              </div>
              <input
                id="xml-upload"
                type="file"
                className="hidden"
                accept=".xml"
                multiple
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Directory Upload */}
          <div>
            <label
              htmlFor="xml-folder-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center p-4">
                <svg
                  className="w-10 h-10 mb-3 text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <p className="text-sm text-gray-700 font-semibold mb-1">
                  Carpeta completa
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Selecciona una carpeta con XMLs
                </p>
              </div>
              <input
                id="xml-folder-upload"
                type="file"
                className="hidden"
                accept=".xml"
                onChange={handleFileChange}
                disabled={isProcessing}
                {...{ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>}
              />
            </label>
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && processingState && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <svg
                className="animate-spin h-5 w-5 text-blue-600 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="font-semibold text-blue-800">
                Procesando archivos...
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {processingState.current} de {processingState.total}: {processingState.currentFileName}
            </p>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(processingState.current / processingState.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Reset Button */}
        {(rfcGroups.length > 0 || failedFiles.length > 0) && (
          <button
            onClick={reset}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Limpiar y empezar de nuevo
          </button>
        )}
      </div>

      {/* Warning for Failed Files */}
      {failedFiles.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Archivos no procesados ({failedFiles.length})
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                Los siguientes archivos no pudieron ser procesados.
                Verifique que sean archivos CFDI XML válidos.
              </p>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {failedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="text-sm text-yellow-800 bg-yellow-100 rounded px-3 py-2"
                  >
                    <span className="font-medium">{file.fileName}</span>
                    <span className="text-yellow-600 ml-2">— {file.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* RFC Groups Results */}
      {rfcGroups.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Archivos Agrupados por RFC
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {rfcGroups.length} emisor{rfcGroups.length !== 1 ? 'es' : ''} • {totalFiles} archivo{totalFiles !== 1 ? 's' : ''} • {formatFileSize(totalSize)}
              </p>
            </div>
            {rfcGroups.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={downloadAllZips}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                >
                  Descargar todos los ZIP
                </button>
                {supportsFileSystemAccess && (
                  <button
                    onClick={downloadAllToFolder}
                    disabled={isSavingAllToFolder}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap flex items-center"
                  >
                    {isSavingAllToFolder ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        Guardar todos en carpeta
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-purple-300 text-purple-900 rounded-full leading-none">
                          BETA
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {rfcGroups.map((group) => (
              <div
                key={group.rfc}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Group Header */}
                <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-lg truncate">
                      {group.nombre}
                    </h4>
                    <p className="font-mono text-sm text-gray-500">
                      {group.rfc}
                    </p>
                    <p className="text-sm text-gray-600">
                      {group.files.length} archivo{group.files.length !== 1 ? 's' : ''} • {formatFileSize(group.files.reduce((s, f) => s + f.file.size, 0))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadZip(group.rfc)}
                      disabled={group.isDownloading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center min-w-[140px]"
                    >
                      {group.isDownloading ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Generando...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Descargar ZIP
                        </>
                      )}
                    </button>
                    {supportsFileSystemAccess && (
                      <button
                        onClick={() => downloadToFolder(group.rfc)}
                        disabled={group.isSavingToFolder}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center min-w-[160px]"
                      >
                        {group.isSavingToFolder ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 mr-2"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                              />
                            </svg>
                            Guardar en carpeta
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-purple-300 text-purple-900 rounded-full leading-none">
                              BETA
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* File List (collapsed by default for large groups) */}
                <details className="group">
                  <summary className="px-4 py-2 cursor-pointer text-sm text-blue-600 hover:text-blue-800 bg-white border-t border-gray-100">
                    Ver archivos incluidos
                  </summary>
                  <div className="px-4 pb-3 bg-white max-h-48 overflow-y-auto">
                    <ul className="space-y-1">
                      {group.files.map((file, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 py-1 flex justify-between items-center"
                        >
                          <span className="truncate flex-1 mr-2">{file.fileName}</span>
                          <span className="text-gray-400 text-xs whitespace-nowrap">
                            {formatFileSize(file.file.size)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">
              Procesamiento 100% local
            </p>
            <p>
              Tus archivos nunca se suben a ningún servidor. Todo el procesamiento
              ocurre directamente en tu navegador. Al cerrar esta página, todos
              los datos se eliminan automáticamente de la memoria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

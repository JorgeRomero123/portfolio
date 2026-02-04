'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

/**
 * CFDI Excel Processor Component
 *
 * PURPOSE:
 * This component processes multiple Excel files containing CFDI (Mexican electronic invoice) data.
 * Each file is associated with a single receptor (RFC Receptor), and the component:
 * - Removes specific columns that are not needed
 * - Calculates totals for financial columns
 * - Displays files in tabs organized by RFC Receptor
 * - Generates clean Excel files for download
 *
 * WHY CLIENT-SIDE PROCESSING?
 * - Avoids Vercel's serverless function limits
 * - No file upload to servers = faster processing
 * - Privacy: financial data never leaves the browser
 * - Works offline after page load
 *
 * FILE STRUCTURE ASSUMPTION:
 * Each Excel file contains invoices for a SINGLE receptor.
 * The "RFC Receptor" and "Razon Receptor" columns have the same value in every row.
 */

/**
 * Columns to completely remove from the output
 * These are typically metadata or tax fields not needed in the final report
 */
const COLUMNS_TO_REMOVE = [
  'Global periodicidad',
  'Global meses',
  'Global año',
  'IEPS Trasladado',
  'IEPS Retenido',
  'Local retenido',
  'Local trasladado',
  'SubTotalCombustibles',
  'TotalCombustibles',
];

/**
 * Columns that should be summed and displayed
 * These represent the key financial totals in CFDI documents
 */
const COLUMNS_TO_SUM = [
  'SubTotal',
  'Descuento',
  'IVA Trasladado',
  'IVA Exento',
  'IVA Retenido',
  'ISR Retenido',
  'Total',
];

/**
 * Column names for receptor identification
 * These columns identify who received the invoice
 */
const RFC_RECEPTOR_COLUMN = 'RFC Receptor';
const RAZON_RECEPTOR_COLUMN = 'Razon Receptor';

/**
 * Special "Uso CFDI" values that require separate handling
 */
const USO_CFDI_COLUMN = 'Uso CFDI';
const USO_CFDI_PAGOS = 'CP01 - Pagos';
const USO_CFDI_NOMINA = 'CN01 - Nómina';

/**
 * Represents the calculated sums for display
 */
interface ColumnSums {
  [key: string]: number;
}

/**
 * Represents a processed Excel file with receptor info
 * Rows are separated into: regular, nómina (with totals), and pagos (no totals)
 */
interface ProcessedFile {
  id: string;
  fileName: string;
  rfcReceptor: string;
  razonReceptor: string;
  headers: string[];
  // Regular rows (excluding Nómina and Pagos)
  rows: (string | number | null)[][];
  sums: ColumnSums;
  // Nómina rows (CN01 - Nómina) with their own totals
  nominaRows: (string | number | null)[][];
  nominaSums: ColumnSums;
  // Pagos rows (CP01 - Pagos) - no totals needed
  pagosRows: (string | number | null)[][];
  originalRowCount: number;
  removedColumns: string[];
}

/**
 * Parses a value that might be a string or number into a number
 * Handles various formats like "1,234.56", "$1,234.56", etc.
 */
function parseNumericValue(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  const strValue = String(value)
    .replace(/[$,\s]/g, '')
    .replace(/\(([^)]+)\)/, '-$1')
    .trim();

  const parsed = parseFloat(strValue);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number as Mexican Peso currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Normalizes column names for comparison
 */
function normalizeColumnName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Checks if a column should be removed
 */
function shouldRemoveColumn(header: string): boolean {
  const normalized = normalizeColumnName(header);
  return COLUMNS_TO_REMOVE.some(
    col => normalizeColumnName(col) === normalized
  );
}

/**
 * Checks if a column should be summed
 */
function getSumColumnKey(header: string): string | null {
  const normalized = normalizeColumnName(header);
  const match = COLUMNS_TO_SUM.find(
    col => normalizeColumnName(col) === normalized
  );
  return match || null;
}

/**
 * Generates a unique ID for each file
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function CfdiExcelProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  /**
   * Reads the Excel file and returns raw data
   */
  const readExcelFile = (file: File): Promise<XLSX.WorkBook> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook);
        } catch {
          reject(new Error(`No se pudo leer "${file.name}". Verifica que sea un archivo .xlsx válido.`));
        }
      };
      reader.onerror = () => reject(new Error(`Error al leer "${file.name}".`));
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Extracts receptor info from the first data row
   * Since all rows have the same receptor, we only need the first one
   */
  const extractReceptorInfo = (
    headers: string[],
    dataRows: (string | number | null)[][]
  ): { rfcReceptor: string; razonReceptor: string } => {
    const rfcIndex = headers.findIndex(
      h => normalizeColumnName(h) === normalizeColumnName(RFC_RECEPTOR_COLUMN)
    );
    const razonIndex = headers.findIndex(
      h => normalizeColumnName(h) === normalizeColumnName(RAZON_RECEPTOR_COLUMN)
    );

    // Find the first non-empty row
    const firstDataRow = dataRows.find(row =>
      row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );

    const rfcReceptor = rfcIndex >= 0 && firstDataRow
      ? String(firstDataRow[rfcIndex] ?? 'Sin RFC')
      : 'Sin RFC';

    const razonReceptor = razonIndex >= 0 && firstDataRow
      ? String(firstDataRow[razonIndex] ?? 'Sin Razón Social')
      : 'Sin Razón Social';

    return { rfcReceptor, razonReceptor };
  };

  /**
   * Processes a single Excel workbook
   */
  const processWorkbook = (workbook: XLSX.WorkBook, fileName: string): ProcessedFile => {
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error(`"${fileName}" no contiene hojas de cálculo.`);
    }

    const sheet = workbook.Sheets[sheetName];
    const rawData: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    if (rawData.length === 0) {
      throw new Error(`"${fileName}" está vacío.`);
    }

    const originalHeaders = rawData[0].map(h => String(h ?? ''));
    const dataRows = rawData.slice(1);

    // Extract receptor info before removing columns
    const { rfcReceptor, razonReceptor } = extractReceptorInfo(originalHeaders, dataRows);

    // Build column mapping (excluding removed columns)
    const columnMapping: { originalIndex: number; header: string; sumKey: string | null }[] = [];
    const removedColumns: string[] = [];

    originalHeaders.forEach((header, index) => {
      if (shouldRemoveColumn(header)) {
        removedColumns.push(header);
      } else {
        columnMapping.push({
          originalIndex: index,
          header,
          sumKey: getSumColumnKey(header),
        });
      }
    });

    const newHeaders = columnMapping.map(col => col.header);

    // Find the "Uso CFDI" column index in the NEW headers (after column removal)
    const usoCfdiIndex = newHeaders.findIndex(
      h => normalizeColumnName(h) === normalizeColumnName(USO_CFDI_COLUMN)
    );

    // Initialize sums for regular and nómina rows
    const sums: ColumnSums = {};
    const nominaSums: ColumnSums = {};
    COLUMNS_TO_SUM.forEach(col => {
      sums[col] = 0;
      nominaSums[col] = 0;
    });

    // Separate rows into: regular, nómina, and pagos
    const newRows: (string | number | null)[][] = [];
    const nominaRows: (string | number | null)[][] = [];
    const pagosRows: (string | number | null)[][] = [];

    for (const row of dataRows) {
      const hasData = row.some(cell => cell !== null && cell !== undefined && cell !== '');
      if (!hasData) continue;

      const newRow: (string | number | null)[] = [];

      for (const colInfo of columnMapping) {
        const value = row[colInfo.originalIndex];
        newRow.push(value);
      }

      // Check the "Uso CFDI" value to categorize the row
      const usoCfdiValue = usoCfdiIndex >= 0 ? String(newRow[usoCfdiIndex] ?? '').trim() : '';

      if (usoCfdiValue === USO_CFDI_PAGOS) {
        // Pagos rows - no totals calculation
        pagosRows.push(newRow);
      } else if (usoCfdiValue === USO_CFDI_NOMINA) {
        // Nómina rows - calculate separate totals
        nominaRows.push(newRow);
        for (const colInfo of columnMapping) {
          if (colInfo.sumKey) {
            const colIndex = columnMapping.indexOf(colInfo);
            nominaSums[colInfo.sumKey] += parseNumericValue(newRow[colIndex]);
          }
        }
      } else {
        // Regular rows - calculate regular totals
        newRows.push(newRow);
        for (const colInfo of columnMapping) {
          if (colInfo.sumKey) {
            const colIndex = columnMapping.indexOf(colInfo);
            sums[colInfo.sumKey] += parseNumericValue(newRow[colIndex]);
          }
        }
      }
    }

    return {
      id: generateId(),
      fileName,
      rfcReceptor,
      razonReceptor,
      headers: newHeaders,
      rows: newRows,
      sums,
      nominaRows,
      nominaSums,
      pagosRows,
      originalRowCount: dataRows.length,
      removedColumns,
    };
  };

  /**
   * Downloads the processed Excel file for a specific tab
   *
   * OUTPUT STRUCTURE:
   * 1. Headers
   * 2. Regular data rows
   * 3. Empty row
   * 4. TOTALES row (regular)
   * 5. Empty row
   * 6. 5 empty rows separator
   * 7. Nómina rows (if any)
   * 8. Empty row
   * 9. TOTALES NÓMINA row
   * 10. Empty row
   * 11. 5 empty rows separator
   * 12. Pagos rows (if any) - no totals
   */
  const downloadProcessedExcel = useCallback((fileData: ProcessedFile) => {
    const wsData: (string | number | null)[][] = [];
    const emptyRow: (string | number | null)[] = fileData.headers.map(() => null);

    // Helper function to create a totals row
    const createTotalsRow = (label: string, sums: ColumnSums): (string | number | null)[] => {
      return fileData.headers.map((header, index) => {
        if (index === 0) {
          return label;
        }
        const sumKey = getSumColumnKey(header);
        if (sumKey && sums[sumKey] !== undefined) {
          return sums[sumKey];
        }
        return null;
      });
    };

    // Add headers
    wsData.push(fileData.headers);

    // Add regular rows
    wsData.push(...fileData.rows);

    // Add empty row before totals
    wsData.push(emptyRow);

    // Add regular totals row
    wsData.push(createTotalsRow('TOTALES', fileData.sums));

    // Add empty row after totals
    wsData.push(emptyRow);

    // If there are Nómina rows, add them with their totals
    if (fileData.nominaRows.length > 0) {
      // Add 5 empty rows as separator
      for (let i = 0; i < 5; i++) {
        wsData.push(emptyRow);
      }

      // Add Nómina rows
      wsData.push(...fileData.nominaRows);

      // Add empty row before nómina totals
      wsData.push(emptyRow);

      // Add Nómina totals row
      wsData.push(createTotalsRow('TOTALES NÓMINA', fileData.nominaSums));

      // Add empty row after nómina totals
      wsData.push(emptyRow);
    }

    // If there are Pagos rows, add them (no totals)
    if (fileData.pagosRows.length > 0) {
      // Add 5 empty rows as separator
      for (let i = 0; i < 5; i++) {
        wsData.push(emptyRow);
      }

      // Add Pagos rows (no totals for these)
      wsData.push(...fileData.pagosRows);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Find which column indices need number formatting (the COLUMNS_TO_SUM)
    const numericColumnIndices: number[] = [];
    fileData.headers.forEach((header, index) => {
      if (getSumColumnKey(header)) {
        numericColumnIndices.push(index);
      }
    });

    // Apply number format with comma separators to all numeric columns
    // Format: #,##0.00 displays 1234567.89 as 1,234,567.89
    const NUMBER_FORMAT = '#,##0.00';

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Iterate through all rows (starting from row 1 to skip headers)
    for (let rowIdx = 1; rowIdx <= range.e.r; rowIdx++) {
      for (const colIdx of numericColumnIndices) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        const cell = ws[cellAddress];

        // Only format cells that exist and have numeric values
        if (cell && typeof cell.v === 'number') {
          cell.z = NUMBER_FORMAT;
        }
      }
    }

    const colWidths = fileData.headers.map(header => ({
      wch: Math.max(header.length + 2, 20), // Comfortable width for formatted numbers
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Datos Procesados');

    const baseName = fileData.fileName.replace(/\.[^/.]+$/, '');
    XLSX.writeFile(wb, `${baseName}_procesado.xlsx`);
  }, []);

  /**
   * Handles multiple file selection and processing
   */
  const handleFilesSelect = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      file => file.name.toLowerCase().endsWith('.xlsx')
    );

    if (fileArray.length === 0) {
      setError('Por favor selecciona archivos Excel (.xlsx)');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingProgress({ current: 0, total: fileArray.length });

    const newProcessedFiles: ProcessedFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProcessingProgress({ current: i + 1, total: fileArray.length });

      try {
        const workbook = await readExcelFile(file);
        const processed = processWorkbook(workbook, file.name);
        newProcessedFiles.push(processed);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Error en "${file.name}"`);
      }
    }

    if (newProcessedFiles.length > 0) {
      setProcessedFiles(prev => [...prev, ...newProcessedFiles]);
      setActiveTabIndex(processedFiles.length); // Switch to first new file
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setIsProcessing(false);
    setProcessingProgress(null);
  };

  /**
   * File input change handler
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
    }
    // Reset input to allow selecting same files again
    e.target.value = '';
  };

  /**
   * Drag and drop handlers
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  }, [processedFiles.length]);

  /**
   * Remove a specific file from the list
   */
  const removeFile = (fileId: string) => {
    setProcessedFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      return newFiles;
    });
    // Reset active tab to avoid out of bounds
    setActiveTabIndex(0);
  };

  /**
   * Reset all state
   */
  const reset = () => {
    setProcessedFiles([]);
    setError(null);
    setActiveTabIndex(0);
  };

  /**
   * Filter files based on search term (RFC or Razon Social)
   */
  const filteredFiles = processedFiles.filter(file => {
    if (!searchFilter.trim()) return true;
    const search = searchFilter.toLowerCase().trim();
    return (
      file.rfcReceptor.toLowerCase().includes(search) ||
      file.razonReceptor.toLowerCase().includes(search)
    );
  });

  const activeFile = filteredFiles[activeTabIndex];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Subir Archivos Excel
        </h2>

        <p className="text-gray-600 mb-6">
          Sube uno o más archivos Excel (.xlsx) con datos de CFDI. Cada archivo
          se procesará por separado y se mostrará en pestañas organizadas por
          RFC Receptor.
        </p>

        {/* Drag and Drop Zone */}
        <div
          className={`relative mb-6 ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label
            htmlFor="excel-upload"
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className={`w-10 h-10 mb-3 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click para seleccionar</span> o arrastra y suelta
              </p>
              <p className="text-xs text-gray-500">
                Múltiples archivos Excel (.xlsx)
              </p>
            </div>
            <input
              id="excel-upload"
              type="file"
              className="hidden"
              accept=".xlsx"
              multiple
              onChange={handleInputChange}
              disabled={isProcessing}
            />
          </label>
        </div>

        {/* Processing Progress */}
        {isProcessing && processingProgress && (
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
                Procesando archivos... ({processingProgress.current}/{processingProgress.total})
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        {processedFiles.length > 0 && (
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Limpiar todo y empezar de nuevo
          </button>
        )}
      </div>

      {/* Tabs and Results Section */}
      {processedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Search Filter */}
          {processedFiles.length > 1 && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por RFC o Razón Social..."
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    setActiveTabIndex(0); // Reset to first tab when filtering
                  }}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {searchFilter && (
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setActiveTabIndex(0);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchFilter && (
                <p className="mt-2 text-sm text-gray-500">
                  Mostrando {filteredFiles.length} de {processedFiles.length} archivos
                </p>
              )}
            </div>
          )}

          {/* Tabs Header */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max">
              {filteredFiles.map((file, index) => (
                <div
                  key={file.id}
                  onClick={() => setActiveTabIndex(index)}
                  className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeTabIndex === index
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  role="tab"
                  aria-selected={activeTabIndex === index}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveTabIndex(index);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-left">
                      <div className="font-semibold">{file.rfcReceptor}</div>
                      <div className="text-xs text-gray-500 max-w-[150px] truncate">
                        {file.razonReceptor}
                      </div>
                    </div>
                    {/* Close button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                      title="Eliminar archivo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* No Results Message */}
          {filteredFiles.length === 0 && searchFilter && (
            <div className="p-8 text-center">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg mb-2">
                No se encontraron resultados
              </p>
              <p className="text-gray-400 text-sm">
                No hay archivos que coincidan con &quot;{searchFilter}&quot;
              </p>
              <button
                onClick={() => {
                  setSearchFilter('');
                  setActiveTabIndex(0);
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}

          {/* Active Tab Content */}
          {activeFile && (
            <div className="p-6">
              {/* Receptor Header */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {activeFile.razonReceptor}
                    </h3>
                    <p className="font-mono text-sm text-gray-500">
                      RFC: {activeFile.rfcReceptor}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Archivo: {activeFile.fileName}
                  </p>
                </div>
              </div>

              {/* Summary Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    Resumen de Totales
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {activeFile.rows.length} filas regulares
                    {activeFile.nominaRows.length > 0 && ` • ${activeFile.nominaRows.length} filas nómina`}
                    {activeFile.pagosRows.length > 0 && ` • ${activeFile.pagosRows.length} filas pagos`}
                    {' '}• {activeFile.removedColumns.length} columnas eliminadas
                  </p>
                </div>
                <button
                  onClick={() => downloadProcessedExcel(activeFile)}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Descargar Excel
                </button>
              </div>

              {/* Regular Totals Grid */}
              <div className="mb-6">
                <h5 className="text-md font-semibold text-gray-700 mb-3">
                  Totales Regulares ({activeFile.rows.length} filas)
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {COLUMNS_TO_SUM.map((col) => (
                    <div
                      key={col}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <p className="text-sm text-gray-500 mb-1">{col}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(activeFile.sums[col] || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nómina Totals Grid (only if there are nómina rows) */}
              {activeFile.nominaRows.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-md font-semibold text-gray-700 mb-3">
                    Totales Nómina ({activeFile.nominaRows.length} filas)
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {COLUMNS_TO_SUM.map((col) => (
                      <div
                        key={`nomina-${col}`}
                        className="bg-blue-50 rounded-lg p-4 border border-blue-200"
                      >
                        <p className="text-sm text-blue-600 mb-1">{col}</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatCurrency(activeFile.nominaSums[col] || 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagos Info (no totals, just count) */}
              {activeFile.pagosRows.length > 0 && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-semibold text-purple-800">
                    Pagos (CP01 - Pagos): {activeFile.pagosRows.length} filas
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Las filas de pagos se incluyen en el Excel descargado sin cálculo de totales.
                  </p>
                </div>
              )}

              {/* Removed Columns Info */}
              {activeFile.removedColumns.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">
                    Columnas eliminadas:
                  </p>
                  <p className="text-sm text-yellow-700">
                    {activeFile.removedColumns.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
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
              Tus archivos Excel nunca se suben a ningún servidor. Todo el procesamiento
              ocurre directamente en tu navegador. Al cerrar esta página, todos
              los datos se eliminan automáticamente de la memoria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

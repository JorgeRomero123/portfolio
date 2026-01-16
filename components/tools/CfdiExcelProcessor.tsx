'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

/**
 * CFDI Excel Processor Component
 *
 * PURPOSE:
 * This component processes Excel files containing CFDI (Mexican electronic invoice) data.
 * It removes specific columns that are not needed, calculates totals for financial columns,
 * and generates a clean Excel file for download.
 *
 * WHY CLIENT-SIDE PROCESSING?
 * - Avoids Vercel's serverless function limits
 * - No file upload to servers = faster processing
 * - Privacy: financial data never leaves the browser
 * - Works offline after page load
 *
 * EXCEL PROCESSING FLOW:
 * 1. User uploads .xlsx file
 * 2. SheetJS (xlsx) parses the file in the browser
 * 3. First row is treated as headers
 * 4. Specified columns are removed
 * 5. Numeric columns are summed
 * 6. New Excel file is generated with totals row
 * 7. User downloads the processed file
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
 * Represents the calculated sums for display
 */
interface ColumnSums {
  [key: string]: number;
}

/**
 * Represents the processed Excel data
 */
interface ProcessedData {
  headers: string[];
  rows: (string | number | null)[][];
  sums: ColumnSums;
  originalRowCount: number;
  removedColumns: string[];
}

/**
 * Parses a value that might be a string or number into a number
 * Handles various formats like "1,234.56", "$1,234.56", etc.
 *
 * @param value - The value to parse
 * @returns The parsed number or 0 if unparseable
 */
function parseNumericValue(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // If already a number, return it
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  // Convert to string and clean it
  const strValue = String(value)
    .replace(/[$,\s]/g, '')  // Remove currency symbols, commas, spaces
    .replace(/\(([^)]+)\)/, '-$1')  // Convert (123) to -123 (accounting format)
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
 * Handles case differences and extra whitespace
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

export default function CfdiExcelProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

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
        } catch (err) {
          reject(new Error('No se pudo leer el archivo Excel. Verifica que sea un archivo .xlsx válido.'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Processes the Excel workbook according to the rules
   *
   * PROCESSING STEPS:
   * 1. Get the first sheet from the workbook
   * 2. Convert to JSON with headers
   * 3. Identify columns to remove and columns to sum
   * 4. Filter out removed columns
   * 5. Calculate sums for specified columns
   * 6. Return processed data structure
   */
  const processWorkbook = (workbook: XLSX.WorkBook): ProcessedData => {
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('El archivo Excel no contiene hojas de cálculo.');
    }

    const sheet = workbook.Sheets[sheetName];

    // Convert to array of arrays (including headers)
    const rawData: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    if (rawData.length === 0) {
      throw new Error('El archivo Excel está vacío.');
    }

    // First row is headers
    const originalHeaders = rawData[0].map(h => String(h ?? ''));
    const dataRows = rawData.slice(1);

    // Identify which column indices to keep and which to remove
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

    // Build new headers (without removed columns)
    const newHeaders = columnMapping.map(col => col.header);

    // Initialize sums
    const sums: ColumnSums = {};
    COLUMNS_TO_SUM.forEach(col => {
      sums[col] = 0;
    });

    // Process data rows: filter columns and calculate sums
    const newRows: (string | number | null)[][] = [];

    for (const row of dataRows) {
      // Skip completely empty rows
      const hasData = row.some(cell => cell !== null && cell !== undefined && cell !== '');
      if (!hasData) continue;

      const newRow: (string | number | null)[] = [];

      for (const colInfo of columnMapping) {
        const value = row[colInfo.originalIndex];
        newRow.push(value);

        // If this column should be summed, add to total
        if (colInfo.sumKey) {
          sums[colInfo.sumKey] += parseNumericValue(value);
        }
      }

      newRows.push(newRow);
    }

    return {
      headers: newHeaders,
      rows: newRows,
      sums,
      originalRowCount: dataRows.length,
      removedColumns,
    };
  };

  /**
   * Generates and downloads the processed Excel file
   *
   * OUTPUT FILE STRUCTURE:
   * - Row 1: Headers (without removed columns)
   * - Rows 2-N: Original data rows
   * - Last Row: "TOTALES" with sums for specified columns
   */
  const downloadProcessedExcel = useCallback(() => {
    if (!processedData) return;

    // Create worksheet data
    const wsData: (string | number | null)[][] = [];

    // Add headers
    wsData.push(processedData.headers);

    // Add data rows
    wsData.push(...processedData.rows);

    // Add totals row
    const totalsRow: (string | number | null)[] = processedData.headers.map((header, index) => {
      if (index === 0) {
        return 'TOTALES';
      }
      const sumKey = getSumColumnKey(header);
      if (sumKey && processedData.sums[sumKey] !== undefined) {
        return processedData.sums[sumKey];
      }
      return null;
    });
    wsData.push(totalsRow);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for better readability
    const colWidths = processedData.headers.map(header => ({
      wch: Math.max(header.length + 2, 12),
    }));
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Datos Procesados');

    // Generate the file and trigger download
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    XLSX.writeFile(wb, `${baseName}_procesado.xlsx`);
  }, [processedData, fileName]);

  /**
   * Handles file selection and processing
   */
  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Por favor selecciona un archivo Excel (.xlsx)');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessedData(null);
    setFileName(file.name);

    try {
      const workbook = await readExcelFile(file);
      const processed = processWorkbook(workbook);
      setProcessedData(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * File input change handler
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  /**
   * Reset the component state
   */
  const reset = () => {
    setProcessedData(null);
    setError(null);
    setFileName('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Subir Archivo Excel
        </h2>

        <p className="text-gray-600 mb-6">
          Sube un archivo Excel (.xlsx) con datos de CFDI. El sistema eliminará
          las columnas no necesarias y calculará los totales automáticamente.
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
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className={`w-12 h-12 mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}
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
                Archivo Excel (.xlsx)
              </p>
            </div>
            <input
              id="excel-upload"
              type="file"
              className="hidden"
              accept=".xlsx"
              onChange={handleInputChange}
              disabled={isProcessing}
            />
          </label>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
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
                Procesando archivo...
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mr-3 mt-0.5"
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
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        {processedData && (
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Procesar otro archivo
          </button>
        )}
      </div>

      {/* Results Section */}
      {processedData && (
        <>
          {/* Summary Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Resumen de Totales
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {processedData.rows.length} filas procesadas • {processedData.removedColumns.length} columnas eliminadas
                </p>
              </div>
              <button
                onClick={downloadProcessedExcel}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
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

            {/* Totals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {COLUMNS_TO_SUM.map((col) => (
                <div
                  key={col}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-sm text-gray-500 mb-1">{col}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(processedData.sums[col] || 0)}
                  </p>
                </div>
              ))}
            </div>

            {/* Removed Columns Info */}
            {processedData.removedColumns.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  Columnas eliminadas:
                </p>
                <p className="text-sm text-yellow-700">
                  {processedData.removedColumns.join(', ')}
                </p>
              </div>
            )}
          </div>
        </>
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
              Tu archivo Excel nunca se sube a ningún servidor. Todo el procesamiento
              ocurre directamente en tu navegador. Al cerrar esta página, todos
              los datos se eliminan automáticamente de la memoria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

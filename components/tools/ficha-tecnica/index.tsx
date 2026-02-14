'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { PropertyData, TemplateId, ColorPaletteId, ColorPalette } from './types';
import { DEFAULT_PROPERTY_DATA, COLOR_PALETTES } from './constants';
import TemplatePicker from './TemplatePicker';
import PropertyForm from './PropertyForm';
import ImageManager from './ImageManager';

const AGENT_STORAGE_KEY = 'ficha-tecnica-agent';

export default function FichaTecnica() {
  const [data, setData] = useState<PropertyData>(DEFAULT_PROPERTY_DATA);
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [paletteId, setPaletteId] = useState<ColorPaletteId>('navy-orange');
  const [customPalette, setCustomPalette] = useState<{ primary: string; accent: string } | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load agent info from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AGENT_STORAGE_KEY);
      if (saved) {
        const agent = JSON.parse(saved);
        setData((prev) => ({ ...prev, agent: { ...prev.agent, ...agent } }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Save agent info to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(data.agent));
    } catch {
      // ignore storage errors
    }
  }, [data.agent]);

  const activePalette: ColorPalette = customPalette
    ? { id: 'navy-orange', name: 'Custom', primary: customPalette.primary, accent: customPalette.accent, accentLight: customPalette.accent }
    : (COLOR_PALETTES.find((p) => p.id === paletteId) || COLOR_PALETTES[0]);

  const isValid = data.title.trim() && data.price > 0 && data.images.length >= 1 && data.agent.name.trim();

  const handleDataChange = useCallback((updated: PropertyData) => {
    setData(updated);
    // Clear previous PDF when data changes
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [pdfUrl]);

  const handleImagesChange = useCallback(
    (images: PropertyData['images']) => {
      handleDataChange({ ...data, images });
    },
    [data, handleDataChange]
  );

  const generatePdf = useCallback(async () => {
    if (!isValid) return;
    setGenerating(true);
    setError(null);

    try {
      // Dynamic imports to avoid SSR crashes
      const { pdf } = await import('@react-pdf/renderer');

      let TemplateComponent: React.ComponentType<{ data: PropertyData; palette: ColorPalette }>;
      if (template === 'modern') {
        const mod = await import('./templates/ModernTemplate');
        TemplateComponent = mod.default;
      } else {
        const mod = await import('./templates/ClassicTemplate');
        TemplateComponent = mod.default;
      }

      const doc = React.createElement(TemplateComponent, { data, palette: activePalette });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(doc as any).toBlob();

      // Revoke previous URL
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  }, [data, template, isValid, pdfUrl, activePalette]);

  const downloadPdf = useCallback(() => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    const filename = `${data.title || 'ficha-tecnica'}.pdf`
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .-]/g, '')
      .replace(/\s+/g, '-');
    link.download = filename;
    link.href = pdfUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, data.title]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Template & Palette Selection */}
      <TemplatePicker
        selectedTemplate={template}
        onTemplateChange={setTemplate}
        selectedPalette={paletteId}
        onPaletteChange={(id) => { setPaletteId(id); setCustomPalette(null); }}
      />

      {/* Custom Color Picker */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Colores Personalizados</h2>
        <p className="text-sm text-gray-500 mb-3">
          O elige tus propios colores primario y de acento.
        </p>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Primario</label>
            <input
              type="color"
              value={customPalette?.primary || activePalette.primary}
              onChange={(e) => setCustomPalette((prev) => ({
                primary: e.target.value,
                accent: prev?.accent || activePalette.accent,
              }))}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300"
            />
            <span className="text-xs text-gray-400 font-mono">
              {customPalette?.primary || activePalette.primary}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Acento</label>
            <input
              type="color"
              value={customPalette?.accent || activePalette.accent}
              onChange={(e) => setCustomPalette((prev) => ({
                primary: prev?.primary || activePalette.primary,
                accent: e.target.value,
              }))}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300"
            />
            <span className="text-xs text-gray-400 font-mono">
              {customPalette?.accent || activePalette.accent}
            </span>
          </div>
          {customPalette && (
            <button
              onClick={() => setCustomPalette(null)}
              className="text-sm text-gray-500 hover:text-gray-700 self-center"
            >
              Resetear a paleta
            </button>
          )}
        </div>
      </div>

      {/* Property Form */}
      <PropertyForm data={data} onChange={handleDataChange} />

      {/* Image Manager */}
      <ImageManager images={data.images} onChange={handleImagesChange} />

      {/* Generate Button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={generatePdf}
          disabled={!isValid || generating}
          className={`w-full sm:w-auto px-8 py-3 rounded-lg text-white font-semibold text-lg transition-all ${
            isValid && !generating
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generando PDF...
            </span>
          ) : (
            'Generar Ficha Técnica'
          )}
        </button>

        {!isValid && (
          <p className="text-sm text-gray-500">
            Completa: título, precio, al menos 1 foto y nombre del agente
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* PDF Preview */}
      {pdfUrl && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Vista Previa</h2>
            <button
              onClick={downloadPdf}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
            <iframe
              src={pdfUrl}
              className="w-full h-[600px] sm:h-[800px]"
              title="Vista previa del PDF"
            />
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-700 mb-1">100% Procesamiento Local</p>
        <p className="text-sm text-gray-500">
          Tus datos e imágenes se procesan en tu navegador. El PDF se genera completamente en el cliente — nada se sube a ningún servidor.
        </p>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { TemplateId, ColorPaletteId } from './types';
import { COLOR_PALETTES } from './constants';

interface Props {
  selectedTemplate: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  selectedPalette: ColorPaletteId;
  onPaletteChange: (id: ColorPaletteId) => void;
}

const templates: { id: TemplateId; name: string; desc: string }[] = [
  { id: 'classic', name: 'Clásico', desc: 'Diseño limpio corporativo con header y layout de dos columnas' },
  { id: 'modern', name: 'Moderno', desc: 'Header con imagen a pantalla completa y estilo bold' },
];

export default function TemplatePicker({ selectedTemplate, onTemplateChange, selectedPalette, onPaletteChange }: Props) {
  const palette = COLOR_PALETTES.find((p) => p.id === selectedPalette) || COLOR_PALETTES[0];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Color Palette */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Paleta de Colores</h2>
        <div className="flex flex-wrap gap-3">
          {COLOR_PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => onPaletteChange(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                selectedPalette === p.id
                  ? 'border-gray-900 ring-1 ring-gray-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex gap-0.5">
                <div className="w-5 h-5 rounded-l-md" style={{ backgroundColor: p.primary }} />
                <div className="w-5 h-5 rounded-r-md" style={{ backgroundColor: p.accent }} />
              </div>
              <span className="text-gray-700">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Seleccionar Plantilla</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => onTemplateChange(t.id)}
              className={`text-left rounded-lg border-2 overflow-hidden transition-all ${
                selectedTemplate === t.id
                  ? 'ring-2 ring-gray-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={selectedTemplate === t.id ? { borderColor: palette.accent } : undefined}
            >
              {/* CSS mockup of template using selected palette colors */}
              <div className="h-40 relative overflow-hidden">
                {t.id === 'classic' ? (
                  <div className="h-full flex flex-col">
                    <div className="h-5 flex items-center justify-between px-2" style={{ backgroundColor: palette.primary }}>
                      <div className="w-8 h-2 bg-white/40 rounded" />
                      <div className="w-10 h-2 bg-white/30 rounded" />
                    </div>
                    <div className="h-16 bg-gradient-to-br from-gray-300 to-gray-400" />
                    <div className="flex-1 bg-gray-50 px-2 py-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="w-20 h-2 rounded" style={{ backgroundColor: palette.primary }} />
                        <div className="w-12 h-2 rounded" style={{ backgroundColor: palette.accent }} />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="w-full h-1 bg-gray-200 rounded" />
                          <div className="w-4/5 h-1 bg-gray-200 rounded" />
                          <div className="w-3/5 h-1 bg-gray-200 rounded" />
                        </div>
                        <div className="w-16 space-y-1">
                          <div className="w-full h-1 bg-gray-300 rounded" />
                          <div className="w-full h-1 bg-gray-300 rounded" />
                          <div className="w-full h-1 bg-gray-300 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="h-3" style={{ backgroundColor: palette.primary }} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="h-20 bg-gradient-to-br from-gray-600 to-gray-800 relative">
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="w-6 h-1.5 rounded mb-1" style={{ backgroundColor: palette.accent }} />
                        <div className="w-24 h-2 bg-white rounded mb-0.5" />
                        <div className="w-16 h-2 rounded" style={{ backgroundColor: palette.accentLight }} />
                      </div>
                    </div>
                    <div className="flex justify-around py-2" style={{ backgroundColor: palette.primary }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="text-center">
                          <div className="w-4 h-3 rounded mx-auto mb-0.5" style={{ backgroundColor: palette.accent }} />
                          <div className="w-5 h-1 bg-white/30 rounded mx-auto" />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 bg-white px-2 py-1 space-y-1">
                      <div className="w-full h-1 bg-gray-200 rounded" />
                      <div className="w-4/5 h-1 bg-gray-200 rounded" />
                      <div className="w-3/5 h-1 bg-gray-200 rounded" />
                    </div>
                    <div className="h-4 flex items-center px-2" style={{ backgroundColor: palette.primary }}>
                      <div className="w-3 h-3 bg-gray-400 rounded-full mr-1" />
                      <div className="w-10 h-1 bg-white/30 rounded" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

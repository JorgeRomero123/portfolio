'use client';

import React, { useState, useCallback } from 'react';
import type { PropertyData } from './types';
import { OPERATION_TYPES, PROPERTY_TYPES, MEXICAN_STATES, AMENITY_PRESETS } from './constants';
import { processImageFile } from './utils';

interface Props {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

export default function PropertyForm({ data, onChange }: Props) {
  const [customAmenity, setCustomAmenity] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const update = useCallback(
    <K extends keyof PropertyData>(key: K, value: PropertyData[K]) => {
      onChange({ ...data, [key]: value });
    },
    [data, onChange]
  );

  const updateAgent = useCallback(
    (key: keyof PropertyData['agent'], value: string) => {
      onChange({ ...data, agent: { ...data.agent, [key]: value } });
    },
    [data, onChange]
  );

  const toggleAmenity = useCallback(
    (amenity: string) => {
      const amenities = data.amenities.includes(amenity)
        ? data.amenities.filter((a) => a !== amenity)
        : [...data.amenities, amenity];
      update('amenities', amenities);
    },
    [data.amenities, update]
  );

  const addCustomAmenity = useCallback(() => {
    const trimmed = customAmenity.trim();
    if (trimmed && !data.amenities.includes(trimmed)) {
      update('amenities', [...data.amenities, trimmed]);
      setCustomAmenity('');
    }
  }, [customAmenity, data.amenities, update]);

  const handleAgentImageUpload = useCallback(
    async (key: 'photo' | 'companyLogo', file: File) => {
      try {
        const result = await processImageFile(file, 400);
        updateAgent(key, result.dataUrl);
      } catch {
        // Silently fail for agent photo uploads
      }
    },
    [updateAgent]
  );

  const generateDescription = useCallback(async () => {
    setGeneratingDesc(true);
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: data.propertyType,
          operationType: data.operationType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          totalArea: data.totalArea,
          builtArea: data.builtArea,
          amenities: data.amenities,
          colonia: data.colonia,
          city: data.city,
          state: data.state,
          images: data.images.slice(0, 4).map((img) => img.dataUrl),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      if (json.description) {
        update('description', json.description);
      }
    } catch {
      // AI generation is optional — fail silently
    } finally {
      setGeneratingDesc(false);
    }
  }, [data, update]);

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Datos del Inmueble</h2>

      {/* Section 1: Basic Info */}
      <Section title="Información Básica">
        {/* Operation Type */}
        <div>
          <label className={labelClass}>Tipo de Operación</label>
          <div className="flex gap-4">
            {OPERATION_TYPES.map((op) => (
              <label key={op.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="operationType"
                  value={op.value}
                  checked={data.operationType === op.value}
                  onChange={() => update('operationType', op.value)}
                  className="accent-orange-500"
                />
                <span className="text-sm text-gray-700">{op.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className={labelClass}>Tipo de Propiedad</label>
          <select
            value={data.propertyType}
            onChange={(e) => update('propertyType', e.target.value as PropertyData['propertyType'])}
            className={inputClass}
          >
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>Título de la Propiedad *</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Ej: Hermosa Casa en Residencial Las Palmas"
            className={inputClass}
          />
        </div>

        {/* Price + Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Precio *</label>
            <input
              type="text"
              inputMode="numeric"
              value={data.price ? new Intl.NumberFormat('en-US').format(data.price) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                update('price', raw ? Number(raw) : 0);
              }}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Moneda</label>
            <select
              value={data.currency}
              onChange={(e) => update('currency', e.target.value as PropertyData['currency'])}
              className={inputClass}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <button
              type="button"
              onClick={generateDescription}
              disabled={generatingDesc}
              className="text-xs text-orange-600 hover:text-orange-700 disabled:text-gray-400 flex items-center gap-1"
            >
              {generatingDesc ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando...
                </>
              ) : (
                'Generar con IA'
              )}
            </button>
          </div>
          <textarea
            value={data.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe la propiedad..."
            rows={4}
            className={inputClass}
          />
        </div>
      </Section>

      {/* Section 2: Specs */}
      <Section title="Especificaciones" defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'totalArea' as const, label: 'Superficie Total (m²)' },
            { key: 'builtArea' as const, label: 'Superficie Construida (m²)' },
            { key: 'bedrooms' as const, label: 'Recámaras' },
            { key: 'bathrooms' as const, label: 'Baños' },
            { key: 'halfBathrooms' as const, label: 'Medios Baños' },
            { key: 'parkingSpots' as const, label: 'Estacionamientos' },
            { key: 'floors' as const, label: 'Niveles' },
            { key: 'age' as const, label: 'Antigüedad (años)' },
          ].map((field) => (
            <div key={field.key}>
              <label className={labelClass}>{field.label}</label>
              <input
                type="number"
                min="0"
                value={data[field.key] || ''}
                onChange={(e) => update(field.key, Number(e.target.value))}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Section 3: Location */}
      <Section title="Ubicación" defaultOpen={false}>
        <div>
          <label className={labelClass}>Dirección</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Calle y número"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Colonia</label>
            <input
              type="text"
              value={data.colonia}
              onChange={(e) => update('colonia', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ciudad</label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => update('city', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Estado</label>
            <select
              value={data.state}
              onChange={(e) => update('state', e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar...</option>
              {MEXICAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Código Postal</label>
            <input
              type="text"
              value={data.zipCode}
              onChange={(e) => update('zipCode', e.target.value)}
              maxLength={5}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Enlace de Google Maps</label>
          <input
            type="url"
            value={data.mapsUrl}
            onChange={(e) => update('mapsUrl', e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className={inputClass}
          />
        </div>
      </Section>

      {/* Section 4: Amenities */}
      <Section title="Amenidades" defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITY_PRESETS.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={data.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="accent-orange-500 w-4 h-4"
              />
              <span className="text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
        {/* Custom amenities that aren't in the preset */}
        {data.amenities
          .filter((a) => !AMENITY_PRESETS.includes(a))
          .map((a) => (
            <div key={a} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked readOnly className="accent-orange-500 w-4 h-4" />
              <span className="text-gray-700">{a}</span>
              <button
                onClick={() => toggleAmenity(a)}
                className="text-red-400 hover:text-red-600 text-xs ml-auto"
              >
                Quitar
              </button>
            </div>
          ))}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomAmenity()}
            placeholder="Agregar amenidad..."
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={addCustomAmenity}
            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
          >
            Agregar
          </button>
        </div>
      </Section>

      {/* Section 5: Agent Info */}
      <Section title="Información del Agente" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              type="text"
              value={data.agent.name}
              onChange={(e) => updateAgent('name', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              type="tel"
              value={data.agent.phone}
              onChange={(e) => updateAgent('phone', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={data.agent.email}
              onChange={(e) => updateAgent('email', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Empresa</label>
            <input
              type="text"
              value={data.agent.company}
              onChange={(e) => updateAgent('company', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Foto del Agente</label>
            <div className="flex items-center gap-3">
              {data.agent.photo && (
                <img
                  src={data.agent.photo}
                  alt="Agent"
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <label className="cursor-pointer text-sm text-orange-600 hover:text-orange-700">
                {data.agent.photo ? 'Cambiar' : 'Subir foto'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAgentImageUpload('photo', f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <label className={labelClass}>Logo de la Empresa</label>
            <div className="flex items-center gap-3">
              {data.agent.companyLogo && (
                <img
                  src={data.agent.companyLogo}
                  alt="Logo"
                  className="h-10 object-contain"
                />
              )}
              <label className="cursor-pointer text-sm text-orange-600 hover:text-orange-700">
                {data.agent.companyLogo ? 'Cambiar' : 'Subir logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAgentImageUpload('companyLogo', f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

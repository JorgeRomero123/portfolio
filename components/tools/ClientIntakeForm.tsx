'use client';

import { useState, useCallback, useRef } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'upload';
  placeholder: string;
}

interface FormSection {
  title: string;
  icon: string;
  description: string;
  fields: FormField[];
}

interface UploadedImage {
  publicUrl: string;
  key: string;
  filename: string;
}

// ── Form Schema ─────────────────────────────────────────────────────────────

const sections: FormSection[] = [
  {
    title: '1. Identidad del Negocio',
    icon: '🏢',
    description: 'Lo esencial sobre quiénes son y qué los hace únicos',
    fields: [
      { id: 'business_what', label: '¿A qué se dedican exactamente?', type: 'textarea', placeholder: 'En sus propias palabras, no el texto legal...' },
      { id: 'business_diff', label: '¿Qué los hace diferentes de su competencia?', type: 'textarea', placeholder: 'Lo que sus clientes dicen, no lo que ustedes creen...' },
      { id: 'business_brand', label: '¿Tienen logo, colores de marca, o material impreso?', type: 'text', placeholder: 'Sí/No — describe brevemente qué tienen' },
      { id: 'business_name', label: '¿Cuál es su nombre comercial y razón social?', type: 'text', placeholder: 'Nombre comercial / Razón social S.A. de C.V.' },
      { id: 'business_logo', label: 'Sube tu logo o materiales de marca', type: 'upload', placeholder: '' },
    ],
  },
  {
    title: '2. El Cliente Objetivo',
    icon: '🎯',
    description: 'Entender a quién le venden para diseñar pensando en ellos',
    fields: [
      { id: 'client_who', label: '¿Quién les compra?', type: 'textarea', placeholder: 'Cargo, industria, tamaño de empresa...' },
      { id: 'client_find', label: '¿Cómo los encuentra la gente actualmente?', type: 'text', placeholder: 'Recomendación, redes sociales, búsqueda en Google...' },
      { id: 'client_firstq', label: '¿Qué es lo primero que pregunta un cliente nuevo?', type: 'textarea', placeholder: 'Esto define el contenido del hero del sitio...' },
      { id: 'client_objection', label: '¿Qué objeción o duda frena a un cliente potencial?', type: 'textarea', placeholder: 'Esto define las secciones de confianza del sitio...' },
    ],
  },
  {
    title: '3. Servicios y Oferta',
    icon: '⚙️',
    description: 'Los servicios principales y cómo trabajan',
    fields: [
      { id: 'services_main', label: '¿Cuáles son sus servicios principales? (máx 3-5)', type: 'textarea', placeholder: 'Solo los principales, no la lista completa...' },
      { id: 'services_process', label: '¿Cuál es su proceso de trabajo?', type: 'textarea', placeholder: 'Paso a paso, como se lo explicarían a un cliente...' },
      { id: 'services_portfolio', label: '¿Tienen proyectos terminados con fotos?', type: 'text', placeholder: 'Sí/No — cuántos proyectos podrían mostrar' },
      { id: 'services_certs', label: '¿Manejan certificaciones, premios, o acreditaciones?', type: 'text', placeholder: 'ISO, NOM, premios de industria, etc.' },
      { id: 'services_photos', label: 'Sube fotos de proyectos terminados', type: 'upload', placeholder: '' },
    ],
  },
  {
    title: '4. Contacto y Conversión',
    icon: '📞',
    description: 'Cómo quieren que los contacten y quién responde',
    fields: [
      { id: 'contact_method', label: '¿Cómo quieren que los contacten?', type: 'text', placeholder: 'Teléfono, WhatsApp, formulario, email...' },
      { id: 'contact_who', label: '¿Quién va a recibir y responder los mensajes?', type: 'text', placeholder: 'Nombre y cargo de la persona responsable' },
      { id: 'contact_schedule', label: '¿Cuál es su horario y ubicación?', type: 'text', placeholder: 'Lun-Vie 9-18h, Col. Roma, CDMX' },
      { id: 'contact_social', label: '¿Usan redes sociales? ¿Cuáles?', type: 'text', placeholder: 'Instagram, Facebook, LinkedIn, TikTok...' },
    ],
  },
  {
    title: '5. Contenido Real',
    icon: '📸',
    description: 'Lo más difícil de obtener — fotos, testimonios, datos duros',
    fields: [
      { id: 'content_photos', label: '¿Tienen fotos reales de su equipo, instalaciones, o proyectos?', type: 'textarea', placeholder: 'Si no, hay que planear sesión fotográfica o usar placeholders...' },
      { id: 'content_testimonials', label: '¿Tienen testimonios de clientes?', type: 'textarea', placeholder: 'Con nombre y empresa idealmente...' },
      { id: 'content_numbers', label: '¿Cuántos años llevan? ¿Cuántos proyectos/clientes?', type: 'text', placeholder: 'Números concretos: 15 años, 200+ proyectos, etc.' },
      { id: 'content_upload', label: 'Sube fotos de equipo, instalaciones, o testimonios', type: 'upload', placeholder: '' },
    ],
  },
  {
    title: '6. Lo Técnico/Logístico',
    icon: '🔧',
    description: 'Dominio, hosting, mantenimiento y presupuesto',
    fields: [
      { id: 'tech_domain', label: '¿Tienen dominio web?', type: 'text', placeholder: 'ejemplo.com.mx — o qué nombre quieren' },
      { id: 'tech_hosting', label: '¿Tienen hosting o prefieren algo administrado?', type: 'text', placeholder: 'Vercel, hosting compartido, no sé...' },
      { id: 'tech_update', label: '¿Quién va a actualizar el contenido después?', type: 'text', placeholder: 'Esto define si necesitan CMS o no' },
      { id: 'tech_budget', label: '¿Presupuesto aproximado?', type: 'text', placeholder: 'Rango aproximado en MXN o USD' },
    ],
  },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function ClientIntakeForm() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, UploadedImage[]>>({});
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [exported, setExported] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateField = useCallback((id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  }, []);

  // ── AI Suggestion ───────────────────────────────────────────────────────

  const generateSuggestion = useCallback(async (fieldId: string, fieldLabel: string) => {
    setLoadingAI(fieldId);
    try {
      // Build a label→value map for context
      const allFields: Record<string, string> = {};
      for (const section of sections) {
        for (const field of section.fields) {
          if (field.type !== 'upload' && formData[field.id]) {
            allFields[field.label] = formData[field.id];
          }
        }
      }

      const res = await fetch('/api/intake-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldLabel,
          currentValue: formData[fieldId] || '',
          allFields,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate suggestion');
      const { suggestion } = await res.json();
      if (suggestion) {
        setFormData(prev => ({ ...prev, [fieldId]: suggestion }));
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
    } finally {
      setLoadingAI(null);
    }
  }, [formData]);

  // ── Image Upload ──────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingField(fieldId);

    try {
      const newUploads: UploadedImage[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        // 1. Get pre-signed URL
        const urlRes = await fetch('/api/intake-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });

        if (!urlRes.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, key, publicUrl } = await urlRes.json();

        // 2. Upload directly to R2
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload to R2');

        newUploads.push({ publicUrl, key, filename: file.name });
      }

      setUploads(prev => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), ...newUploads],
      }));
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingField(null);
    }
  }, []);

  const removeUpload = useCallback((fieldId: string, index: number) => {
    setUploads(prev => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter((_, i) => i !== index),
    }));
  }, []);

  // ── Export ────────────────────────────────────────────────────────────

  const exportAsJSON = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      sections: sections.map(section => ({
        title: section.title,
        fields: section.fields.map(field => ({
          label: field.label,
          value: field.type === 'upload'
            ? (uploads[field.id] || []).map(u => u.publicUrl)
            : formData[field.id] || '',
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intake-${formData.business_name?.replace(/\s+/g, '-').toLowerCase() || 'client'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }, [formData, uploads]);

  // ── Render ────────────────────────────────────────────────────────────

  const currentSection = sections[activeSection];
  const filledCount = sections.reduce((sum, s) =>
    sum + s.fields.filter(f => f.type === 'upload' ? (uploads[f.id]?.length || 0) > 0 : !!formData[f.id]?.trim()).length, 0
  );
  const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Progreso</span>
          <span className="text-sm font-medium text-gray-700">{filledCount}/{totalFields} campos</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / totalFields) * 100}%` }}
          />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {sections.map((section, i) => {
          const sectionFilled = section.fields.filter(f =>
            f.type === 'upload' ? (uploads[f.id]?.length || 0) > 0 : !!formData[f.id]?.trim()
          ).length;
          return (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                i === activeSection
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="mr-1.5">{section.icon}</span>
              <span className="hidden sm:inline">{section.title.split('. ')[1]}</span>
              {sectionFilled > 0 && (
                <span className={`ml-1.5 text-xs ${i === activeSection ? 'text-blue-200' : 'text-gray-400'}`}>
                  {sectionFilled}/{section.fields.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active section */}
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">{currentSection.icon}</span>
            {currentSection.title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{currentSection.description}</p>
        </div>

        <div className="space-y-6">
          {currentSection.fields.map((field) => (
            <div key={field.id}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                {field.type !== 'upload' && (
                  <button
                    onClick={() => generateSuggestion(field.id, field.label)}
                    disabled={loadingAI === field.id}
                    className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-100 hover:from-purple-100 hover:to-blue-100 transition-all duration-200 disabled:opacity-50"
                    title="Generar sugerencia con IA"
                  >
                    {loadingAI === field.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        IA
                      </>
                    )}
                  </button>
                )}
              </div>

              {field.type === 'upload' ? (
                <div>
                  <div
                    onClick={() => fileInputRefs.current[field.id]?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileUpload(field.id, e.dataTransfer.files);
                    }}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      uploadingField === field.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      ref={(el) => { fileInputRefs.current[field.id] = el; }}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(field.id, e.target.files)}
                    />
                    {uploadingField === field.id ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Subiendo...
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Arrastra imágenes aquí o haz clic para seleccionar</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, HEIC</p>
                      </div>
                    )}
                  </div>

                  {/* Uploaded images grid */}
                  {(uploads[field.id]?.length || 0) > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                      {uploads[field.id].map((img, i) => (
                        <div key={img.key} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-100">
                          <img
                            src={img.publicUrl}
                            alt={img.filename}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeUpload(field.id, i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            &times;
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {img.filename}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-gray-900 text-sm placeholder:text-gray-400 transition-colors"
                />
              ) : (
                <input
                  id={field.id}
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm placeholder:text-gray-400 transition-colors"
                />
              )}
            </div>
          ))}
        </div>

        {/* Section navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setActiveSection(prev => Math.max(0, prev - 1))}
            disabled={activeSection === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-400">
            {activeSection + 1} / {sections.length}
          </span>

          {activeSection < sections.length - 1 ? (
            <button
              onClick={() => setActiveSection(prev => Math.min(sections.length - 1, prev + 1))}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={exportAsJSON}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                exported
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {exported ? 'Descargado' : 'Exportar JSON'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

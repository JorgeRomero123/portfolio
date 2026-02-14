'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { PropertyImage } from './types';
import { IMAGE_LABELS, MAX_IMAGES } from './constants';
import { processImageFile, generateId } from './utils';

interface Props {
  images: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
}

export default function ImageManager({ images, onChange }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const addImages = useCallback(
    async (files: FileList) => {
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) return;

      const fileArray = Array.from(files).slice(0, remaining);
      const newImages: PropertyImage[] = [];

      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const result = await processImageFile(file);
          newImages.push({
            id: generateId(),
            dataUrl: result.dataUrl,
            label: images.length === 0 && newImages.length === 0 ? 'Fachada' : '',
            width: result.width,
            height: result.height,
          });
        } catch {
          // Skip failed images
        }
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    },
    [images, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.length) {
        addImages(e.dataTransfer.files);
      }
    },
    [addImages]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const removeImage = useCallback(
    (id: string) => {
      onChange(images.filter((img) => img.id !== id));
    },
    [images, onChange]
  );

  const updateLabel = useCallback(
    (id: string, label: string) => {
      onChange(images.map((img) => (img.id === id ? { ...img, label } : img)));
    },
    [images, onChange]
  );

  // Reorder via drag
  const handleItemDragStart = useCallback((index: number) => {
    dragItemRef.current = index;
  }, []);

  const handleItemDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
    },
    []
  );

  const handleItemDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      const dragIndex = dragItemRef.current;
      if (dragIndex === null || dragIndex === dropIndex) {
        setDragOverIndex(null);
        return;
      }

      const updated = [...images];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, removed);
      onChange(updated);
      dragItemRef.current = null;
      setDragOverIndex(null);
    },
    [images, onChange]
  );

  const handleItemDragEnd = useCallback(() => {
    dragItemRef.current = null;
    setDragOverIndex(null);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Fotos del Inmueble</h2>
        <span className="text-sm text-gray-500">
          {images.length}/{MAX_IMAGES} fotos
        </span>
      </div>

      {/* Drop zone */}
      {images.length < MAX_IMAGES && (
        <div
          className={`relative border-2 border-dashed rounded-lg transition-colors mb-4 ${
            dragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-500">
              Arrastra fotos aquí o haz clic para seleccionar
            </span>
            <span className="text-xs text-gray-400 mt-1">
              Máximo {MAX_IMAGES} fotos, JPEG/PNG
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addImages(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleItemDragStart(index)}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDrop={(e) => handleItemDrop(e, index)}
              onDragEnd={handleItemDragEnd}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                dragOverIndex === index
                  ? 'border-orange-400 scale-105'
                  : 'border-gray-200'
              }`}
            >
              <img
                src={img.dataUrl}
                alt={img.label || `Foto ${index + 1}`}
                className="w-full h-32 object-cover"
              />

              {/* Index badge */}
              <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </span>

              {/* Delete button */}
              <button
                onClick={() => removeImage(img.id)}
                className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>

              {/* Label select */}
              <div className="p-1.5">
                <select
                  value={img.label}
                  onChange={(e) => updateLabel(img.id, e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-orange-300 outline-none"
                >
                  <option value="">Sin etiqueta</option>
                  {IMAGE_LABELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-gray-400 mt-2">
          Arrastra las fotos para reordenar. La primera foto será la imagen principal.
        </p>
      )}
    </div>
  );
}

import type { Dispatch, SetStateAction } from 'react';
import type { Transform, GridSettings, CropRect } from '@/lib/photo-grid-aligner';
import { DEFAULT_TRANSFORM } from '@/lib/photo-grid-aligner';
import type { ColorAdjustments } from '@/lib/photo-color-enhancer';
import { DEFAULT_ADJUSTMENTS, COLOR_PRESETS } from '@/lib/photo-color-enhancer';

// ---------- Shared slider ----------

function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs font-bold text-blue-600">
          {value > 0 && min < 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}

// ---------- Transform panel ----------

export function TransformPanel({
  transform,
  setTransform,
  isAutoAligning,
  autoAlignResult,
  setAutoAlignResult,
  onAutoAlign,
}: {
  transform: Transform;
  setTransform: Dispatch<SetStateAction<Transform>>;
  isAutoAligning: boolean;
  autoAlignResult: string | null;
  setAutoAlignResult: (v: string | null) => void;
  onAutoAlign: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Transform</h3>

      {/* Rotation */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Rotation</label>
          <span className="text-xs font-bold text-blue-600">{transform.rotation.toFixed(1)}°</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTransform((t) => ({ ...t, rotation: Math.max(-180, t.rotation - 0.1) }))}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            -0.1
          </button>
          <input
            type="range"
            min="-180"
            max="180"
            step="0.1"
            value={transform.rotation}
            onChange={(e) => setTransform((t) => ({ ...t, rotation: Number(e.target.value) }))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <button
            onClick={() => setTransform((t) => ({ ...t, rotation: Math.min(180, t.rotation + 0.1) }))}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            +0.1
          </button>
        </div>
      </div>

      {/* Scale */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Scale</label>
          <span className="text-xs font-bold text-blue-600">{transform.scale.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.01"
          value={transform.scale}
          onChange={(e) => setTransform((t) => ({ ...t, scale: Number(e.target.value) }))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setTransform(DEFAULT_TRANSFORM);
            setAutoAlignResult(null);
          }}
          className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors font-medium"
        >
          Reset
        </button>
        <button
          onClick={onAutoAlign}
          disabled={isAutoAligning}
          className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors font-medium"
        >
          {isAutoAligning ? 'Detecting...' : 'Auto-Align'}
        </button>
      </div>

      {/* Flip buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setTransform((t) => ({ ...t, flipH: !t.flipH }))}
          className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors font-medium ${
            transform.flipH
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Flip H
        </button>
        <button
          onClick={() => setTransform((t) => ({ ...t, flipV: !t.flipV }))}
          className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors font-medium ${
            transform.flipV
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Flip V
        </button>
      </div>

      {autoAlignResult && (
        <p className="mt-2 text-xs text-center text-gray-600 bg-gray-50 rounded p-1.5">
          {autoAlignResult}
        </p>
      )}
    </div>
  );
}

// ---------- Grid panel ----------

export function GridPanel({
  grid,
  setGrid,
}: {
  grid: GridSettings;
  setGrid: Dispatch<SetStateAction<GridSettings>>;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Grid</h3>
        <button
          onClick={() => setGrid((g) => ({ ...g, visible: !g.visible }))}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            grid.visible ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {grid.visible ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Cell Size</label>
          <span className="text-xs font-bold text-blue-600">{grid.cellSize}px</span>
        </div>
        <input
          type="range"
          min="10"
          max="200"
          value={grid.cellSize}
          onChange={(e) => setGrid((g) => ({ ...g, cellSize: Number(e.target.value) }))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Color</label>
          <input
            type="color"
            value={grid.color}
            onChange={(e) => setGrid((g) => ({ ...g, color: e.target.value }))}
            className="w-full h-8 rounded cursor-pointer border border-gray-200"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600">Opacity</label>
            <span className="text-xs font-bold text-blue-600">{grid.opacity}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={grid.opacity}
            onChange={(e) => setGrid((g) => ({ ...g, opacity: Number(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Line Width</label>
          <span className="text-xs font-bold text-blue-600">{grid.lineWidth}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={grid.lineWidth}
          onChange={(e) => setGrid((g) => ({ ...g, lineWidth: Number(e.target.value) }))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  );
}

// ---------- Crop panel ----------

export function CropPanel({
  crop,
  setCrop,
  cropMode,
  setCropMode,
  onAutoFitCrop,
}: {
  crop: CropRect | null;
  setCrop: (c: CropRect | null) => void;
  cropMode: boolean;
  setCropMode: (m: boolean) => void;
  onAutoFitCrop: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Crop</h3>
        <button
          onClick={() => {
            if (cropMode) setCrop(null);
            setCropMode(!cropMode);
          }}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            cropMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {cropMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <button
        onClick={onAutoFitCrop}
        className="w-full px-3 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium mb-3"
      >
        Auto-fit (inscribed rect)
      </button>

      {crop && (
        <>
          <div className="text-xs text-gray-600 space-y-1 mb-3">
            <p>
              <span className="font-medium">Position:</span>{' '}
              {Math.round(crop.x)}, {Math.round(crop.y)}
            </p>
            <p>
              <span className="font-medium">Size:</span>{' '}
              {Math.round(crop.width)} &times; {Math.round(crop.height)} px
            </p>
          </div>
          <button
            onClick={() => setCrop(null)}
            className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors font-medium"
          >
            Clear Crop
          </button>
        </>
      )}

      {!crop && cropMode && (
        <p className="text-xs text-gray-500">
          Draw a crop rectangle on the canvas, or use Auto-fit.
        </p>
      )}
    </div>
  );
}

// ---------- Auto Color panel ----------

export function AutoColorPanel({
  adjustments,
  setAdjustments,
}: {
  adjustments: ColorAdjustments;
  setAdjustments: Dispatch<SetStateAction<ColorAdjustments>>;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Auto Color</h3>
      <button
        onClick={() =>
          setAdjustments((a) => ({ ...a, autoLevels: true, autoWhiteBalance: true }))
        }
        className="w-full px-3 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium mb-2"
      >
        Auto Enhance
      </button>
      <div className="flex gap-2">
        <button
          onClick={() => setAdjustments((a) => ({ ...a, autoLevels: !a.autoLevels }))}
          className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors font-medium ${
            adjustments.autoLevels
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Auto Levels
        </button>
        <button
          onClick={() =>
            setAdjustments((a) => ({ ...a, autoWhiteBalance: !a.autoWhiteBalance }))
          }
          className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors font-medium ${
            adjustments.autoWhiteBalance
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          White Balance
        </button>
      </div>
    </div>
  );
}

// ---------- Manual Color panel ----------

export function ManualColorPanel({
  adjustments,
  setAdjustments,
}: {
  adjustments: ColorAdjustments;
  setAdjustments: Dispatch<SetStateAction<ColorAdjustments>>;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Manual Color</h3>
      <SliderControl
        label="Brightness"
        value={adjustments.brightness}
        min={-100}
        max={100}
        onChange={(v) => setAdjustments((a) => ({ ...a, brightness: v }))}
      />
      <SliderControl
        label="Contrast"
        value={adjustments.contrast}
        min={-100}
        max={100}
        onChange={(v) => setAdjustments((a) => ({ ...a, contrast: v }))}
      />
      <SliderControl
        label="Saturation"
        value={adjustments.saturation}
        min={0}
        max={200}
        onChange={(v) => setAdjustments((a) => ({ ...a, saturation: v }))}
      />
      <SliderControl
        label="Temperature"
        value={adjustments.temperature}
        min={-100}
        max={100}
        onChange={(v) => setAdjustments((a) => ({ ...a, temperature: v }))}
      />
    </div>
  );
}

// ---------- Presets & Actions panel ----------

export function PresetsPanel({
  setAdjustments,
}: {
  setAdjustments: Dispatch<SetStateAction<ColorAdjustments>>;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Presets & Actions</h3>
      <button
        onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
        className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors font-medium mb-3"
      >
        Reset All
      </button>
      <h4 className="text-xs font-medium text-gray-500 mb-2">Presets</h4>
      <div className="grid grid-cols-2 gap-2">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() =>
              setAdjustments({ ...DEFAULT_ADJUSTMENTS, ...preset.adjustments })
            }
            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors font-medium"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

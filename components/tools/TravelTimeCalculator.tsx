'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const LIBRARIES: ('places')[] = ['places'];

interface LatLng {
  lat: number;
  lng: number;
}

interface OriginPoint extends LatLng {
  label: number;
  name: string;
}

interface TravelResult {
  origin: LatLng;
  duration: string;
  durationSeconds: number;
  distance: string;
  status: string;
}

const MAP_CENTER = { lat: 19.4326, lng: -99.1332 }; // Mexico City
const MAP_STYLES = { width: '100%', height: '500px' };

type Mode = 'target' | 'origins';

export default function TravelTimeCalculator() {
  const [target, setTarget] = useState<LatLng | null>(null);
  const [targetName, setTargetName] = useState('');
  const [origins, setOrigins] = useState<OriginPoint[]>([]);
  const [mode, setMode] = useState<Mode>('target');
  const [results, setResults] = useState<TravelResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const nextLabel = useRef(1);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onAutocompleteLoad = useCallback((ac: google.maps.places.Autocomplete) => {
    autocompleteRef.current = ac;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const pos = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    const name = place.name || place.formatted_address || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;

    if (mode === 'target') {
      setTarget(pos);
      setTargetName(name);
      setResults([]);
    } else {
      setOrigins((prev) => [...prev, { ...pos, label: nextLabel.current++, name }]);
      setResults([]);
    }

    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }

    mapRef.current?.panTo(pos);
    mapRef.current?.setZoom(14);
  }, [mode]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const name = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;

      if (mode === 'target') {
        setTarget(pos);
        setTargetName(name);
        setResults([]);
      } else {
        setOrigins((prev) => [...prev, { ...pos, label: nextLabel.current++, name }]);
        setResults([]);
      }
    },
    [mode]
  );

  const removeOrigin = (label: number) => {
    setOrigins((prev) => prev.filter((o) => o.label !== label));
    setResults([]);
  };

  const clearAll = () => {
    setTarget(null);
    setTargetName('');
    setOrigins([]);
    setResults([]);
    setError('');
    nextLabel.current = 1;
  };

  const calculate = async () => {
    if (!target || origins.length === 0) return;

    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/travel-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origins: origins.map(({ lat, lng }) => ({ lat, lng })),
          destination: target,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to calculate travel times');
        return;
      }

      const sorted = [...data.results].sort(
        (a: TravelResult, b: TravelResult) => a.durationSeconds - b.durationSeconds
      );

      // Match results back to origin labels and names
      const labeled = sorted.map((r: TravelResult) => {
        const match = origins.find(
          (o) => Math.abs(o.lat - r.origin.lat) < 0.0001 && Math.abs(o.lng - r.origin.lng) < 0.0001
        );
        return { ...r, label: match?.label ?? 0, name: match?.name ?? '' };
      });

      setResults(labeled);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Loading Google Maps...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Mode toggle + actions */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMode('target')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              mode === 'target'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Set Target
          </button>
          <button
            onClick={() => setMode('origins')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              mode === 'origins'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Add Origins
          </button>

          <div className="flex-1" />

          <button
            onClick={calculate}
            disabled={isLoading || !target || origins.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isLoading ? 'Calculating...' : 'Calculate'}
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
          >
            Reset
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {mode === 'target'
            ? `Click the map or search to set the target.${targetName ? ` Current: ${targetName}` : ''}`
            : 'Click the map or search to add origin points.'}
        </p>
      </div>

      {/* Search + Map */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a place..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Autocomplete>
        </div>
        <GoogleMap
          mapContainerStyle={MAP_STYLES}
          center={target || MAP_CENTER}
          zoom={12}
          onClick={handleMapClick}
          onLoad={onMapLoad}
        >
          {target && (
            <Marker
              position={target}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
              title="Target"
            />
          )}
          {origins.map((o) => (
            <Marker
              key={o.label}
              position={{ lat: o.lat, lng: o.lng }}
              label={{ text: String(o.label), color: '#fff', fontWeight: 'bold' }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              }}
              title={`Origin ${o.label}`}
              onClick={() => removeOrigin(o.label)}
            />
          ))}
        </GoogleMap>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Calculating travel times...</span>
          </div>
        </div>
      )}

      {/* Origins list */}
      {origins.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Origins ({origins.length})
          </h3>
          <div className="space-y-2">
            {origins.map((o) => {
              const result = (results as (TravelResult & { label?: number })[]).find(
                (r) => r.label === o.label
              );
              return (
                <div
                  key={o.label}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full shrink-0">
                    {o.label}
                  </span>
                  <span className="text-sm text-gray-600 flex-1 min-w-0 truncate">
                    {o.name}
                  </span>
                  {result && result.status === 'OK' && (
                    <span className="text-sm font-semibold text-green-700 shrink-0">
                      {result.duration} &middot; {result.distance}
                    </span>
                  )}
                  {result && result.status !== 'OK' && (
                    <span className="text-sm text-red-600 shrink-0">No route</span>
                  )}
                  <button
                    onClick={() => removeOrigin(o.label)}
                    className="text-gray-400 hover:text-red-600 transition-colors shrink-0"
                    title="Remove origin"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sorted results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Results (sorted by travel time)
          </h3>
          <div className="space-y-2">
            {(results as (TravelResult & { label?: number; name?: string })[]).map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  i === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full shrink-0">
                  {r.label ?? '?'}
                </span>
                <span className="text-sm text-gray-600 flex-1 min-w-0 truncate">
                  {r.name || '?'}
                </span>
                {r.status === 'OK' ? (
                  <>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      {r.duration}
                    </span>
                    <span className="text-sm text-gray-500 shrink-0">{r.distance}</span>
                  </>
                ) : (
                  <span className="text-sm text-red-600 shrink-0">No route found</span>
                )}
                {i === 0 && r.status === 'OK' && (
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                    Shortest
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Tip</span> — Click a blue marker on the
          map to remove it. Switch between &quot;Set Target&quot; and &quot;Add Origins&quot; modes
          to place points.
        </p>
      </div>
    </div>
  );
}

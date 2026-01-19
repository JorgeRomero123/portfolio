'use client';

import { useState, useEffect } from 'react';

interface PasswordGateProps {
  password: string;
  storageKey: string;
  children: React.ReactNode;
}

/**
 * Password gate component that protects content behind a simple password.
 * Uses sessionStorage to remember unlock state during the session.
 */
export default function PasswordGate({ password, storageKey, children }: PasswordGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored === 'unlocked') {
      setIsUnlocked(true);
    }
    setIsLoading(false);
  }, [storageKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValue === password) {
      sessionStorage.setItem(storageKey, 'unlocked');
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setInputValue('');
    }
  };

  // Show nothing while checking sessionStorage
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
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
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600">
            Esta herramienta requiere una contraseña para acceder.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(false);
              }}
              placeholder="Ingresa la contraseña"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest ${
                error ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">
                Contraseña incorrecta. Intenta de nuevo.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
}

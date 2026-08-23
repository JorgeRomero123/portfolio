'use client';

import { useSyncExternalStore } from 'react';
import { PERSONAS, esPersonaId, type Persona, type PersonaId } from '@/lib/personas';

const LLAVE = 'depa_persona';

/**
 * Quién está usando ESTE aparato.
 *
 * Vive en localStorage y no en la base a propósito: los datos del depa son
 * compartidos — la bitácora, el XP, quién hizo qué, todo eso está en Supabase y
 * los dos lo ven igual. Lo único que es del aparato es "en este navegador soy
 * Eli". Si eso viviera en la base sería un solo valor para los dos, y escoger
 * personaje en un celular se lo cambiaría al otro.
 *
 * Se lee con useSyncExternalStore porque localStorage es justo eso: un almacén
 * de fuera de React. De pilón, cambiar de persona en otra pestaña se refleja
 * aquí sin recargar.
 */

const oyentes = new Set<() => void>();

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener('storage', avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener('storage', avisar);
  };
}

function leer(): PersonaId | null {
  try {
    const guardado = window.localStorage.getItem(LLAVE);
    return esPersonaId(guardado) ? guardado : null;
  } catch {
    // Modo privado o cookies bloqueadas: se escoge personaje cada vez.
    return null;
  }
}

/** En el servidor todavía no hay nadie; se resuelve al hidratar. */
function leerEnServidor(): PersonaId | null {
  return null;
}

export function usePersona() {
  const id = useSyncExternalStore(suscribir, leer, leerEnServidor);

  function escoger(nuevo: PersonaId) {
    try {
      window.localStorage.setItem(LLAVE, nuevo);
    } catch {}
    // El evento 'storage' solo llega a las OTRAS pestañas; a esta hay que
    // avisarle a mano.
    for (const avisar of oyentes) avisar();
  }

  const persona: Persona | null = PERSONAS.find((p) => p.id === id) ?? null;

  return { persona, escoger };
}

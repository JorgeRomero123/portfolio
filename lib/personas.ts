/**
 * Quién vive en el depa.
 *
 * Vive fuera de `quehaceres` a propósito: la rutina también va a querer saber
 * quién entrenó, y el depa es el mismo. Agregar a alguien es agregar una
 * entrada aquí — el avatar se dibuja con estos colores, no con arte aparte.
 */

export type PersonaId = 'jorge' | 'eli';

export type Persona = {
  id: PersonaId;
  nombre: string;
  /** Acento de la persona en la UI (barras, bordes, el nombre). */
  color: string;
  /** Colores del monito. El arte es uno solo, parametrizado. */
  pelo: string;
  ropa: string;
  piel: string;
  /** Melena larga o corta. Lo único que cambia de silueta entre personas. */
  melena: boolean;
};

export const PERSONAS: Persona[] = [
  {
    id: 'jorge',
    nombre: 'Jorge',
    color: '#0070f3',
    pelo: '#2f2418',
    ropa: '#3b82f6',
    piel: '#e8b98f',
    melena: false,
  },
  {
    id: 'eli',
    nombre: 'Eli',
    color: '#d946a0',
    pelo: '#4a2f20',
    ropa: '#ec4899',
    piel: '#eec49f',
    melena: true,
  },
];

export function persona(id: string | null | undefined): Persona | null {
  return PERSONAS.find((p) => p.id === id) ?? null;
}

export function esPersonaId(v: unknown): v is PersonaId {
  return typeof v === 'string' && PERSONAS.some((p) => p.id === v);
}

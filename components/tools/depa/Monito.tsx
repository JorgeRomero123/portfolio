import type { Persona } from '@/lib/personas';

/**
 * Una persona vista desde arriba: hombros, cabeza y pelo. El arte es uno solo
 * — lo que cambia entre Jorge y Eli son los colores y la melena, que salen de
 * lib/personas.ts. Agregar a alguien no pide arte nuevo.
 */
export default function Monito({ persona: p, escala = 1 }: { persona: Persona; escala?: number }) {
  return (
    <g transform={`scale(${escala})`}>
      <ellipse cy="1" rx="9" ry="7" fill="#000" opacity="0.12" />
      <ellipse cy="2.5" rx="8" ry="6" fill={p.ropa} />
      {p.melena && <ellipse cy="1" rx="7.5" ry="7.5" fill={p.pelo} />}
      <circle r="5.4" fill={p.piel} />
      <path d="M-5.4 -1.2 a5.4 5.4 0 0 1 10.8 0 z" fill={p.pelo} />
    </g>
  );
}

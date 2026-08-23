'use client';

import { etiquetaEstado, etiquetaFrecuencia, type QuehacerCalculado } from '@/lib/quehaceres';
import { mueble, zona } from '@/lib/depa-mapa';
import { ESTILO } from './estilo';

/**
 * Un quehacer. La misma tarjeta se usa en la lista completa y dentro del panel
 * de un cuarto; lo único que cambia es si vale la pena repetir dónde vive.
 */
export default function TarjetaQuehacer({
  quehacer: q,
  ocupado,
  onHecho,
  onEditar,
  mostrarUbicacion = true,
}: {
  quehacer: QuehacerCalculado;
  ocupado: boolean;
  onHecho: () => void;
  onEditar: () => void;
  mostrarUbicacion?: boolean;
}) {
  const estilo = ESTILO[q.estado];
  const ancho = Math.min(100, Math.max(0, q.progreso * 100));
  const donde = mueble(q.punto)?.nombre ?? zona(q.zona).nombre;

  return (
    <div
      className={`group flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${estilo.borde}`}
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl">
        {q.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate font-semibold text-gray-900">{q.nombre}</h3>
          <button
            onClick={onEditar}
            className="text-xs text-gray-400 opacity-0 transition-opacity hover:text-blue-600 group-hover:opacity-100 focus:opacity-100"
            aria-label={`Editar ${q.nombre}`}
          >
            editar
          </button>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} />
          <span className={`font-medium ${estilo.texto}`}>{etiquetaEstado(q)}</span>
          <span className="text-gray-400">· {etiquetaFrecuencia(q.frecuencia_dias)}</span>
          {mostrarUbicacion && <span className="text-gray-400">· {donde}</span>}
        </div>

        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${estilo.barra}`}
            style={{ width: `${ancho}%` }}
          />
        </div>
      </div>

      <button
        onClick={onHecho}
        disabled={ocupado}
        className="flex-shrink-0 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
      >
        {ocupado ? '…' : 'Hecho'}
      </button>
    </div>
  );
}

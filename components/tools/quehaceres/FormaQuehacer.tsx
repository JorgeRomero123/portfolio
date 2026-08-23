'use client';

import { useState } from 'react';
import { FRECUENCIAS_SUGERIDAS, fechaLarga, type QuehacerCalculado } from '@/lib/quehaceres';
import { ZONAS, ZONA_POR_DEFECTO, mueblesDeZona, type ZonaId } from '@/lib/depa-mapa';
import { EMOJIS } from './estilo';

export type DatosQuehacer = {
  nombre: string;
  emoji: string;
  frecuencia_dias: number;
  zona: ZonaId;
  punto: string | null;
};

/**
 * Una sola forma para crear y para editar.
 *
 * Los selectores de cuarto y mueble se arman de lib/depa-mapa.ts, así que un
 * cuarto nuevo aparece aquí sin tocar este archivo.
 */
export default function FormaQuehacer({
  quehacer,
  zonaInicial,
  ocupado,
  onGuardar,
  onCancelar,
  onArchivar,
  onReiniciar,
}: {
  /** Si viene, se edita; si no, se crea uno nuevo. */
  quehacer?: QuehacerCalculado;
  /** Cuarto con el que arranca uno nuevo (el que está abierto en el mapa). */
  zonaInicial?: ZonaId;
  ocupado?: boolean;
  onGuardar: (datos: DatosQuehacer) => void | Promise<unknown>;
  onCancelar: () => void;
  onArchivar?: () => void;
  onReiniciar?: () => void;
}) {
  const editando = !!quehacer;

  const [nombre, setNombre] = useState(quehacer?.nombre ?? '');
  const [emoji, setEmoji] = useState(quehacer?.emoji ?? '🧽');
  const [frecuencia, setFrecuencia] = useState(String(quehacer?.frecuencia_dias ?? 7));
  const [zona, setZona] = useState<ZonaId>(
    (quehacer?.zona as ZonaId) ?? zonaInicial ?? ZONA_POR_DEFECTO
  );
  const [punto, setPunto] = useState<string>(quehacer?.punto ?? '');
  const [guardando, setGuardando] = useState(false);

  const muebles = mueblesDeZona(zona);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    await onGuardar({
      nombre,
      emoji,
      frecuencia_dias: Number(frecuencia),
      zona,
      punto: punto || null,
    });
    setGuardando(false);
    if (!editando) setNombre('');
  }

  const ocupadoAhora = ocupado || guardando;

  return (
    <form
      onSubmit={enviar}
      className={`rounded-2xl border p-4 ${
        editando ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white shadow-sm'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <SelectorEmoji valor={emoji} onCambio={setEmoji} />
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="¿Qué hay que hacer?"
          autoFocus
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-label="Nombre del quehacer"
        />
        <SelectorFrecuencia valor={frecuencia} onCambio={setFrecuencia} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Dónde</span>

        <select
          value={zona}
          onChange={(e) => {
            // Al cambiar de cuarto el mueble anterior ya no aplica.
            setZona(e.target.value as ZonaId);
            setPunto('');
          }}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-label="Cuarto"
        >
          {ZONAS.map((z) => (
            <option key={z.id} value={z.id}>
              {z.emoji} {z.nombre}
            </option>
          ))}
        </select>

        <select
          value={punto}
          onChange={(e) => setPunto(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-label="Mueble"
        >
          <option value="">El cuarto en general</option>
          {muebles.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="submit"
          disabled={ocupadoAhora || !nombre.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {ocupadoAhora ? 'Guardando…' : editando ? 'Guardar' : 'Agregar'}
        </button>
        <button type="button" onClick={onCancelar} className="text-gray-500 hover:text-gray-700">
          Cancelar
        </button>
        {onReiniciar && quehacer?.ultima_vez && (
          <button type="button" onClick={onReiniciar} className="text-gray-500 hover:text-gray-700">
            Reiniciar
          </button>
        )}
        {onArchivar && (
          <button type="button" onClick={onArchivar} className="ml-auto text-red-600 hover:text-red-800">
            Quitar
          </button>
        )}
      </div>

      {quehacer?.ultima_vez && (
        <p className="mt-2 text-xs text-gray-500">
          Última vez: <span className="capitalize">{fechaLarga(quehacer.ultima_vez)}</span>
        </p>
      )}
    </form>
  );
}

function SelectorEmoji({ valor, onCambio }: { valor: string; onCambio: (e: string) => void }) {
  const lista = EMOJIS.includes(valor) ? EMOJIS : [valor, ...EMOJIS];

  return (
    <select
      value={valor}
      onChange={(e) => onCambio(e.target.value)}
      className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      aria-label="Icono"
    >
      {lista.map((e) => (
        <option key={e} value={e}>
          {e}
        </option>
      ))}
    </select>
  );
}

function SelectorFrecuencia({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  const esSugerida = FRECUENCIAS_SUGERIDAS.some((f) => String(f.dias) === valor);

  return (
    <div className="flex items-center gap-2">
      <select
        value={esSugerida ? valor : 'otro'}
        onChange={(e) => onCambio(e.target.value === 'otro' ? valor : e.target.value)}
        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        aria-label="Frecuencia"
      >
        {FRECUENCIAS_SUGERIDAS.map((f) => (
          <option key={f.dias} value={f.dias}>
            {f.etiqueta}
          </option>
        ))}
        <option value="otro">Otra…</option>
      </select>

      {!esSugerida && (
        <input
          type="number"
          min={1}
          max={365}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-label="Cada cuántos días"
        />
      )}
    </div>
  );
}

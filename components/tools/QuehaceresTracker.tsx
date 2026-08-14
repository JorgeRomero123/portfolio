'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FRECUENCIAS_SUGERIDAS,
  etiquetaEstado,
  etiquetaFrecuencia,
  fechaLarga,
  type Estado,
  type QuehacerCalculado,
} from '@/lib/quehaceres';

const ESTILO: Record<Estado, { punto: string; texto: string; barra: string; borde: string }> = {
  vencido: { punto: 'bg-red-500', texto: 'text-red-600', barra: 'bg-red-500', borde: 'border-red-200' },
  hoy: { punto: 'bg-blue-500', texto: 'text-blue-600', barra: 'bg-blue-500', borde: 'border-blue-200' },
  pronto: { punto: 'bg-amber-500', texto: 'text-amber-600', barra: 'bg-amber-400', borde: 'border-amber-200' },
  ok: { punto: 'bg-gray-300', texto: 'text-gray-500', barra: 'bg-gray-300', borde: 'border-gray-100' },
};

const EMOJIS = ['🧽', '🪴', '🚿', '🖥️', '🔥', '🛏️', '👟', '🧊', '🧹', '🧺', '🗑️', '🪟', '🍽️', '🚽', '🧴'];

export default function QuehaceresTracker() {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [sinConfigurar, setSinConfigurar] = useState(false);

  useEffect(() => {
    fetch('/api/quehaceres/pin')
      .then((r) => r.json())
      .then((d) => {
        setAutorizado(!!d.autorizado);
        setSinConfigurar(!!d.sinConfigurar);
      })
      .catch(() => setAutorizado(false));
  }, []);

  if (autorizado === null) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!autorizado) {
    return <CandadoPin sinConfigurar={sinConfigurar} onEntrar={() => setAutorizado(true)} />;
  }

  return <Tablero onSalir={() => setAutorizado(false)} />;
}

/* ---------------------------------------------------------------- candado */

function CandadoPin({ sinConfigurar, onEntrar }: { sinConfigurar: boolean; onEntrar: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const res = await fetch('/api/quehaceres/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json().catch(() => ({}));
    setCargando(false);

    if (res.ok) onEntrar();
    else {
      setError(data.error ?? 'No se pudo entrar.');
      setPin('');
    }
  }

  return (
    <div className="min-h-[320px] flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-gray-100 shadow-md p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl">
            🧹
          </div>
          <h2 className="text-xl font-bold text-gray-900">Quehaceres del depa</h2>
          <p className="mt-1 text-sm text-gray-500">
            {sinConfigurar
              ? 'Falta configurar QUEHACERES_PIN en el entorno.'
              : 'Escribe tu PIN para entrar.'}
          </p>
        </div>

        {!sinConfigurar && (
          <form onSubmit={entrar}>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              placeholder="••••"
              autoFocus
              className={`w-full rounded-xl border px-4 py-3 text-center text-lg tracking-[0.5em] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={cargando || !pin}
              className="mt-4 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {cargando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- tablero */

function Tablero({ onSalir }: { onSalir: () => void }) {
  const [quehaceres, setQuehaceres] = useState<QuehacerCalculado[] | null>(null);
  const [hoy, setHoy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mostrarForma, setMostrarForma] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch('/api/quehaceres');
    if (res.status === 401) return onSalir();

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? 'No se pudieron cargar los quehaceres.');

    setQuehaceres(data.quehaceres);
    setHoy(data.hoy);
    setError(null);
  }, [onSalir]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = useMemo(() => {
    const lista = quehaceres ?? [];
    return {
      vencidos: lista.filter((q) => q.estado === 'vencido').length,
      hoy: lista.filter((q) => q.estado === 'hoy').length,
      pronto: lista.filter((q) => q.estado === 'pronto').length,
      alDia: lista.filter((q) => q.estado === 'ok').length,
    };
  }, [quehaceres]);

  async function marcarHecho(id: string) {
    setOcupado(id);
    const res = await fetch(`/api/quehaceres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hecho: true }),
    });
    setOcupado(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setError(d.error ?? 'No se pudo marcar como hecho.');
    }
    await cargar();
  }

  async function guardarEdicion(id: string, cambios: Record<string, unknown>) {
    setOcupado(id);
    const res = await fetch(`/api/quehaceres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    });
    setOcupado(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setError(d.error ?? 'No se pudo guardar.');
    }
    setEditando(null);
    await cargar();
  }

  async function archivar(id: string) {
    setOcupado(id);
    const res = await fetch(`/api/quehaceres/${id}`, { method: 'DELETE' });
    setOcupado(null);
    if (!res.ok) return setError('No se pudo quitar el quehacer.');
    setEditando(null);
    await cargar();
  }

  async function crear(nuevo: { nombre: string; emoji: string; frecuencia_dias: number }) {
    const res = await fetch('/api/quehaceres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'No se pudo agregar.');
      return false;
    }
    setMostrarForma(false);
    await cargar();
    return true;
  }

  async function mandarCorreoDePrueba() {
    setAviso('Mandando…');
    const res = await fetch('/api/quehaceres/recordatorio?forzar=1');
    const d = await res.json().catch(() => ({}));
    setAviso(res.ok ? '✅ Correo enviado. Revisa tu bandeja.' : `⚠️ ${d.error ?? 'Falló el envío.'}`);
    setTimeout(() => setAviso(null), 6000);
  }

  async function salir() {
    await fetch('/api/quehaceres/pin', { method: 'DELETE' });
    onSalir();
  }

  if (!quehaceres) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Resumen */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm capitalize text-gray-500">{hoy && fechaLarga(hoy)}</span>
        <Chip n={resumen.vencidos} etiqueta="atrasados" clase="bg-red-50 text-red-700 border-red-200" />
        <Chip n={resumen.hoy} etiqueta="hoy" clase="bg-blue-50 text-blue-700 border-blue-200" />
        <Chip n={resumen.pronto} etiqueta="ya casi" clase="bg-amber-50 text-amber-700 border-amber-200" />
        <Chip n={resumen.alDia} etiqueta="al día" clase="bg-gray-50 text-gray-600 border-gray-200" />
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Lista */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {quehaceres.map((q) => (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            >
              {editando === q.id ? (
                <FormaEdicion
                  quehacer={q}
                  ocupado={ocupado === q.id}
                  onGuardar={(cambios) => guardarEdicion(q.id, cambios)}
                  onArchivar={() => archivar(q.id)}
                  onCancelar={() => setEditando(null)}
                />
              ) : (
                <Tarjeta
                  quehacer={q}
                  ocupado={ocupado === q.id}
                  onHecho={() => marcarHecho(q.id)}
                  onEditar={() => setEditando(q.id)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {quehaceres.length === 0 && (
        <p className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center text-gray-500">
          Todavía no hay quehaceres. Agrega el primero abajo.
        </p>
      )}

      {/* Agregar */}
      <div className="mt-4">
        {mostrarForma ? (
          <FormaNuevo onCrear={crear} onCancelar={() => setMostrarForma(false)} />
        ) : (
          <button
            onClick={() => setMostrarForma(true)}
            className="w-full rounded-2xl border-2 border-dashed border-gray-200 px-4 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            + Agregar quehacer
          </button>
        )}
      </div>

      {/* Pie */}
      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-5 text-sm">
        <p className="mr-auto text-gray-500">
          Te llega un correo a las 8:00 a.m. cuando algo esté pendiente.
        </p>
        <button onClick={mandarCorreoDePrueba} className="font-medium text-blue-600 hover:text-blue-800">
          Mandar correo de prueba
        </button>
        <button onClick={salir} className="text-gray-400 hover:text-gray-600">
          Salir
        </button>
      </div>

      {aviso && <p className="mt-3 text-sm text-gray-600">{aviso}</p>}
    </div>
  );
}

function Chip({ n, etiqueta, clase }: { n: number; etiqueta: string; clase: string }) {
  if (n === 0) return null;
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${clase}`}>
      {n} {etiqueta}
    </span>
  );
}

/* --------------------------------------------------------------- tarjetas */

function Tarjeta({
  quehacer: q,
  ocupado,
  onHecho,
  onEditar,
}: {
  quehacer: QuehacerCalculado;
  ocupado: boolean;
  onHecho: () => void;
  onEditar: () => void;
}) {
  const estilo = ESTILO[q.estado];
  const ancho = Math.min(100, Math.max(0, q.progreso * 100));

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

        <div className="mt-0.5 flex items-center gap-2 text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} />
          <span className={`font-medium ${estilo.texto}`}>{etiquetaEstado(q)}</span>
          <span className="text-gray-400">· {etiquetaFrecuencia(q.frecuencia_dias)}</span>
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

function FormaEdicion({
  quehacer: q,
  ocupado,
  onGuardar,
  onArchivar,
  onCancelar,
}: {
  quehacer: QuehacerCalculado;
  ocupado: boolean;
  onGuardar: (cambios: Record<string, unknown>) => void;
  onArchivar: () => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(q.nombre);
  const [emoji, setEmoji] = useState(q.emoji);
  const [frecuencia, setFrecuencia] = useState(String(q.frecuencia_dias));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar({ nombre, emoji, frecuencia_dias: Number(frecuencia) });
      }}
      className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <SelectorEmoji valor={emoji} onCambio={setEmoji} />
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-label="Nombre del quehacer"
        />
        <SelectorFrecuencia valor={frecuencia} onCambio={setFrecuencia} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="submit"
          disabled={ocupado}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Guardar
        </button>
        <button type="button" onClick={onCancelar} className="text-gray-500 hover:text-gray-700">
          Cancelar
        </button>
        {q.ultima_vez && (
          <button
            type="button"
            onClick={() => onGuardar({ ultima_vez: null })}
            className="text-gray-500 hover:text-gray-700"
          >
            Reiniciar
          </button>
        )}
        <button
          type="button"
          onClick={onArchivar}
          className="ml-auto text-red-600 hover:text-red-800"
        >
          Quitar
        </button>
      </div>

      {q.ultima_vez && (
        <p className="mt-2 text-xs text-gray-500">
          Última vez: <span className="capitalize">{fechaLarga(q.ultima_vez)}</span>
        </p>
      )}
    </form>
  );
}

function FormaNuevo({
  onCrear,
  onCancelar,
}: {
  onCrear: (n: { nombre: string; emoji: string; frecuencia_dias: number }) => Promise<boolean>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState('🧽');
  const [frecuencia, setFrecuencia] = useState('7');
  const [guardando, setGuardando] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setGuardando(true);
        const ok = await onCrear({ nombre, emoji, frecuencia_dias: Number(frecuencia) });
        setGuardando(false);
        if (ok) setNombre('');
      }}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
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

      <div className="mt-3 flex items-center gap-3 text-sm">
        <button
          type="submit"
          disabled={guardando || !nombre.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {guardando ? 'Agregando…' : 'Agregar'}
        </button>
        <button type="button" onClick={onCancelar} className="text-gray-500 hover:text-gray-700">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function SelectorEmoji({ valor, onCambio }: { valor: string; onCambio: (e: string) => void }) {
  return (
    <select
      value={EMOJIS.includes(valor) ? valor : EMOJIS[0]}
      onChange={(e) => onCambio(e.target.value)}
      className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      aria-label="Icono"
    >
      {(EMOJIS.includes(valor) ? EMOJIS : [valor, ...EMOJIS]).map((e) => (
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

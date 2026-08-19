'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ACTIVIDADES_PARQUE,
  BLOQUES_DEPA,
  VARIANTES,
  minimo,
  type Bloque,
} from '@/lib/rutina-ejercicios';
import type { Esfuerzo, Modo, Resumen, Sesion, Variante } from '@/lib/rutina';
import { ITEMS_DEPA } from '@/lib/rutina-items';
import { motion } from 'framer-motion';
import EscenaDepa from './rutina/EscenaDepa';
import EscenaParque from './rutina/EscenaParque';

type Datos = Resumen & { variante: Variante; historial: Sesion[] };
type Guardado = { ganado: number; bonus: string[]; subioDeNivel: boolean };

const ESFUERZOS: { id: Esfuerzo; emoji: string; nombre: string; pie: string; bloques: number }[] = [
  { id: 'minimo',  emoji: '😮‍💨', nombre: 'Muerto',      pie: 'Solo el mínimo',      bloques: 0 },
  { id: 'normal',  emoji: '🙂',   nombre: 'Normal',      pie: 'Mínimo + 1 bloque',   bloques: 1 },
  { id: 'energia', emoji: '🔥',   nombre: 'Con energía', pie: 'Mínimo + 2 bloques',  bloques: 2 },
];

export default function Rutina() {
  const [gate, setGate] = useState<'cargando' | 'pin' | 'listo'>('cargando');
  const [pin, setPin] = useState('');
  const [errorPin, setErrorPin] = useState<string | null>(null);

  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modo, setModo] = useState<Modo>('depa');
  const [esfuerzo, setEsfuerzo] = useState<Esfuerzo>('minimo');
  const [bloques, setBloques] = useState<string[]>([]);
  const [minutos, setMinutos] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState<Guardado | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch('/api/rutina');
    if (res.status === 401) { setGate('pin'); return; }
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? 'No se pudo cargar.'); return; }
    setDatos(json);
    setGate('listo');
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErrorPin(null);
    const res = await fetch('/api/quehaceres/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErrorPin(j.error ?? 'PIN incorrecto.');
      return;
    }
    setPin('');
    await cargar();
  }

  const permitidos = ESFUERZOS.find((e) => e.id === esfuerzo)?.bloques ?? 0;

  function alternarBloque(id: string) {
    setBloques((prev) => {
      if (prev.includes(id)) return prev.filter((b) => b !== id);
      if (modo === 'depa' && prev.length >= permitidos) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  async function registrar() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch('/api/rutina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo,
          esfuerzo: modo === 'parque' ? 'normal' : esfuerzo,
          bloques,
          minutos: minutos ? Number(minutos) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'No se pudo registrar.'); return; }
      setDatos((d) => (d ? { ...d, ...json } : json));
      setGuardado({ ganado: json.ganado, bonus: json.bonus ?? [], subioDeNivel: json.subioDeNivel });
      setBloques([]);
      setMinutos('');
      void cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string) {
    const res = await fetch(`/api/rutina?id=${id}`, { method: 'DELETE' });
    if (res.ok) void cargar();
  }

  async function cambiarVariante(variante: Variante) {
    setDatos((d) => (d ? { ...d, variante } : d));
    await fetch('/api/rutina', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variante }),
    });
  }

  // ------------------------------------------------------------ candado

  if (gate === 'cargando') {
    return <div className="animate-pulse space-y-4">
      <div className="h-28 rounded-2xl bg-gray-200" />
      <div className="h-64 rounded-2xl bg-gray-100" />
    </div>;
  }

  if (gate === 'pin') {
    return (
      <form onSubmit={entrar} className="mx-auto max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h2 className="text-xl font-bold text-gray-900">Esta rutina es privada</h2>
        <p className="mt-1 text-sm text-gray-600">Mete el PIN para ver y registrar tus sesiones.</p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.3em] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {errorPin && <p className="mt-3 text-sm text-red-600">{errorPin}</p>}
        <button type="submit" className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
          Entrar
        </button>
      </form>
    );
  }

  if (!datos) return <p className="text-red-600">{error}</p>;

  const { racha, nivel } = datos;
  const disponibles = (modo === 'depa' ? BLOQUES_DEPA : ACTIVIDADES_PARQUE).filter(
    (b) => !b.avanzado || (modo === 'depa' ? datos.avanzadoDesbloqueado : datos.barrasDesbloqueadas)
  );
  const bloqueados = (modo === 'depa' ? BLOQUES_DEPA : ACTIVIDADES_PARQUE).filter(
    (b) => b.avanzado && !(modo === 'depa' ? datos.avanzadoDesbloqueado : datos.barrasDesbloqueadas)
  );

  // El mueble recién ganado, para que solo ese entre animado.
  const nuevoItem = guardado?.subioDeNivel
    ? ITEMS_DEPA.find((x) => x.nivel === nivel.nivel)?.id
    : undefined;

  return (
    <div className="relative space-y-6">
      {/*
        El fondo de la página entero se tiñe según el modo — un cuarto cálido
        sobre blanco no se siente a nada. `initial={false}` hace que el primer
        render ya salga con el color correcto en vez de animarlo desde cero.
        z-0 (no -z-10) porque <main> pinta su propio bg-gray-50 encima.
      */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(170deg,#faf4ea 0%,#f2e6d4 55%,#e9d8c0 100%)' }}
          initial={false}
          animate={{ opacity: modo === 'depa' ? 1 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(170deg,#cfeaf9 0%,#e2f2e6 55%,#d5ecc6 100%)' }}
          initial={false}
          animate={{ opacity: modo === 'parque' ? 1 : 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 space-y-6">
      {/* ---------- marcador ---------- */}
      <div className="rounded-2xl bg-white/90 p-6 shadow-md backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-5xl font-bold text-gray-900">
              {racha.actual}
              <span className="ml-2 text-3xl">🔥</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              día{racha.actual === 1 ? '' : 's'} seguidos · mejor: {racha.mejor}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">Nivel {nivel.nivel}</div>
            <p className="text-sm text-gray-600">
              {nivel.hasta === null ? 'nivel máximo' : `faltan ${nivel.faltan} XP`}
            </p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-700"
            style={{ width: `${Math.round(nivel.progreso * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{datos.xpTotal} XP</span>
          <span>{nivel.hasta ?? '∞'}</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm">
          <span className={racha.comodinDisponible ? 'text-emerald-700' : 'text-gray-400'}>
            {racha.comodinDisponible ? '● comodín disponible' : '○ comodín usado esta semana'}
          </span>
          <span className="text-gray-600">
            🌳 {datos.parqueEstaSemana} de {datos.metaParque} salidas
          </span>
          {racha.hoyHecho && <span className="font-medium text-blue-700">✓ hoy ya cuenta</span>}
        </div>

        {racha.cubiertos.length > 0 && !racha.comodinDisponible && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Te cubrí el {racha.cubiertos[0]} con el comodín. Si fallas otra vez esta semana, la racha se reinicia.
          </p>
        )}
      </div>

      {/* ---------- registrado ---------- */}
      {guardado && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="font-semibold text-blue-900">
            +{guardado.ganado} XP {guardado.subioDeNivel && `· ¡subiste a nivel ${nivel.nivel}! 🎉`}
          </p>
          {guardado.subioDeNivel && (() => {
            const item = ITEMS_DEPA.find((x) => x.nivel === nivel.nivel);
            return item ? (
              <p className="mt-1 text-sm text-blue-800">
                Se desbloqueó <b>{item.nombre.toLowerCase()}</b> en tu depa — {item.pista}
              </p>
            ) : null;
          })()}
          {guardado.bonus.length > 0 && (
            <p className="mt-1 text-sm text-blue-800">Bonus: {guardado.bonus.join(' · ')}</p>
          )}
        </div>
      )}

      {/* ---------- modo ---------- */}
      <div className="rounded-2xl bg-white/90 p-6 shadow-md backdrop-blur sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          ¿Dónde estás hoy?
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {([
            { id: 'depa' as Modo, emoji: '🏠', nombre: 'Modo Depa', pie: '5 min mínimo · sin saltos' },
            { id: 'parque' as Modo, emoji: '🌳', nombre: 'Modo Parque', pie: 'salir ya es la sesión' },
          ]).map((m) => (
            <button
              key={m.id}
              onClick={() => { setModo(m.id); setBloques([]); }}
              className={`rounded-xl border-2 p-4 text-left transition ${
                modo === m.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl">{m.emoji}</div>
              <div className="mt-1 font-semibold text-gray-900">{m.nombre}</div>
              <div className="text-xs text-gray-600">{m.pie}</div>
            </button>
          ))}
        </div>

        {/* ---------- la escena ---------- */}
        <div className="mt-5">
          {modo === 'depa' ? (
            <EscenaDepa nivel={nivel.nivel} nuevo={nuevoItem} />
          ) : (
            <EscenaParque
              salidas={datos.parqueEstaSemana}
              meta={datos.metaParque}
              barrasDesbloqueadas={datos.barrasDesbloqueadas}
            />
          )}
        </div>

        {/* ---------- depa ---------- */}
        {modo === 'depa' && (
          <>
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">El mínimo · ~5 min</h3>
                <span className="text-xs font-medium text-gray-500">no se negocia</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {minimo(datos.variante).map((e) => (
                  <li key={e.nombre} className="flex justify-between text-sm">
                    <span className="text-gray-800">
                      {e.nombre}
                      {e.nota && <span className="ml-1 text-gray-500">({e.nota})</span>}
                    </span>
                    <span className="tabular-nums text-gray-600">{e.detalle}</span>
                  </li>
                ))}
              </ul>
              <label className="mt-4 block text-xs text-gray-600">
                Flexiones:{' '}
                <select
                  value={datos.variante}
                  onChange={(e) => cambiarVariante(e.target.value as Variante)}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                >
                  {VARIANTES.map((v) => (
                    <option key={v.id} value={v.id}>{v.nombre}</option>
                  ))}
                </select>
              </label>
            </div>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
              ¿Cómo te sientes?
            </h3>
            <p className="mt-1 text-xs text-gray-500">Decídelo ya que estás en el tapete, no antes.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {ESFUERZOS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { setEsfuerzo(e.id); setBloques([]); }}
                  className={`rounded-xl border-2 p-3 text-left transition ${
                    esfuerzo === e.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl">{e.emoji}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{e.nombre}</div>
                  <div className="text-xs text-gray-600">{e.pie}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ---------- bloques / actividades ---------- */}
        {(modo === 'parque' || permitidos > 0) && (
          <>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
              {modo === 'depa' ? `Elige ${permitidos} bloque${permitidos === 1 ? '' : 's'}` : '¿Qué hiciste?'}
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {disponibles.map((b) => (
                <BloqueCard
                  key={b.id}
                  bloque={b}
                  activo={bloques.includes(b.id)}
                  onClick={() => alternarBloque(b.id)}
                />
              ))}
              {bloqueados.map((b) => (
                <div key={b.id} className="rounded-xl border-2 border-dashed border-gray-200 p-3 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-lg grayscale">{b.emoji}</span>
                    <span className="text-sm font-semibold text-gray-500">{b.nombre}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    🔒 Se abre en el nivel {modo === 'depa' ? 5 : 3}
                    {modo === 'parque' && ' — dominadas y fondos'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {modo === 'parque' && (
          <label className="mt-4 block text-sm text-gray-700">
            Minutos <span className="text-gray-400">(opcional)</span>
            <input
              type="number"
              min={1}
              max={600}
              value={minutos}
              onChange={(e) => setMinutos(e.target.value)}
              placeholder="30"
              className="ml-2 w-24 rounded border border-gray-300 px-2 py-1"
            />
          </label>
        )}

        <button
          onClick={registrar}
          disabled={guardando || (modo === 'parque' && bloques.length === 0)}
          className="mt-6 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {guardando ? 'Guardando…' : racha.hoyHecho ? 'Registrar otra sesión' : 'Listo, ya entrené'}
        </button>
        {modo === 'parque' && bloques.length === 0 && (
          <p className="mt-2 text-center text-xs text-gray-500">Elige al menos una actividad.</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* ---------- historial ---------- */}
      {datos.historial.length > 0 && (
        <div className="rounded-2xl bg-white/90 p-6 shadow-md backdrop-blur sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Últimas sesiones</h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {datos.historial.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <span>{s.modo === 'parque' ? '🌳' : '🏠'}</span>
                  <span className="tabular-nums text-gray-700">{s.fecha}</span>
                  {s.bloques.length > 0 && (
                    <span className="text-gray-500">{s.bloques.join(' · ')}</span>
                  )}
                  {s.minutos && <span className="text-gray-500">{s.minutos} min</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium tabular-nums text-blue-700">+{s.xp}</span>
                  <button
                    onClick={() => borrar(s.id)}
                    aria-label={`Borrar la sesión del ${s.fecha}`}
                    className="text-gray-300 transition hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  );
}

function BloqueCard({ bloque, activo, onClick }: { bloque: Bloque; activo: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 p-3 text-left transition ${
        activo ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="text-lg">{bloque.emoji}</span>
          <span className="text-sm font-semibold text-gray-900">{bloque.nombre}</span>
        </span>
        <span className="text-xs text-gray-500">{bloque.minutos} min</span>
      </div>
      <ul className="mt-2 space-y-0.5">
        {bloque.ejercicios.map((e) => (
          <li key={e.nombre} className="text-xs text-gray-600">
            {e.nombre} <span className="text-gray-400">· {e.detalle}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fechaLarga, type QuehacerCalculado } from '@/lib/quehaceres';
import { muebleDeQuehacer, type Juego } from '@/lib/quehaceres-juego';
import type { Persona } from '@/lib/personas';
import { usePersona } from './depa/usePersona';
import { ChipPersona, SelectorPersona } from './depa/SelectorPersona';
import MapaQuehaceres from './quehaceres/MapaQuehaceres';
import ListaQuehaceres from './quehaceres/ListaQuehaceres';
import MarcadorDepa from './quehaceres/MarcadorDepa';
import type { DatosQuehacer } from './quehaceres/FormaQuehacer';
import type { Acciones } from './quehaceres/tipos';

/**
 * Tres puertas antes de llegar al depa: el PIN (servidor), quién eres
 * (aparato) y ya. Los datos son los mismos para los dos.
 */
export default function QuehaceresTracker() {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [sinConfigurar, setSinConfigurar] = useState(false);
  const { persona, escoger } = usePersona();
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    fetch('/api/quehaceres/pin')
      .then((r) => r.json())
      .then((d) => {
        setAutorizado(!!d.autorizado);
        setSinConfigurar(!!d.sinConfigurar);
      })
      .catch(() => setAutorizado(false));
  }, []);

  if (autorizado === null) return <Cargando />;

  if (!autorizado) {
    return <CandadoPin sinConfigurar={sinConfigurar} onEntrar={() => setAutorizado(true)} />;
  }

  if (!persona || cambiando) {
    return (
      <SelectorPersona
        onEscoger={(id) => {
          escoger(id);
          setCambiando(false);
        }}
      />
    );
  }

  return (
    <Tablero
      persona={persona}
      onCambiarPersona={() => setCambiando(true)}
      onSalir={() => setAutorizado(false)}
    />
  );
}

function Cargando() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
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
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
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

type Vista = 'mapa' | 'lista';

function Tablero({
  persona,
  onCambiarPersona,
  onSalir,
}: {
  persona: Persona;
  onCambiarPersona: () => void;
  onSalir: () => void;
}) {
  const [quehaceres, setQuehaceres] = useState<QuehacerCalculado[] | null>(null);
  const [juego, setJuego] = useState<Juego | null>(null);
  const [hoy, setHoy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>('mapa');
  const [destello, setDestello] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch('/api/quehaceres');
    if (res.status === 401) return onSalir();

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? 'No se pudieron cargar los quehaceres.');

    setQuehaceres(data.quehaceres);
    setJuego(data.juego);
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

  /** Todas las escrituras pasan por aquí: marcan ocupado, recargan y reportan. */
  const escribir = useCallback(
    async (id: string, init: RequestInit, falla: string) => {
      setOcupado(id);
      const res = await fetch(`/api/quehaceres/${id}`, init);
      setOcupado(null);

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? falla);
        return false;
      }

      await cargar();
      return true;
    },
    [cargar]
  );

  const patch = (id: string, cuerpo: Record<string, unknown>, falla: string) =>
    escribir(
      id,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) },
      falla
    );

  const acciones: Acciones = {
    ocupado,
    editando,
    onEditar: setEditando,

    async onHecho(q) {
      const ok = await patch(q.id, { hecho: true, quien: persona.id }, 'No se pudo marcar como hecho.');
      if (!ok) return;

      // El destello cae en el mismo mueble donde estaba la burbuja.
      setDestello(muebleDeQuehacer(q));
      setTimeout(() => setDestello(null), 900);
    },

    async onGuardar(id, datos) {
      if (await patch(id, datos, 'No se pudo guardar.')) setEditando(null);
    },

    async onReiniciar(id) {
      await patch(id, { ultima_vez: null }, 'No se pudo reiniciar.');
    },

    async onArchivar(id) {
      if (await escribir(id, { method: 'DELETE' }, 'No se pudo quitar el quehacer.')) {
        setEditando(null);
      }
    },

    async onCrear(datos: DatosQuehacer) {
      const res = await fetch('/api/quehaceres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'No se pudo agregar.');
        return false;
      }

      await cargar();
      return true;
    },
  };

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

  if (!quehaceres) return <Cargando />;

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <ChipPersona persona={persona} onCambiar={onCambiarPersona} />
        <span className="mr-auto text-sm capitalize text-gray-500">{hoy && fechaLarga(hoy)}</span>
        <Chip n={resumen.vencidos} etiqueta="atrasados" clase="border-red-200 bg-red-50 text-red-700" />
        <Chip n={resumen.hoy} etiqueta="hoy" clase="border-blue-200 bg-blue-50 text-blue-700" />
        <Chip n={resumen.pronto} etiqueta="ya casi" clase="border-amber-200 bg-amber-50 text-amber-700" />
        <Chip n={resumen.alDia} etiqueta="al día" clase="border-gray-200 bg-gray-50 text-gray-600" />
      </div>

      {/* Vistas */}
      <div className="mb-6 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
        <Pestana activa={vista === 'mapa'} onClick={() => setVista('mapa')}>
          🗺️ Mapa
        </Pestana>
        <Pestana activa={vista === 'lista'} onClick={() => setVista('lista')}>
          📋 Lista
        </Pestana>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {vista === 'mapa' ? (
        <MapaQuehaceres
          quehaceres={quehaceres}
          persona={persona}
          acciones={acciones}
          destello={destello}
        />
      ) : (
        <ListaQuehaceres quehaceres={quehaceres} acciones={acciones} />
      )}

      {juego && (
        <div className="mt-8">
          <MarcadorDepa juego={juego} />
        </div>
      )}

      {/* Pie */}
      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-5 text-sm">
        <p className="mr-auto text-gray-500">
          Te llega un correo a las 7:00 a.m. cuando algo esté pendiente.
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

function Pestana({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activa}
      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
        activa ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
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

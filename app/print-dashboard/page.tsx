'use client';
import { useEffect, useState } from 'react';

type Pedido = {
  id: string;
  telefono: string;
  copias: number;
  tipo: string;
  status: string;
  archivo_url: string;
  created_at: string;
  error?: string | null;
};

export default function PrintDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  async function load() {
    try {
      const res = await fetch('/api/pedidos');
      if (res.ok) setPedidos(await res.json());
    } catch {}
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    load();
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const counts = pedidos.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Print Dashboard</h1>
        <p className="mb-6 text-sm text-gray-600">
          {pedidos.length} pedidos · {counts.pending ?? 0} en cola · {counts.printing ?? 0} imprimiendo ·{' '}
          {counts.done ?? 0} listos · {counts.error ?? 0} con error
        </p>

        <div className="space-y-3">
          {pedidos.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs text-gray-500">{p.telefono}</div>
                <div className="text-lg font-semibold">
                  {p.copias} × {p.tipo.toUpperCase()}
                </div>
                <a
                  href={p.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Ver PDF
                </a>
                {p.error && <div className="mt-1 text-xs text-red-600">{p.error}</div>}
                <div className="mt-1 text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleString('es-AR')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    p.status === 'done'
                      ? 'bg-green-100 text-green-700'
                      : p.status === 'printing'
                        ? 'bg-blue-100 text-blue-700'
                        : p.status === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {p.status}
                </span>
                {p.status !== 'done' && (
                  <button
                    onClick={() =>
                      patch(p.id, {
                        status: 'done',
                        printedAt: new Date().toISOString(),
                        processing: false,
                      })
                    }
                    className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700"
                  >
                    Listo
                  </button>
                )}
                {p.status === 'error' && (
                  <button
                    onClick={() => patch(p.id, { status: 'pending', processing: false, error: null })}
                    className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-800 transition hover:bg-gray-300"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          ))}
          {pedidos.length === 0 && (
            <div className="rounded-lg bg-white p-12 text-center text-gray-500 shadow-md">
              No hay pedidos aún.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

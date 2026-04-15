'use client';
import { useEffect, useMemo, useState } from 'react';

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

type Group = {
  telefono: string;
  pedidos: Pedido[];
  lastCreatedAt: string;
  pendingCount: number;
};

const statusClass = (s: string) =>
  s === 'done'
    ? 'bg-green-100 text-green-700'
    : s === 'printing'
      ? 'bg-blue-100 text-blue-700'
      : s === 'error'
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-700';

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

  function markDone(id: string) {
    return patch(id, {
      status: 'done',
      printedAt: new Date().toISOString(),
      processing: false,
    });
  }

  async function markAllDone(group: Group) {
    const targets = group.pedidos.filter((p) => p.status !== 'done');
    await Promise.all(
      targets.map((p) =>
        fetch(`/api/pedidos/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'done',
            printedAt: new Date().toISOString(),
            processing: false,
          }),
        })
      )
    );
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

  const groups = useMemo<Group[]>(() => {
    const byPhone = new Map<string, Pedido[]>();
    for (const p of pedidos) {
      const arr = byPhone.get(p.telefono) ?? [];
      arr.push(p);
      byPhone.set(p.telefono, arr);
    }
    return Array.from(byPhone.entries())
      .map(([telefono, list]) => {
        const sorted = [...list].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return {
          telefono,
          pedidos: sorted,
          lastCreatedAt: sorted[sorted.length - 1].created_at,
          pendingCount: sorted.filter((p) => p.status !== 'done').length,
        };
      })
      .sort((a, b) => {
        if (a.pendingCount > 0 !== b.pendingCount > 0) return a.pendingCount > 0 ? -1 : 1;
        return new Date(b.lastCreatedAt).getTime() - new Date(a.lastCreatedAt).getTime();
      });
  }, [pedidos]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Print Dashboard</h1>
        <p className="mb-6 text-sm text-gray-600">
          {pedidos.length} archivos · {groups.length} números · {counts.pending ?? 0} en cola ·{' '}
          {counts.printing ?? 0} imprimiendo · {counts.done ?? 0} listos · {counts.error ?? 0} con
          error
        </p>

        <div className="space-y-4">
          {groups.map((g) => {
            const allDone = g.pendingCount === 0;
            return (
              <div
                key={g.telefono}
                className={`rounded-lg bg-white shadow-md ${allDone ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
                  <div>
                    <div className="font-mono text-sm text-gray-700">{g.telefono}</div>
                    <div className="text-xs text-gray-500">
                      {g.pedidos.length} archivo(s)
                      {g.pendingCount > 0 && (
                        <span className="ml-2 font-semibold text-blue-600">
                          {g.pendingCount} pendiente(s)
                        </span>
                      )}
                    </div>
                  </div>
                  {!allDone && (
                    <button
                      onClick={() => markAllDone(g)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Marcar todos listos
                    </button>
                  )}
                </div>

                <ul className="divide-y divide-gray-100">
                  {g.pedidos.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold">
                          {p.copias} × {p.tipo.toUpperCase()}
                        </div>
                        <a
                          href={p.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver archivo
                        </a>
                        {p.error && <div className="mt-1 text-xs text-red-600">{p.error}</div>}
                        <div className="mt-0.5 text-xs text-gray-400">
                          {new Date(p.created_at).toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(p.status)}`}
                        >
                          {p.status}
                        </span>
                        {p.status !== 'done' && (
                          <button
                            onClick={() => markDone(p.id)}
                            className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700"
                          >
                            Listo
                          </button>
                        )}
                        {p.status === 'error' && (
                          <button
                            onClick={() =>
                              patch(p.id, { status: 'pending', processing: false, error: null })
                            }
                            className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-800 transition hover:bg-gray-300"
                          >
                            Reintentar
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="rounded-lg bg-white p-12 text-center text-gray-500 shadow-md">
              No hay pedidos aún.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

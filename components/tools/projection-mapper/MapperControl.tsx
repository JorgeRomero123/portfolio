'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EFFECT_LIST } from './effects';
import { addMedia, deleteMedia, listMedia, type MediaItem } from './media';
import { duplicateSurface, newSurface, type MapState, type Point, type Surface } from './model';
import {
  getDeviceId, joinRoom, loadState, normalizeRoom, randomRoom, remoteSyncAvailable,
  type Room, type SyncStatus,
} from './sync';

const SWATCHES = ['#ff8ad8', '#ffffff', '#ff7a1a', '#7dff6a', '#7fd3ff', '#b46bff', '#ff2a2a', '#ffd166'];
const CORNERS = ['Top left', 'Top right', 'Bottom right', 'Bottom left'];
// Both columns fill the viewport under the sticky site nav on laptops.
const COLUMN_H = 'lg:h-[calc(100dvh-7rem)]';

function pickRoom(): string {
  const fromUrl = new URLSearchParams(location.search).get('room');
  let room = fromUrl ? normalizeRoom(fromUrl) : '';
  try { room ||= localStorage.getItem('pm-room') ?? ''; } catch {}
  return room || randomRoom();
}

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Client-only (loaded with ssr: false): the room and saved layout come from the URL and
// localStorage, so they can be read up front instead of after mount.
export default function MapperControl() {
  const [room, setRoom] = useState(pickRoom);
  const [state, setState] = useState<MapState>(() => loadState(room));
  const [status, setStatus] = useState<SyncStatus>(remoteSyncAvailable ? 'connecting' : 'local');
  const [deviceId] = useState(getDeviceId);
  // Mirror of `state` for event handlers and the sync layer, which need the latest value.
  const stateRef = useRef(state);
  const roomRef = useRef<Room | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [fine, setFine] = useState(false);
  const [corner, setCorner] = useState(0); // corner the nudge pad moves; -1 = whole surface
  const [media, setMedia] = useState<(MediaItem & { url: string })[]>([]);
  const [joinDraft, setJoinDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; corner: number; x: number; y: number; start: Point[] } | null>(null);

  useEffect(() => {
    try { localStorage.setItem('pm-room', room); } catch {}
    history.replaceState(null, '', `?room=${room}`);
    const r = joinRoom(room, () => stateRef.current, (s) => { stateRef.current = s; setState(s); }, setStatus);
    roomRef.current = r;
    return () => { r.close(); roomRef.current = null; };
  }, [room]);

  const switchRoom = (r: string) => {
    if (r === room) return;
    const s = loadState(r);
    stateRef.current = s;
    setState(s);
    setUndoStack([]);
    setRoom(r);
  };

  const sel = state.surfaces.find((s) => s.id === state.selected) ?? null;

  const pushUndo = (surfaces: Surface[]) => setUndoStack((u) => [...u.slice(-59), JSON.stringify(surfaces)]);

  /** Apply an edit to a copy of the state: stamp it, broadcast it, re-render. */
  const commit = (mutate: (s: MapState) => void, undoable = true) => {
    const prev = stateRef.current;
    if (undoable) pushUndo(prev.surfaces);
    const next = structuredClone(prev);
    mutate(next);
    next.updatedAt = Date.now();
    stateRef.current = next;
    roomRef.current?.send(next);
    setState(next);
  };

  const editSel = (mutate: (s: Surface) => void, undoable = false) =>
    commit((st) => { const s = st.surfaces.find((x) => x.id === st.selected); if (s) mutate(s); }, undoable);

  // ---------- Stage ----------
  const draw = useCallback(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const st = state;
    // Side-by-side layout: the stage fills its column. Stacked (phones): cap its height.
    const maxH = matchMedia('(min-width: 1024px)').matches ? wrap.clientHeight : innerHeight * 0.55;
    const H = Math.min(wrap.clientWidth / st.aspect, maxH);
    const W = H * st.aspect;
    const dpr = devicePixelRatio || 1;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    }
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0b0b12'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1c1c28'; ctx.lineWidth = 1;
    for (let i = 1; i < 16; i++) { ctx.beginPath(); ctx.moveTo((W * i) / 16, 0); ctx.lineTo((W * i) / 16, H); ctx.stroke(); }
    for (let i = 1; i < 9; i++) { ctx.beginPath(); ctx.moveTo(0, (H * i) / 9); ctx.lineTo(W, (H * i) / 9); ctx.stroke(); }

    const quad = (pts: Point[]) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); };
    const ordered = [...st.surfaces].sort((a, b) => Number(a.id === st.selected) - Number(b.id === st.selected));
    for (const s of ordered) {
      const isSel = s.id === st.selected;
      const pts = s.pts.map(([x, y]) => [x * W, y * H] as Point);
      ctx.globalAlpha = s.visible ? 1 : 0.35;
      quad(pts);
      ctx.fillStyle = isSel ? 'rgba(0,112,243,.3)' : 'rgba(130,140,170,.15)';
      ctx.fill();
      ctx.strokeStyle = isSel ? '#3b93ff' : '#5c6178';
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        ctx.beginPath(); ctx.moveTo(...lerp(pts[0], pts[1], t)); ctx.lineTo(...lerp(pts[3], pts[2], t)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(...lerp(pts[0], pts[3], t)); ctx.lineTo(...lerp(pts[1], pts[2], t)); ctx.stroke();
      }
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      quad(pts); ctx.stroke();
      if (isSel) {
        pts.forEach((p, i) => {
          const active = corner === -1 || i === corner;
          ctx.beginPath(); ctx.arc(p[0], p[1], active ? 11 : 9, 0, Math.PI * 2);
          ctx.fillStyle = active ? '#ffd166' : '#fff'; ctx.fill();
          ctx.strokeStyle = '#0b0b12'; ctx.lineWidth = 2; ctx.stroke();
        });
      }
      ctx.globalAlpha = 1;
    }
  }, [corner, state]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    addEventListener('resize', draw);
    return () => { ro.disconnect(); removeEventListener('resize', draw); };
  }, [draw]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const st = stateRef.current;
    const toPx = ([px, py]: Point): Point => [px * r.width, py * r.height];
    const begin = (s: Surface, c: number) => {
      pushUndo(st.surfaces);
      drag.current = { id: s.id, corner: c, x, y, start: s.pts.map((p) => [...p] as Point) };
      canvas.setPointerCapture(e.pointerId);
    };
    // 1) A corner of the selected surface, with a finger-sized hit radius.
    const cur = st.surfaces.find((s) => s.id === st.selected);
    if (cur) {
      let best = -1, bestD = 34;
      cur.pts.map(toPx).forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bestD) { bestD = d; best = i; } });
      if (best >= 0) { begin(cur, best); setCorner(best); return; }
    }
    // 2) Inside a surface (topmost first): select it and move it whole.
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const s of [...st.surfaces].reverse()) {
      const pts = s.pts.map(toPx);
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath();
      if (ctx.isPointInPath(x, y)) {
        begin(s, -1);
        commit((m) => { m.selected = s.id; }, false);
        return;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = fine ? 0.2 : 1;
    const dx = ((e.clientX - r.left - d.x) * k) / r.width;
    const dy = ((e.clientY - r.top - d.y) * k) / r.height;
    commit((st) => {
      const s = st.surfaces.find((x) => x.id === d.id);
      if (s) s.pts = d.start.map((p, i) => (d.corner === -1 || d.corner === i ? [p[0] + dx, p[1] + dy] : p));
    }, false);
  };
  const endDrag = () => { drag.current = null; };

  const nudge = (dx: number, dy: number) => {
    // One step is one projector pixel, assuming a 1920-wide output.
    const sx = dx / 1920, sy = dy / (1920 / state.aspect);
    editSel((s) => { s.pts = s.pts.map((p, i) => (corner === -1 || corner === i ? [p[0] + sx, p[1] + sy] : p)); }, true);
  };

  const undo = () => {
    const prev = undoStack.at(-1);
    if (!prev) return;
    setUndoStack((u) => u.slice(0, -1));
    commit((st) => {
      st.surfaces = JSON.parse(prev);
      if (!st.surfaces.some((s) => s.id === st.selected)) st.selected = st.surfaces.at(-1)?.id ?? null;
    }, false);
  };

  // Keyboard shortcuts, so fine-tuning on a laptop doesn't need the mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      const k = e.key;
      const arrows: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (arrows[k] && sel) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        nudge(arrows[k][0] * step, arrows[k][1] * step);
      } else if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      } else if (k >= '1' && k <= '4') {
        setCorner(+k - 1);
      } else if (k.toLowerCase() === 'w') {
        setCorner(-1);
      } else if (k.toLowerCase() === 'g') {
        commit((st) => { st.showGrid = !st.showGrid; }, false);
      } else if (k.toLowerCase() === 'b') {
        commit((st) => { st.blackout = !st.blackout; }, false);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const move = (dir: number) => commit((st) => {
    const i = st.surfaces.findIndex((s) => s.id === st.selected), j = i + dir;
    if (i < 0 || j < 0 || j >= st.surfaces.length) return;
    [st.surfaces[i], st.surfaces[j]] = [st.surfaces[j], st.surfaces[i]];
  });

  // ---------- Media (only on the device that runs the projector window) ----------
  const sameDeviceAsOutput = !state.outputDevice || state.outputDevice === deviceId;
  const refreshMedia = useCallback(() => {
    listMedia()
      .then((items) => setMedia((old) => {
        old.forEach((m) => URL.revokeObjectURL(m.url));
        return items.map((m) => ({ ...m, url: URL.createObjectURL(m.blob) }));
      }))
      .catch(() => setMedia([]));
  }, []);
  useEffect(() => { if (sel?.content === 'media' && sameDeviceAsOutput) refreshMedia(); }, [sel?.content, sameDeviceAsOutput, refreshMedia]);

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    const item = await addMedia(file);
    editSel((s) => { s.media = item.id; s.content = 'media'; }, true);
    refreshMedia();
  };

  // ---------- Links ----------
  const phoneUrl = `${location.origin}/tools/projection-mapper?room=${room}`;
  const outputUrl = `/tools/projection-mapper/output?room=${room}`;

  const btn = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:scale-[.98] disabled:opacity-40';
  const btnOn = 'rounded-lg border border-[#0070f3] bg-[#0070f3] px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors active:scale-[.98]';
  const label = 'mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400';

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-5 lg:space-y-0">
      {/* Stage */}
      <section className={`rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4 lg:sticky lg:top-20 lg:flex lg:flex-col ${COLUMN_H}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button className={state.showGrid ? btnOn : btn} onClick={() => commit((s) => { s.showGrid = !s.showGrid; }, false)}>Grid</button>
          <button
            className={state.blackout ? 'rounded-lg border border-red-500 bg-red-500 px-3 py-2 text-sm font-medium text-white' : btn}
            onClick={() => commit((s) => { s.blackout = !s.blackout; }, false)}
          >
            Blackout
          </button>
          <button className={fine ? btnOn : btn} onClick={() => setFine((f) => !f)}>Fine drag</button>
          <button className={btn} onClick={undo} disabled={!undoStack.length}>Undo</button>
          <button
            className={`${btnOn} ml-auto`}
            onClick={() => commit((st) => { const s = newSurface(st.surfaces.length); st.surfaces.push(s); st.selected = s.id; setCorner(0); })}
          >
            + Surface
          </button>
        </div>
        <div ref={wrapRef} className="flex justify-center lg:relative lg:min-h-0 lg:flex-1">
          <canvas
            ref={canvasRef}
            className="block touch-none rounded-xl lg:absolute lg:inset-0 lg:m-auto"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        </div>
        {state.surfaces.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {state.surfaces.map((s) => (
              <button
                key={s.id}
                className={`${s.id === state.selected ? btnOn : btn} shrink-0 whitespace-nowrap`}
                onClick={() => commit((st) => { st.selected = s.id; }, false)}
              >
                {s.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-center text-sm text-gray-500">
            Add a surface, then drag its corners until the grid on the projector lines up with your object.
          </p>
        )}
      </section>

      {/* Settings: own scroll column next to the stage on laptops */}
      <div className={`space-y-4 lg:sticky lg:top-20 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 ${COLUMN_H}`}>
        {/* Room / connection */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className={label + ' mb-0.5'}>Room</p>
              <p className="font-mono text-2xl font-bold tracking-[0.25em] text-gray-900">{room}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status === 'online' ? 'bg-green-50 text-green-700' : status === 'local' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-50 text-yellow-700'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status === 'online' ? 'bg-green-500' : status === 'local' ? 'bg-gray-400' : 'bg-yellow-500'}`} />
              {status === 'online' ? 'Phone sync on' : status === 'local' ? 'This browser only' : 'Connecting'}
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button className={btnOn} onClick={() => window.open(outputUrl, 'pm-output', 'popup,width=1280,height=720')}>
                Open projector window
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Control from your phone</p>
              {remoteSyncAvailable ? (
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate text-xs text-gray-500">{phoneUrl}</code>
                  <button
                    className="text-xs font-semibold text-[#0070f3]"
                    onClick={() => navigator.clipboard?.writeText(phoneUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-xs">Phone sync isn&apos;t configured on this deployment; use a second window in this browser.</p>
              )}
            </div>
            <form
              className="flex items-end gap-2 rounded-lg bg-gray-50 p-3"
              onSubmit={(e) => { e.preventDefault(); const r = normalizeRoom(joinDraft); if (r) { switchRoom(r); setJoinDraft(''); } }}
            >
              <label className="flex-1 text-sm">
                <span className="font-medium text-gray-800">Join another room</span>
                <input
                  value={joinDraft}
                  onChange={(e) => setJoinDraft(e.target.value)}
                  placeholder="CODE"
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 font-mono uppercase tracking-widest outline-none focus:border-[#0070f3]"
                />
              </label>
              <button className={btn}>Join</button>
            </form>
          </div>
        </section>

        {/* Selected surface */}
        {sel ? (
          <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div>
              <p className={label}>Name</p>
              <input
                value={sel.name}
                onChange={(e) => editSel((s) => { s.name = e.target.value; })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0070f3]"
              />
            </div>

            <div>
              <p className={label}>Content</p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-4">
                {EFFECT_LIST.map(([k, l]) => (
                  <button key={k} className={`${sel.content === k ? btnOn : btn} px-1`} onClick={() => editSel((s) => { s.content = k; }, true)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {sel.content === 'text' && (
              <div>
                <p className={label}>Text</p>
                <input
                  value={sel.text}
                  maxLength={24}
                  onChange={(e) => editSel((s) => { s.text = e.target.value; })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0070f3]"
                />
              </div>
            )}

            {sel.content === 'media' && (
              <div>
                <p className={label}>Image / video</p>
                {sameDeviceAsOutput ? (
                  <>
                    <label className={`${btn} inline-block cursor-pointer`}>
                      Add file
                      <input type="file" accept="image/*,video/*" hidden onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                    <p className="mt-1.5 text-xs text-gray-500">Files stay in this browser; nothing is uploaded.</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {media.map((m) => (
                        <MediaThumb
                          key={m.id}
                          item={m}
                          active={sel.media === m.id}
                          onPick={() => editSel((s) => { s.media = m.id; }, true)}
                          onDelete={() => deleteMedia(m.id).then(refreshMedia)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    Images and videos are added on the computer that runs the projector window. Open this room there to pick one.
                  </p>
                )}
              </div>
            )}

            <div>
              <p className={label}>Colour</p>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    aria-label={`Colour ${c}`}
                    className={`h-8 w-8 rounded-full border-2 shadow-sm ${sel.color === c ? 'border-gray-900' : 'border-gray-200'}`}
                    style={{ background: c }}
                    onClick={() => editSel((s) => { s.color = c; })}
                  />
                ))}
                <input type="color" value={sel.color} onChange={(e) => editSel((s) => { s.color = e.target.value; })} className="h-9 w-11 cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5" />
              </div>
              <Slider label="Speed" value={sel.speed} min={0} max={3} step={0.05} format={(v) => `${v.toFixed(2)}x`} onChange={(v) => editSel((s) => { s.speed = v; })} />
              <Slider label="Brightness" value={sel.opacity} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => editSel((s) => { s.opacity = v; })} />
            </div>

            <div>
              <p className={label}>Nudge corner</p>
              <div className="flex flex-wrap items-start gap-4">
                <div className="grid min-w-[180px] flex-1 grid-cols-2 gap-1.5">
                  {CORNERS.map((n, i) => (
                    <button key={n} className={corner === i ? btnOn : btn} onClick={() => setCorner(i)}>{n}</button>
                  ))}
                  <button className={`${corner === -1 ? btnOn : btn} col-span-2`} onClick={() => setCorner((c) => (c === -1 ? 0 : -1))}>
                    Whole surface
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <span />
                  <button className={`${btn} h-11 w-12`} aria-label="Up" onClick={() => nudge(0, -1)}>&uarr;</button>
                  <span />
                  <button className={`${btn} h-11 w-12`} aria-label="Left" onClick={() => nudge(-1, 0)}>&larr;</button>
                  <span />
                  <button className={`${btn} h-11 w-12`} aria-label="Right" onClick={() => nudge(1, 0)}>&rarr;</button>
                  <span />
                  <button className={`${btn} h-11 w-12`} aria-label="Down" onClick={() => nudge(0, 1)}>&darr;</button>
                  <span />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Each tap moves one projector pixel.</p>
              <p className="mt-1 hidden text-xs text-gray-500 lg:block">
                Keyboard: arrows nudge (Shift for 10px) · 1–4 pick a corner · W whole surface · ⌘Z undo · G grid · B blackout
              </p>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <button className={btn} onClick={() => editSel((s) => { s.visible = !s.visible; }, true)}>{sel.visible ? 'Hide' : 'Show'}</button>
              <button className={btn} onClick={() => commit((st) => { const c = duplicateSurface(sel); st.surfaces.push(c); st.selected = c.id; })}>Duplicate</button>
              <button className={btn} onClick={() => move(1)}>Bring forward</button>
              <button className={btn} onClick={() => move(-1)}>Send back</button>
              <button
                className={`${btn} ml-auto text-red-600`}
                onClick={() => commit((st) => { st.surfaces = st.surfaces.filter((s) => s.id !== sel.id); st.selected = st.surfaces.at(-1)?.id ?? null; })}
              >
                Delete
              </button>
            </div>
          </section>
        ) : (
          <section className="hidden rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 lg:block">
            Select a surface on the left, or add one, to change what it shows.
          </section>
        )}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <label className="mt-3 flex items-center gap-3 text-sm text-gray-600">
      <span className="w-20 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="flex-1 accent-[#0070f3]" />
      <span className="w-12 text-right tabular-nums">{format(value)}</span>
    </label>
  );
}

function MediaThumb({ item, active, onPick, onDelete }: {
  item: MediaItem & { url: string }; active: boolean; onPick: () => void; onDelete: () => void;
}) {
  const { url } = item;
  return (
    <div className={`group relative aspect-square overflow-hidden rounded-lg bg-gray-900 ${active ? 'ring-2 ring-[#0070f3] ring-offset-2' : ''}`}>
      <button className="h-full w-full" onClick={onPick} title={item.name}>
        {item.type.startsWith('video/')
          ? <video src={`${url}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={url} alt={item.name} className="h-full w-full object-cover" />}
      </button>
      <button
        onClick={onDelete}
        aria-label={`Remove ${item.name}`}
        className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        &times;
      </button>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Creepster } from 'next/font/google';
import { effects, type EffectMemory } from './effects';
import { getMedia } from './media';
import { quadTransform, type MapState, type Point, type Surface } from './model';
import { getDeviceId, joinRoom, loadState, normalizeRoom, type Room, type SyncStatus } from './sync';

const creepster = Creepster({ weight: '400', subsets: ['latin'] });

/**
 * Fullscreen projector output. Every surface is a canvas (or media element) sized to
 * roughly its projected size, then warped onto its four corners with a CSS matrix3d.
 */

interface View {
  el: HTMLDivElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  grid: HTMLCanvasElement;
  gctx: CanvasRenderingContext2D;
  media: HTMLImageElement | HTMLVideoElement | null;
  mediaId: string | null;
  mediaUrl: string | null;
  mem: EffectMemory;
  w: number;
  h: number;
  time: number;
  last: number | null;
}

const edge = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function drawGrid(v: View, s: Surface, state: MapState) {
  const { gctx: g, w, h } = v;
  g.clearRect(0, 0, w, h);
  if (!state.showGrid) return;
  const col = state.selected === s.id ? '#ffd166' : '#7fd3ff';
  g.strokeStyle = col;
  g.lineWidth = Math.max(1.5, Math.min(w, h) / 220);
  g.globalAlpha = 0.85;
  g.beginPath();
  for (let i = 1; i < 8; i++) {
    g.moveTo((w * i) / 8, 0); g.lineTo((w * i) / 8, h);
    g.moveTo(0, (h * i) / 8); g.lineTo(w, (h * i) / 8);
  }
  g.stroke();
  g.globalAlpha = 1;
  g.lineWidth *= 3;
  g.strokeRect(0, 0, w, h);
  const r = Math.min(w, h) * 0.06;
  g.fillStyle = col;
  for (const [x, y] of [[0, 0], [w, 0], [w, h], [0, h]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  g.font = `600 ${Math.max(14, Math.min(w, h) * 0.07)}px system-ui, sans-serif`;
  g.fillText(s.name, r * 1.4, r * 1.6);
}

export default function ProjectorOutput({ initialRoom }: { initialRoom: string | null }) {
  const [room, setRoom] = useState(initialRoom ? normalizeRoom(initialRoom) : '');
  const [draftRoom, setDraftRoom] = useState('');
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [hint, setHint] = useState(true);
  const [editing, setEditing] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<MapState | null>(null);
  const roomRef = useRef<Room | null>(null);
  const editingRef = useRef(false);

  useEffect(() => { editingRef.current = editing; }, [editing]);

  useEffect(() => {
    if (!room) return;
    const stage = stageRef.current!;
    const deviceId = getDeviceId();
    const views = new Map<string, View>();
    stateRef.current = loadState(room);

    // Metadata changes (window size, which device is the output) bump the clock by one
    // tick instead of to "now", so a freshly opened output never overrides a newer layout.
    const report = () => {
      const s = stateRef.current!;
      const aspect = innerWidth / innerHeight;
      if (Math.abs(s.aspect - aspect) > 0.005 || s.outputDevice !== deviceId) {
        stateRef.current = { ...s, aspect, outputDevice: deviceId, updatedAt: s.updatedAt + 1 };
        roomRef.current?.send(stateRef.current);
      }
    };

    const r = joinRoom(room, () => stateRef.current!, (s) => { stateRef.current = s; report(); }, setStatus);
    roomRef.current = r;
    report();
    addEventListener('resize', report);

    const viewFor = (s: Surface) => {
      let v = views.get(s.id);
      if (!v) {
        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;overflow:hidden';
        const canvas = document.createElement('canvas');
        const grid = document.createElement('canvas');
        for (const c of [canvas, grid]) c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
        el.append(canvas, grid);
        stage.append(el);
        v = { el, canvas, ctx: canvas.getContext('2d')!, grid, gctx: grid.getContext('2d')!, media: null, mediaId: null,
          mediaUrl: null, mem: {}, w: 0, h: 0, time: 0, last: null };
        views.set(s.id, v);
      }
      return v;
    };

    const dropMedia = (v: View) => {
      v.media?.remove();
      if (v.mediaUrl) URL.revokeObjectURL(v.mediaUrl);
      v.media = null; v.mediaUrl = null;
    };

    const syncMedia = (v: View, s: Surface) => {
      const want = s.content === 'media' ? s.media : null;
      if (v.mediaId === want) return;
      v.mediaId = want;
      dropMedia(v);
      if (!want) return;
      getMedia(want).then((item) => {
        if (!item || v.mediaId !== want) return;
        const video = item.type.startsWith('video/');
        const m = document.createElement(video ? 'video' : 'img');
        m.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:fill';
        v.mediaUrl = URL.createObjectURL(item.blob);
        m.src = v.mediaUrl;
        if (m instanceof HTMLVideoElement) {
          m.loop = true; m.muted = true; m.playsInline = true;
          m.play().catch(() => {});
        }
        v.el.insertBefore(m, v.grid);
        v.media = m;
      }).catch(() => {});
    };

    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const state = stateRef.current!;
      const W = innerWidth, H = innerHeight;
      stage.style.display = state.blackout ? 'none' : '';
      const seen = new Set<string>();
      state.surfaces.forEach((s, i) => {
        seen.add(s.id);
        const v = viewFor(s);
        const pts = s.pts.map(([x, y]) => [x * W, y * H] as Point);
        const w = Math.max(32, Math.min(1600, Math.round((edge(pts[0], pts[1]) + edge(pts[3], pts[2])) / 2)));
        const h = Math.max(32, Math.min(1600, Math.round((edge(pts[0], pts[3]) + edge(pts[1], pts[2])) / 2)));
        if (w !== v.w || h !== v.h) {
          v.w = w; v.h = h;
          v.canvas.width = v.grid.width = w;
          v.canvas.height = v.grid.height = h;
          v.el.style.width = `${w}px`; v.el.style.height = `${h}px`;
        }
        v.el.style.transform = quadTransform(w, h, pts);
        v.el.style.display = s.visible ? '' : 'none';
        v.el.style.opacity = String(s.opacity);
        v.el.style.zIndex = String(i);
        syncMedia(v, s);
        if (s.visible && !v.media) {
          // Each surface keeps its own clock so speed changes don't make it jump.
          v.time += (Math.min(100, now - (v.last ?? now)) / 1000) * s.speed;
          (effects[s.content] ?? effects.none)(v.ctx, w, h, v.time, s, v.mem, creepster.style.fontFamily);
        }
        v.last = now;
        drawGrid(v, s, state);
      });
      for (const [id, v] of views) if (!seen.has(id)) { dropMedia(v); v.el.remove(); views.delete(id); }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', report);
      r.close();
      roomRef.current = null;
      for (const v of views.values()) { dropMedia(v); v.el.remove(); }
    };
  }, [room]);

  // Keyboard shortcuts and mouse corner editing, for when there's no phone around.
  useEffect(() => {
    if (!room) return;
    const t = setTimeout(() => setHint(false), 8000);
    const commit = (next: MapState) => {
      stateRef.current = { ...next, updatedAt: Date.now() };
      roomRef.current?.send(stateRef.current);
    };
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s || (e.target as HTMLElement).tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'e') setEditing((x) => !x);
      if (k === 'g') commit({ ...s, showGrid: !s.showGrid });
      if (k === 'b') commit({ ...s, blackout: !s.blackout });
      if (k === 'f') document.documentElement.requestFullscreen?.().catch(() => {});
    };
    let drag: { id: string; i: number } | null = null;
    const onDown = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (!editingRef.current) {
        setHint(false);
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
        return;
      }
      let bestD = 40;
      for (const surf of s.surfaces) surf.pts.forEach(([x, y], i) => {
        const d = Math.hypot(x * innerWidth - e.clientX, y * innerHeight - e.clientY);
        if (d < bestD) { bestD = d; drag = { id: surf.id, i }; }
      });
      if (drag) commit({ ...s, selected: drag.id });
    };
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!drag || !s) return;
      const { id, i } = drag;
      const p: Point = [e.clientX / innerWidth, e.clientY / innerHeight];
      commit({ ...s, surfaces: s.surfaces.map((x) => (x.id === id ? { ...x, pts: x.pts.map((q, j) => (j === i ? p : q)) } : x)) });
    };
    const onUp = () => { drag = null; };
    addEventListener('keydown', onKey);
    addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    return () => {
      clearTimeout(t);
      removeEventListener('keydown', onKey);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
    };
  }, [room]);

  // Hide the cursor when it's idle so it doesn't show up on the projection.
  const [cursorIdle, setCursorIdle] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const poke = () => { setCursorIdle(false); clearTimeout(t); t = setTimeout(() => setCursorIdle(true), 2000); };
    poke();
    addEventListener('mousemove', poke);
    return () => { clearTimeout(t); removeEventListener('mousemove', poke); };
  }, []);

  if (!room) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6">
        <form
          className="w-full max-w-xs text-center"
          onSubmit={(e) => {
            e.preventDefault();
            const r = normalizeRoom(draftRoom);
            if (r) { history.replaceState(null, '', `?room=${r}`); setRoom(r); }
          }}
        >
          <p className="text-lg font-semibold">Projector output</p>
          <p className="mt-1 text-sm text-gray-400">Enter the room code shown on the control page.</p>
          <input
            value={draftRoom}
            onChange={(e) => setDraftRoom(e.target.value)}
            autoFocus
            placeholder="ABCD"
            className="mt-5 w-full rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 text-center text-2xl font-mono tracking-[0.4em] uppercase outline-none focus:border-blue-500"
          />
          <button className="mt-3 w-full rounded-lg bg-[#0070f3] py-3 font-medium hover:bg-blue-600 transition-colors">Join</button>
        </form>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black overflow-hidden select-none ${cursorIdle && !editing ? 'cursor-none' : ''}`}>
      <div ref={stageRef} className="absolute inset-0" />
      {editing && (
        <div className="fixed top-3 left-3 rounded-md bg-[#ffd166] px-3 py-1.5 text-sm font-semibold text-black">
          Edit mode: drag corners · E to exit
        </div>
      )}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-800 bg-gray-950 px-6 py-5 text-center text-sm leading-relaxed text-gray-400 transition-opacity duration-500 ${hint ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <p className="text-base font-semibold text-white">
          Room <span className="font-mono tracking-widest">{room}</span>
          <span className={`ml-2 inline-block h-2 w-2 rounded-full align-middle ${status === 'online' ? 'bg-green-500' : status === 'local' ? 'bg-gray-500' : 'bg-yellow-500'}`} />
        </p>
        <p className="mt-1">Click for fullscreen · <b className="text-white">E</b> edit corners · <b className="text-white">G</b> grid · <b className="text-white">B</b> blackout</p>
      </div>
    </div>
  );
}

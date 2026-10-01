'use client';

// "One link": twenty separate files (photos, videos, 360 spheres, PDFs) drift down the screen.
// Slide the open album underneath to catch them (drag / point, or hold ←/→ to accelerate).
// Spam and tangled "20 attachments" chats also fall: catching one knocks a file back out.
// Win: at least WIN of the 20 files end up in the album. The album then closes into one link chip.
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { MiniGameProps } from '../types';
import { AlbumArt, ItemIcon, LinkGlyph, TEAL, type FileKind, type ItemKind, type JunkKind } from './onelink/art';

const TOTAL = 20;
const WIN = 14;
const FILE_KINDS: FileKind[] = ['photo', 'video', 'pano', 'pdf'];
const PAIRS = new Set([5, 8, 11, 13, 16, 18]); // files that land hot on the heels of the previous one
const JUNK_AFTER = [2, 5, 8, 10, 13, 15, 18]; // a distraction lands between file i and i+1

const T = {
  en: {
    intro: 'Twenty separate files are headed your way. Catch them all in one album.',
    avoid: 'Dodge the spam and the 20-attachment chats.',
    keys: '← → move · hold to speed up',
    pointer: 'or drag / point',
    start: 'Open the album',
    counter: (n: number) => `${n}/${TOTAL} in one link`,
    goal: `Goal ${WIN}`,
    area: 'Play area. Files fall from the top. Move the album with the left and right arrow keys, or drag. Avoid spam and cluttered chats.',
    junk: 'Spam! A file fell out.',
    winTitle: 'All in one link!',
    winSub: (n: number) => `${n}/${TOTAL} files bundled.`,
    loseTitle: 'Too many loose files',
    loseSub: (n: number) => `${n}/${TOTAL}; you needed ${WIN}.`,
    tagline: 'Stop sending twenty things. Send one album link.',
    link: 'Album link',
  },
  es: {
    intro: 'Vienen veinte archivos sueltos. Atrápalos todos en un solo álbum.',
    avoid: 'Esquiva el spam y los chats con 20 adjuntos.',
    keys: '← → mover · mantén para acelerar',
    pointer: 'o arrastra / apunta',
    start: 'Abrir el álbum',
    counter: (n: number) => `${n}/${TOTAL} en un link`,
    goal: `Meta: ${WIN}`,
    area: 'Zona de juego. Los archivos caen desde arriba. Mueve el álbum con las flechas izquierda y derecha, o arrastrándolo. Evita el spam y los chats enredados.',
    junk: '¡Spam! Se te cayó un archivo.',
    winTitle: '¡Todo en un link!',
    winSub: (n: number) => `${n}/${TOTAL} archivos juntos.`,
    loseTitle: 'Demasiados archivos sueltos',
    loseSub: (n: number) => `${n}/${TOTAL}; necesitabas ${WIN}.`,
    tagline: 'Deja de mandar veinte cosas. Manda un link de álbum.',
    link: 'Link del álbum',
  },
};

// ---------- simulation ----------
interface Item {
  id: number;
  kind: ItemKind;
  junk: boolean;
  land: number; // time it reaches the album line
  tf: number; // fall duration
  lx: number; // landing x (0..1)
  amp: number;
  phase: number;
  state: 'fall' | 'caught' | 'missed' | 'hit';
  at: number; // resolve time
  rx: number; // x at resolve
}
interface Fx {
  id: number;
  kind: 'plus' | 'minus';
  x: number;
  t: number;
}
interface Game {
  time: number;
  album: number; // album centre, 0..1
  target: number | null;
  left: boolean;
  right: boolean;
  held: number;
  caught: number;
  junkHit: number;
  queue: Item[];
  items: Item[];
  fx: Fx[];
  end: number;
  ids: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const xAt = (it: Item, t: number) => clamp(it.lx + it.amp * (Math.sin(it.phase + 1.7 * (t - it.land)) - Math.sin(it.phase)), 0.04, 0.96);

function newGame(rm: boolean): Game {
  const k = rm ? 1.15 : 1;
  const items: Item[] = [];
  let ids = 1;
  let land = 3.6;
  let prevX = 0.5;
  const lands: number[] = [];
  const xs: number[] = [];
  for (let i = 0; i < TOTAL; i++) {
    if (i > 0) land += (PAIRS.has(i) ? 0.55 : 1.45) * k;
    const maxJump = PAIRS.has(i) ? 0.4 : 0.7;
    let x = prevX;
    for (let tries = 0; tries < 20; tries++) {
      x = rand(0.1, 0.9);
      const d = Math.abs(x - prevX);
      if (d <= maxJump && d >= (PAIRS.has(i) ? 0.24 : 0.18)) break;
    }
    prevX = x;
    lands.push(land);
    xs.push(x);
    const p = i / (TOTAL - 1);
    items.push({
      id: ids++,
      kind: FILE_KINDS[(i + Math.floor(rand(0, 4))) % 4],
      junk: false,
      land,
      tf: lerp(3.2, 2.4, p) * (rm ? 1.35 : 1),
      lx: x,
      amp: lerp(0.015, 0.06, p),
      phase: rand(0, Math.PI * 2),
      state: 'fall',
      at: 0,
      rx: x,
    });
  }
  // Distractions land between two files, in the way of the obvious straight path when possible.
  JUNK_AFTER.forEach((i, n) => {
    const a = xs[i];
    const b = xs[i + 1];
    let x = (a + b) / 2;
    if (Math.abs(a - b) < 0.46) {
      for (let tries = 0; tries < 30; tries++) {
        x = rand(0.1, 0.9);
        if (Math.abs(x - a) >= 0.24 && Math.abs(x - b) >= 0.24) break;
      }
    }
    const l = (lands[i] + lands[i + 1]) / 2;
    items.push({
      id: ids++,
      kind: (n % 2 ? 'chat' : 'spam') as JunkKind,
      junk: true,
      land: l,
      tf: lerp(3.1, 2.4, i / TOTAL) * (rm ? 1.35 : 1),
      lx: x,
      amp: 0.012,
      phase: rand(0, Math.PI * 2),
      state: 'fall',
      at: 0,
      rx: x,
    });
  });
  items.sort((p, q) => p.land - p.tf - (q.land - q.tf));
  return {
    time: 0,
    album: 0.5,
    target: null,
    left: false,
    right: false,
    held: 0,
    caught: 0,
    junkHit: 0,
    queue: items,
    items: [],
    fx: [],
    end: land + 0.6,
    ids,
  };
}

interface ViewItem {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  rot: number;
  scale: number;
  opacity: number;
  back: boolean;
}
interface Snap {
  time: number;
  album: number;
  caught: number;
  junkHit: number;
  items: ViewItem[];
  fx: Fx[];
  end: number;
}

/** Layout derived from the play area's size. */
function layout(w: number, h: number) {
  const albW = clamp(w * 0.21, 100, 136);
  const albH = albW * 0.47;
  const s = w < 480 ? 42 : 50;
  const albTop = h - 12 - albH;
  return { albW, albH, s, albTop, catchY: albTop + albH * 0.22 };
}

// ---------- sound ----------
type Sfx = 'catch' | 'junk' | 'miss' | 'win' | 'lose' | 'start';
function useSfx(soundOn: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    },
    [],
  );
  return useCallback(
    (kind: Sfx, n = 0) => {
      if (!soundOn) return;
      try {
        if (!ctxRef.current) {
          const Ctx =
            window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctxRef.current = new Ctx();
        }
        const ctx = ctxRef.current;
        const note = (type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) => {
          const t0 = ctx.currentTime + delay;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = type;
          o.frequency.setValueAtTime(f0, t0);
          o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
          g.gain.setValueAtTime(vol, t0);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          o.connect(g).connect(ctx.destination);
          o.start(t0);
          o.stop(t0 + dur + 0.02);
        };
        if (kind === 'catch') {
          const f = 520 * Math.pow(2, Math.min(n, 20) / 24);
          note('triangle', f, f * 1.5, 0.09, 0.06);
        } else if (kind === 'junk') note('sawtooth', 190, 90, 0.25, 0.05);
        else if (kind === 'miss') note('sine', 300, 200, 0.12, 0.035);
        else if (kind === 'start') note('triangle', 440, 660, 0.1, 0.04);
        else if (kind === 'win') {
          note('triangle', 660, 660, 0.12, 0.07);
          note('triangle', 880, 880, 0.12, 0.07, 0.11);
          note('triangle', 1320, 1320, 0.26, 0.07, 0.22);
        } else note('triangle', 330, 150, 0.4, 0.07);
      } catch {
        // no audio available
      }
    },
    [soundOn],
  );
}

const CSS = `
@keyframes ol-up { from { transform: translate(-50%, 0); opacity: 1 } to { transform: translate(-50%, -34px); opacity: 0 } }
@keyframes ol-fade { from { opacity: 1 } to { opacity: 0 } }
@keyframes ol-bump { 0% { transform: translateY(0) } 35% { transform: translateY(4px) scaleX(1.04) } 100% { transform: translateY(0) } }
@keyframes ol-wobble { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-4deg) } 75% { transform: rotate(4deg) } }
@keyframes ol-fold { from { transform: rotateY(0deg) } to { transform: rotateY(-180deg) } }
@keyframes ol-shrink { from { transform: scale(1); opacity: 1 } to { transform: scale(0.55); opacity: 0 } }
@keyframes ol-chip { from { transform: scale(0.6); opacity: 0 } 70% { transform: scale(1.05); opacity: 1 } to { transform: scale(1); opacity: 1 } }
@keyframes ol-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes ol-in-rm { from { opacity: 0 } to { opacity: 1 } }
@keyframes ol-shine { from { transform: translateX(-120%) skewX(-20deg) } 80% { opacity: 1 } to { transform: translateX(480%) skewX(-20deg); opacity: 0 } }
.ol-bump { animation: ol-bump 0.28s ease-out; }
.ol-wobble { animation: ol-wobble 0.35s ease-in-out; }
`;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-2';

export default function OneLink({ lang, reducedMotion, soundOn, onFinish }: MiniGameProps) {
  const t = T[lang];
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro');
  const [snap, setSnap] = useState<Snap>({ time: 0, album: 0.5, caught: 0, junkHit: 0, items: [], fx: [], end: 30 });
  const [result, setResult] = useState<{ won: boolean; score: number; caught: number } | null>(null);
  const [endStage, setEndStage] = useState(0);
  const [announce, setAnnounce] = useState('');
  const [size, setSize] = useState({ w: 600, h: 420 });
  const game = useRef<Game>(newGame(reducedMotion));
  const sizeRef = useRef({ w: 600, h: 420 });
  const startBtn = useRef<HTMLButtonElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  const sfx = useSfx(soundOn);
  const sfxRef = useRef(sfx);
  const finishRef = useRef(onFinish);
  const langRef = useRef(lang);
  useEffect(() => {
    sfxRef.current = sfx;
    finishRef.current = onFinish;
    langRef.current = lang;
    phaseRef.current = phase;
  }, [sfx, onFinish, lang, phase]);

  // Initial focus, plus a late re-check: the host dialog may grab focus for its Skip button.
  useEffect(() => {
    const raf = requestAnimationFrame(() => startBtn.current?.focus({ preventScroll: true }));
    const id = window.setTimeout(() => {
      const a = document.activeElement;
      if (a === document.body || a?.matches?.('[data-testid="skip-minigame"]')) {
        (phaseRef.current === 'play' ? area.current : startBtn.current)?.focus({ preventScroll: true });
      }
    }, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
  }, []);

  // Track the play area's size (the album and files are laid out in px from it).
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const s = { w: el.clientWidth, h: el.clientHeight };
      sizeRef.current = s;
      setSize(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Main loop.
  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    let last = performance.now();
    const g = game.current;
    const rm = reducedMotion;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      g.time += dt;
      const { w, h } = sizeRef.current;
      const L = layout(w, h);
      const half = L.albW / 2 / Math.max(1, w);

      // Album movement: keys (accelerating while held) take priority over the pointer target.
      const dir = (g.right ? 1 : 0) - (g.left ? 1 : 0);
      if (dir !== 0) {
        g.held += dt;
        const speed = lerp(0.55, 1.45, clamp(g.held / 0.5, 0, 1)) * Math.min(1.25, 560 / Math.max(300, w));
        g.album += dir * speed * dt;
        g.target = null;
      } else {
        g.held = 0;
        if (g.target !== null) {
          const diff = g.target - g.album;
          const step = 1.7 * dt;
          g.album += clamp(diff, -step, step);
        }
      }
      g.album = clamp(g.album, half, 1 - half);

      // Spawn.
      while (g.queue.length && g.queue[0].land - g.queue[0].tf <= g.time) g.items.push(g.queue.shift()!);

      // Resolve at the album line.
      for (const it of g.items) {
        if (it.state !== 'fall' || g.time < it.land) continue;
        const x = xAt(it, it.land);
        it.rx = x;
        it.at = g.time;
        const inside = Math.abs(x - g.album) * w <= L.albW / 2 + L.s * 0.3;
        if (!inside) {
          it.state = 'missed';
          if (!it.junk) sfxRef.current('miss');
          continue;
        }
        if (it.junk) {
          it.state = 'hit';
          g.junkHit++;
          const lost = g.caught > 0;
          g.caught = Math.max(0, g.caught - 1);
          if (lost) g.fx.push({ id: g.ids++, kind: 'minus', x: g.album, t: g.time });
          sfxRef.current('junk');
          setAnnounce(`${T[langRef.current].junk} ${T[langRef.current].counter(g.caught)}`);
        } else {
          it.state = 'caught';
          g.caught++;
          g.fx.push({ id: g.ids++, kind: 'plus', x: g.album, t: g.time });
          sfxRef.current('catch', g.caught);
          if (g.caught % 5 === 0 || g.caught === WIN) setAnnounce(T[langRef.current].counter(g.caught));
        }
      }
      const fallPx = (it: Item) => (L.catchY + L.s) / it.tf;
      g.items = g.items.filter((it) => {
        if (it.state === 'caught' || it.state === 'hit') return g.time - it.at < 0.35;
        if (it.state === 'missed') return L.catchY + (g.time - it.land) * fallPx(it) < h + L.s;
        return true;
      });
      g.fx = g.fx.filter((f) => g.time - f.t < 0.7);

      // View.
      const view: ViewItem[] = g.items.map((it) => {
        if (it.state === 'caught' || it.state === 'hit') {
          const a = clamp((g.time - it.at) / 0.3, 0, 1);
          const x = lerp(it.rx, g.album, a) * w;
          const y = it.state === 'caught' ? lerp(L.catchY, L.albTop + L.albH * 0.45, a) : L.catchY - a * 18;
          return { id: it.id, kind: it.kind, x, y, rot: 0, scale: lerp(1, 0.35, a), opacity: 1 - a, back: it.state === 'caught' };
        }
        const x = xAt(it, g.time) * w;
        const y = L.catchY - (it.land - g.time) * fallPx(it);
        const rot = rm ? 0 : 14 * Math.sin(it.phase * 3 + g.time * 1.9);
        const below = it.state === 'missed' ? clamp((y - L.catchY) / (h - L.catchY + 1), 0, 1) : 0;
        return { id: it.id, kind: it.kind, x, y, rot, scale: 1, opacity: it.state === 'missed' ? 0.55 * (1 - below) : 1, back: it.state === 'missed' };
      });

      if (g.time >= g.end && !g.queue.length && !g.items.some((i) => i.state === 'fall')) {
        const won = g.caught >= WIN;
        const score = Math.round(clamp(g.caught * 5 - g.junkHit * 3 + (won ? 5 : 0), 0, 100));
        const r = { won, score: won ? Math.max(score, 55) : Math.min(score, 49), caught: g.caught };
        setSnap({ time: g.time, album: g.album, caught: g.caught, junkHit: g.junkHit, items: [], fx: [], end: g.end });
        setResult(r);
        setPhase('end');
        sfxRef.current(won ? 'win' : 'lose');
        const tt = T[langRef.current];
        setAnnounce(won ? `${tt.winTitle} ${tt.winSub(r.caught)} ${tt.tagline}` : `${tt.loseTitle}. ${tt.loseSub(r.caught)}`);
        return;
      }
      setSnap({ time: g.time, album: g.album, caught: g.caught, junkHit: g.junkHit, items: view, fx: g.fx.slice(), end: g.end });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reducedMotion]);

  // Keyboard: ←/→ (and A/D) while playing, wherever focus sits inside the dialog.
  useEffect(() => {
    if (phase !== 'play') return;
    const g = game.current;
    const set = (e: KeyboardEvent, down: boolean) => {
      const k = e.key;
      const isL = k === 'ArrowLeft' || k === 'a' || k === 'A';
      const isR = k === 'ArrowRight' || k === 'd' || k === 'D';
      if (!isL && !isR) return;
      e.preventDefault();
      if (down && !e.repeat) g.held = 0;
      if (isL) g.left = down;
      else g.right = down;
    };
    const kd = (e: KeyboardEvent) => set(e, true);
    const ku = (e: KeyboardEvent) => set(e, false);
    const blur = () => {
      g.left = false;
      g.right = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'play') area.current?.focus({ preventScroll: true });
  }, [phase]);

  // End: album closes, becomes a link chip; report once.
  useEffect(() => {
    if (phase !== 'end' || !result) return;
    const a = window.setTimeout(() => setEndStage(1), reducedMotion ? 450 : 800);
    const b = window.setTimeout(
      () => finishRef.current({ won: result.won, score: result.score }),
      (reducedMotion ? 450 : 800) + 2300,
    );
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [phase, result, reducedMotion]);

  const start = () => {
    game.current = newGame(reducedMotion);
    setSnap({ time: 0, album: 0.5, caught: 0, junkHit: 0, items: [], fx: [], end: 30 });
    setPhase('play');
    sfx('start');
  };

  const pointTo = (e: RPointerEvent<HTMLDivElement>) => {
    const el = area.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    game.current.target = clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1);
  };
  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest?.('button')) return;
    e.preventDefault(); // keep focus from jumping to the dialog panel
    area.current?.focus({ preventScroll: true });
    if (phase !== 'play') return;
    try {
      area.current?.setPointerCapture(e.pointerId);
    } catch {
      // capture not available
    }
    pointTo(e);
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (phase !== 'play') return;
    if (e.pointerType === 'mouse' || e.buttons > 0) pointTo(e);
  };

  const L = layout(size.w, size.h);
  const albX = snap.album * size.w;
  const lastFx = snap.fx[snap.fx.length - 1];
  const lastMinus = snap.fx.some((f) => f.kind === 'minus');
  const showKeys = phase === 'play' && snap.time < 5;
  const progress = clamp(snap.time / snap.end, 0, 1);
  const won = result?.won ?? false;

  return (
    <div className="flex h-full min-h-[400px] select-none flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <style>{CSS}</style>

      {/* HUD */}
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <span
          className="rounded-full px-3 py-1 font-mono text-xs font-bold tabular-nums text-white shadow-sm sm:text-sm"
          style={{ background: snap.caught >= WIN ? '#0f766e' : TEAL }}
        >
          {t.counter(snap.caught)}
        </span>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t.goal}</span>
        <div className="ml-auto h-2 w-20 overflow-hidden rounded-full bg-gray-100 sm:w-32" aria-hidden>
          <div className="h-full rounded-full" style={{ width: `${(1 - progress) * 100}%`, background: TEAL }} />
        </div>
      </div>

      {/* Play area */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-teal-100 shadow-md">
        <div
          ref={area}
          tabIndex={phase === 'play' ? 0 : -1}
          role="application"
          aria-label={t.area}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-0 cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d9488]"
          style={{ background: 'linear-gradient(180deg,#f0fdfa 0%,#ffffff 70%,#f0fdfa 100%)' }}
        >
          {/* faint low-poly backdrop */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <polygon points="0,100 0,72 22,86 40,100" fill="#ccfbf1" opacity={0.45} />
            <polygon points="100,100 100,64 78,84 58,100" fill="#ccfbf1" opacity={0.45} />
            <polygon points="0,0 18,0 0,14" fill="#ccfbf1" opacity={0.35} />
            <polygon points="100,0 84,0 100,20" fill="#ccfbf1" opacity={0.35} />
          </svg>

          {/* Items behind the album (caught ones sliding in, missed ones falling away) */}
          {snap.items
            .filter((v) => v.back)
            .map((v) => (
              <ItemView key={v.id} v={v} size={L.s} />
            ))}

          {/* Album */}
          {phase !== 'end' && (
            <div
              className="absolute"
              data-ol="album"
              style={{ left: albX - L.albW / 2, top: L.albTop, width: L.albW, height: L.albH }}
              aria-hidden
            >
              <div
                key={reducedMotion ? 'a' : `${snap.caught}-${snap.junkHit}`}
                className={reducedMotion ? '' : lastMinus ? 'ol-wobble' : lastFx ? 'ol-bump' : ''}
                style={{ transformOrigin: '50% 100%' }}
              >
                <AlbumArt width={L.albW} filled={snap.caught} />
              </div>
            </div>
          )}

          {/* Falling items in front */}
          {snap.items
            .filter((v) => !v.back)
            .map((v) => (
              <ItemView key={v.id} v={v} size={L.s} />
            ))}

          {/* +1 / −1 */}
          {snap.fx.map((f) => (
            <span
              key={f.id}
              className={`pointer-events-none absolute font-mono text-sm font-bold ${f.kind === 'plus' ? 'text-teal-700' : 'text-rose-600'}`}
              style={{
                left: f.x * size.w,
                top: L.albTop - 26,
                transform: 'translate(-50%,0)',
                animation: reducedMotion ? 'ol-fade 0.7s ease-out forwards' : 'ol-up 0.7s ease-out forwards',
              }}
              aria-hidden
            >
              {f.kind === 'plus' ? '+1' : '−1'}
            </span>
          ))}

          {showKeys && (
            <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-teal-200 bg-white/90 px-3 py-1 text-xs text-gray-700 shadow-sm">
              <span className="font-mono font-semibold text-teal-800">{t.keys}</span>
              <span className="hidden text-gray-500 sm:inline">{t.pointer}</span>
            </div>
          )}
        </div>

        {phase === 'intro' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 p-4 backdrop-blur-[2px]">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <div className="flex items-end gap-1.5" aria-hidden>
                {(['photo', 'video', 'pano', 'pdf'] as const).map((k, i) => (
                  <span key={k} style={{ transform: `translateY(${i % 2 ? -6 : 0}px) rotate(${(i - 1.5) * 8}deg)` }}>
                    <ItemIcon kind={k} size={38} />
                  </span>
                ))}
              </div>
              <p className="text-base font-semibold text-gray-900">{t.intro}</p>
              <p className="flex items-center gap-1.5 text-sm text-gray-600">
                <span className="inline-flex shrink-0" aria-hidden>
                  <ItemIcon kind="spam" size={24} />
                  <ItemIcon kind="chat" size={24} />
                </span>
                {t.avoid}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-700">
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono">{t.keys}</span>
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1">{t.pointer}</span>
              </div>
              <button
                ref={startBtn}
                type="button"
                data-autofocus
                onClick={start}
                className={`mt-1 min-h-12 min-w-44 rounded-xl bg-[#0d9488] px-6 text-base font-semibold text-white transition-transform duration-150 hover:bg-[#0f766e] active:scale-95 ${FOCUS_RING}`}
              >
                {t.start}
              </button>
            </div>
          </div>
        )}

        {phase === 'end' && result && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-4 backdrop-blur-[2px]">
            <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
              {endStage === 0 ? (
                <ClosingAlbum width={Math.min(200, size.w * 0.5)} filled={result.caught} rm={reducedMotion} />
              ) : (
                <div
                  className="relative flex max-w-full items-center gap-2.5 overflow-hidden rounded-full border-2 bg-white py-2 pl-2 pr-5 shadow-md"
                  style={{
                    borderColor: won ? TEAL : '#d1d5db',
                    animation: reducedMotion ? 'ol-in-rm 0.4s ease-out both' : 'ol-chip 0.5s ease-out both',
                  }}
                  role="img"
                  aria-label={`${t.link}: myalbumlink.com`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: won ? TEAL : '#9ca3af' }}
                  >
                    <LinkGlyph />
                  </span>
                  <span className="truncate font-mono text-base font-semibold text-gray-900 sm:text-lg">
                    myalbumlink.com/<span className="text-teal-600">…</span>
                  </span>
                  {won && !reducedMotion && (
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/90 to-transparent"
                      style={{ animation: 'ol-shine 0.9s ease-out 0.45s both' }}
                      aria-hidden
                    />
                  )}
                </div>
              )}
              <div
                className="flex flex-col items-center gap-1"
                style={{ animation: `${reducedMotion ? 'ol-in-rm' : 'ol-in'} 0.4s ease-out both` }}
              >
                <p className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${won ? 'text-teal-700' : 'text-rose-600'}`}>
                  {won ? t.winTitle : t.loseTitle}
                </p>
                <p className="text-sm text-gray-700">{won ? t.winSub(result.caught) : t.loseSub(result.caught)}</p>
              </div>
              {endStage === 1 && (
                <p
                  className="max-w-xs text-lg font-bold leading-snug tracking-tight text-teal-900"
                  style={{ animation: `${reducedMotion ? 'ol-in-rm' : 'ol-in'} 0.5s ease-out 0.25s both` }}
                >
                  {t.tagline}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

function ItemView({ v, size }: { v: ViewItem; size: number }) {
  return (
    <div
      data-ol={v.back ? 'gone' : v.kind === 'spam' || v.kind === 'chat' ? 'junk' : 'file'}
      className={`pointer-events-none absolute ${v.kind === 'spam' || v.kind === 'chat' ? 'drop-shadow-[0_2px_3px_rgba(225,29,72,0.25)]' : 'drop-shadow-[0_2px_3px_rgba(15,118,110,0.22)]'}`}
      style={{
        left: v.x,
        top: v.y,
        opacity: v.opacity,
        transform: `translate(-50%,-50%) rotate(${v.rot}deg) scale(${v.scale})`,
      }}
      aria-hidden
    >
      <ItemIcon kind={v.kind} size={size} />
    </div>
  );
}

/** The album folding shut: the right page swings over the spine, then the book shrinks away. */
function ClosingAlbum({ width, filled, rm }: { width: number; filled: number; rm: boolean }) {
  const h = width * 0.47;
  return (
    <div
      className="relative"
      style={{ width, height: h, perspective: 600, animation: rm ? undefined : 'ol-shrink 0.3s ease-in 0.55s both' }}
      aria-hidden
    >
      <div className="absolute inset-0">
        <AlbumArt width={width} filled={filled} />
      </div>
      {!rm && (
        <div
          className="absolute top-0 h-full"
          style={{
            left: '50%',
            width: '50%',
            transformOrigin: '0% 50%',
            transformStyle: 'preserve-3d',
            animation: 'ol-fold 0.5s ease-in-out 0.05s both',
          }}
        >
          <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
            <div style={{ marginLeft: -width / 2 }}>
              <AlbumArt width={width} filled={filled} />
            </div>
          </div>
          <div
            className="absolute inset-y-[18%] left-0 right-[3%] rounded-r-md"
            style={{ background: '#0f766e', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

// "Find it in 360" (360° content): six little gems are hidden as Pannellum hot spots in one of
// the 360° photos. Look around (drag, or arrow keys with the viewer focused) and tap a gem, or
// centre it in the reticle and press Enter/Space. 55 s from the moment the photo is ready; win = all 6.
// A radar ring points roughly at the nearest remaining gem; after 10 s without a find it gets precise.
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Pannellum360Viewer, {
  type PannellumHotSpot,
  type PannellumViewer,
} from "@/components/Pannellum360Viewer";
import photosData from "@/content/photos360.json";
import type { Photo360 } from "@/lib/types";
import type { MiniGameProps } from "../types";
import {
  describe,
  makeTargets,
  nearest,
  type HDir,
  type Nearest,
  type Target,
  type VDir,
} from "./findit360/geo";

const COLOR = "#7c3aed";
const GEMS = 6;
const SECONDS = 55;
const PRECISE_AFTER = 10_000;
const GRAB_DEG = 12; // Enter/Space grabs a gem this close to the centre of view
const TAP_PX = 30; // pointer taps within this radius of a gem's centre count
const LOAD_TIMEOUT = 30_000;
// Arrow-key look speed in °/s: Pannellum's own keyboard pan (~13°/s) is far too slow for a
// 40 s hunt round 360°, so the game drives the view itself while an arrow is held.
const KEY_YAW_MIN = 50;
const KEY_YAW_MAX = 120;
const KEY_PITCH = 45;
const ARROWS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
// The lighter photos load fastest; one is picked per round.
const POOL = ["b28cc01a", "d41dfb76", "75dc4a2b", "06fc11b4", "1e314413"];

type Phase = "loading" | "play" | "end" | "failed";

const T = {
  en: {
    loading: "Loading the 360° photo…",
    failTitle: "The 360° photo didn't load",
    failSub:
      "You might be offline. You can end this round and try again later.",
    finish: "End round",
    viewer:
      "360° photo. Drag, or use the arrow keys, to look around. Press Enter to grab a gem in the centre ring. Press H for a hint.",
    intro: `Find ${GEMS} hidden gems. You have ${SECONDS} seconds.`,
    found: (n: number) => `Gem ${n} of ${GEMS} found.`,
    nearest: (d: string) => `Nearest gem: ${d}.`,
    miss: "Nothing in the centre ring.",
    sharpened: "Hint sharpened.",
    tenLeft: "10 seconds left.",
    h: {
      ahead: "straight ahead",
      slightLeft: "a bit to your left",
      slightRight: "a bit to your right",
      left: "to your left",
      right: "to your right",
      behind: "behind you",
    } as Record<HDir, string>,
    v: {
      up: "up",
      bitUp: "a bit up",
      down: "down",
      bitDown: "a bit down",
    } as Record<Exclude<VDir, null>, string>,
    keysPointer: "Drag to look around · tap the gems",
    keysKb: "← ↑ ↓ → look · Enter grab · H hint",
    radar: "Hint: where is the nearest gem?",
    counter: (n: number) => `${n} of ${GEMS} gems found`,
    timer: (s: number) => `${s} seconds left`,
    grab: "Enter",
    win: `${GEMS}/${GEMS} — sharp eyes!`,
    lose: (n: number) => `${n}/${GEMS} — time's up!`,
  },
  es: {
    loading: "Cargando la foto 360°…",
    failTitle: "No se pudo cargar la foto 360°",
    failSub:
      "Tal vez no tienes conexión. Puedes terminar esta ronda e intentarlo más tarde.",
    finish: "Terminar ronda",
    viewer:
      "Foto 360°. Arrastra o usa las flechas para mirar alrededor. Presiona Enter para agarrar una gema dentro del círculo central. Presiona H para una pista.",
    intro: `Encuentra ${GEMS} gemas escondidas. Tienes ${SECONDS} segundos.`,
    found: (n: number) => `Encontraste la gema ${n} de ${GEMS}.`,
    nearest: (d: string) => `La gema más cercana está ${d}.`,
    miss: "No hay nada en el círculo central.",
    sharpened: "La pista ahora es más precisa.",
    tenLeft: "Quedan 10 segundos.",
    h: {
      ahead: "justo enfrente",
      slightLeft: "un poco a tu izquierda",
      slightRight: "un poco a tu derecha",
      left: "a tu izquierda",
      right: "a tu derecha",
      behind: "detrás de ti",
    } as Record<HDir, string>,
    v: {
      up: "arriba",
      bitUp: "un poco arriba",
      down: "abajo",
      bitDown: "un poco abajo",
    } as Record<Exclude<VDir, null>, string>,
    keysPointer: "Arrastra para mirar · toca las gemas",
    keysKb: "← ↑ ↓ → mirar · Enter agarrar · H pista",
    radar: "Pista: ¿dónde está la gema más cercana?",
    counter: (n: number) => `${n} de ${GEMS} gemas encontradas`,
    timer: (s: number) => `Quedan ${s} segundos`,
    grab: "Enter",
    win: `${GEMS}/${GEMS} — ¡qué buen ojo!`,
    lose: (n: number) => `${n}/${GEMS} — ¡se acabó el tiempo!`,
  },
};

// Faceted low-poly gem, drawn in the section colour.
const GEM_SVG = `<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true" focusable="false">
<polygon points="4,12 10,4 16,12" fill="#a78bfa"/><polygon points="10,4 22,4 16,12" fill="#c4b5fd"/>
<polygon points="22,4 28,12 16,12" fill="#8b5cf6"/><polygon points="4,12 16,12 16,30" fill="#7c3aed"/>
<polygon points="16,12 28,12 16,30" fill="#5b21b6"/>
<polygon points="4,12 10,4 22,4 28,12 16,30" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
</svg>`;

const CSS = `
.fi360-gem{width:30px;height:30px;cursor:pointer;}
.fi360-gem .fi360-in{width:100%;height:100%;filter:drop-shadow(0 0 3px rgba(255,255,255,.9)) drop-shadow(0 2px 3px rgba(46,16,101,.55));transition:transform .3s ease,opacity .3s ease;}
.fi360-anim .fi360-gem .fi360-in{animation:fi360-pulse 1.6s ease-in-out infinite;}
.fi360-gem:hover .fi360-in{transform:scale(1.15);}
.fi360-gem.fi360-got .fi360-in{animation:none;transform:scale(1.9) rotate(20deg);opacity:0;transition-duration:.4s;}
.fi360-still .fi360-gem.fi360-got .fi360-in{transform:none;transition-duration:.2s;}
@keyframes fi360-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
.fi360-bump{animation:fi360-bump .35s ease-out;}
@keyframes fi360-bump{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
`;

type Ctx = AudioContext;
function blip(
  ctx: Ctx | null,
  freqs: number[],
  type: OscillatorType = "triangle",
  dur = 0.12,
) {
  if (!ctx) return;
  try {
    freqs.forEach((f, i) => {
      const t0 = ctx.currentTime + i * dur * 0.8;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.07, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    });
  } catch {
    // no audio
  }
}

const proxied = (url: string) =>
  url.includes("cdn.jorgeromeroromanis.com") || url.includes("r2.dev")
    ? `/api/proxy-360?url=${encodeURIComponent(url)}`
    : url;

export default function FindIt360({
  lang,
  reducedMotion,
  soundOn,
  onFinish,
}: MiniGameProps) {
  const t = T[lang];
  const [phase, setPhase] = useState<Phase>("loading");
  const [found, setFound] = useState(0);
  const [secsLeft, setSecsLeft] = useState(SECONDS);
  const [precise, setPrecise] = useState(false);
  const [live, setLive] = useState("");
  const [showKeys, setShowKeys] = useState(true);
  const [focused, setFocused] = useState(false);
  const [bump, setBump] = useState(0);

  // One photo + one target layout per mount ("Try again" remounts).
  const [photo] = useState<Photo360>(() => {
    const all = (photosData as { photos: Photo360[] }).photos;
    const pool = all.filter((p) => POOL.some((id) => p.id.startsWith(id)));
    const src = (pool.length ? pool : all)[
      Math.floor(Math.random() * (pool.length || all.length))
    ];
    return {
      ...src,
      url: proxied(src.url),
      initialYaw: 0,
      initialPitch: 0,
      initialHfov: 95,
    };
  });
  const [targets] = useState<Target[]>(() => makeTargets(0, GEMS));

  const root = useRef<HTMLDivElement>(null);
  const viewer = useRef<PannellumViewer | null>(null);
  const divs = useRef(new Map<string, HTMLDivElement>());
  const got = useRef(new Set<string>());
  const phaseRef = useRef<Phase>("loading");
  const startAt = useRef(0);
  const lastFind = useRef(0);
  const preciseRef = useRef(false);
  const finished = useRef(false);
  const timeouts = useRef<number[]>([]);
  const audio = useRef<Ctx | null>(null);
  const radarCoarse = useRef<SVGGElement>(null);
  const radarFine = useRef<SVGGElement>(null);
  const radarDot = useRef<SVGCircleElement>(null);
  const reticle = useRef<HTMLDivElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const warned = useRef(false);
  const held = useRef(new Set<string>());
  const heldSince = useRef(0);

  const viewerId = `fi360-view-${useId().replace(/:/g, "")}`;
  const later = (fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms));
  };

  const sound = useCallback(
    (kind: "got" | "miss" | "win" | "lose") => {
      if (!soundOn) return;
      try {
        if (!audio.current) {
          const C =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audio.current = new C();
        }
        const c = audio.current;
        if (kind === "got") blip(c, [880, 1320], "triangle", 0.09);
        else if (kind === "miss") blip(c, [196], "sine", 0.14);
        else if (kind === "win") blip(c, [660, 880, 1320], "triangle", 0.14);
        else blip(c, [330, 247], "sine", 0.18);
      } catch {
        // no audio
      }
    },
    [soundOn],
  );

  const remaining = useCallback(
    () => targets.filter((x) => !got.current.has(x.id)),
    [targets],
  );

  const view = useCallback(() => {
    const v = viewer.current;
    if (!v) return { pitch: 0, yaw: 0 };
    return { pitch: v.getPitch(), yaw: v.getYaw() };
  }, []);

  const direction = useCallback(
    (n: Nearest | null) => {
      if (!n) return "";
      const d = describe(n, preciseRef.current);
      return t.nearest(`${t.h[d.h]}${d.v ? `, ${t.v[d.v]}` : ""}`);
    },
    [t],
  );

  const hint = useCallback(() => {
    const { pitch, yaw } = view();
    return direction(nearest(remaining(), pitch, yaw));
  }, [direction, remaining, view]);

  const end = useCallback(
    (won: boolean) => {
      if (phaseRef.current !== "play") return;
      phaseRef.current = "end";
      setPhase("end");
      const n = got.current.size;
      const left = Math.max(
        0,
        SECONDS - (performance.now() - startAt.current) / 1000,
      );
      const score = won ? Math.round(60 + (40 * left) / SECONDS) : Math.round((n / GEMS) * 50);
      setLive(won ? t.win : t.lose(n));
      sound(won ? "win" : "lose");
      later(() => {
        if (finished.current) return;
        finished.current = true;
        onFinish({ won, score: Math.max(0, Math.min(100, score)) });
      }, 1300);
    },
    [onFinish, sound, t],
  );

  const collect = useCallback(
    (id: string) => {
      if (phaseRef.current !== "play" || got.current.has(id)) return;
      got.current.add(id);
      const n = got.current.size;
      setFound(n);
      setBump((b) => b + 1);
      sound("got");
      const div = divs.current.get(id);
      div?.classList.add("fi360-got");
      later(
        () => {
          try {
            viewer.current?.removeHotSpot(id);
          } catch {
            // already gone
          }
        },
        reducedMotion ? 220 : 420,
      );
      lastFind.current = performance.now();
      preciseRef.current = false;
      setPrecise(false);
      if (n >= GEMS) {
        end(true);
        return;
      }
      setLive(`${t.found(n)} ${hint()}`);
    },
    [end, hint, reducedMotion, sound, t],
  );

  // Hot spots: a custom gem element per target (created once; Pannellum reads them at init).
  const hotSpots = useMemo<PannellumHotSpot[]>(
    () =>
      targets.map((x) => ({
        id: x.id,
        pitch: x.pitch,
        yaw: x.yaw,
        cssClass: "fi360-gem",
        createTooltipFunc: (div: HTMLDivElement) => {
          div.innerHTML = `<div class="fi360-in">${GEM_SVG}</div>`;
          div.setAttribute("aria-hidden", "true");
          divs.current.set(x.id, div);
        },
      })),
    [targets],
  );

  const onReady = useCallback(
    (v: PannellumViewer) => {
      if (phaseRef.current !== "loading") return;
      viewer.current = v;
      phaseRef.current = "play";
      setPhase("play");
      startAt.current = performance.now();
      lastFind.current = startAt.current;
      setLive(
        `${t.intro} ${direction(nearest(targets, v.getPitch(), v.getYaw()))}`,
      );
      later(() => setShowKeys(false), 7000);
    },
    [direction, t, targets],
  );

  const onError = useCallback(() => {
    if (phaseRef.current !== "loading") return;
    phaseRef.current = "failed";
    setPhase("failed");
  }, []);

  // Don't dead-end if nothing happens (script blocked, very slow network).
  useEffect(() => {
    const id = window.setTimeout(onError, LOAD_TIMEOUT);
    return () => window.clearTimeout(id);
  }, [onError]);

  // Focus: the viewer is the main control. The host dialog may grab focus for its Skip button
  // right after we mount, so re-check once a little later.
  useEffect(() => {
    const el = () => document.getElementById(viewerId);
    const stolen = () => {
      const a = document.activeElement as HTMLElement | null;
      return (
        !a ||
        a === document.body ||
        a.getAttribute("data-testid") === "skip-minigame" ||
        (root.current ? a.contains(root.current) : false)
      );
    };
    const raf = requestAnimationFrame(() =>
      el()?.focus({ preventScroll: true }),
    );
    const id = window.setTimeout(() => {
      if (stolen()) el()?.focus({ preventScroll: true });
    }, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
  }, [viewerId]);

  // Game loop: timer, radar, reticle, hint sharpening.
  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    let lastSecs = SECONDS;
    let prev = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      const v = viewer.current;
      if (v && held.current.size) {
        const k = held.current;
        const dx = (k.has("ArrowRight") ? 1 : 0) - (k.has("ArrowLeft") ? 1 : 0);
        const dy = (k.has("ArrowUp") ? 1 : 0) - (k.has("ArrowDown") ? 1 : 0);
        const speed = Math.min(
          KEY_YAW_MAX,
          KEY_YAW_MIN + ((now - heldSince.current) / 1000) * 110,
        );
        if (dx || dy) {
          const p = Math.max(
            -70,
            Math.min(70, v.getPitch() + dy * KEY_PITCH * dt),
          );
          v.lookAt(p, v.getYaw() + dx * speed * dt, v.getHfov(), false);
        }
      }
      const left = SECONDS - (now - startAt.current) / 1000;
      const secs = Math.max(0, Math.ceil(left));
      if (secs !== lastSecs) {
        lastSecs = secs;
        setSecsLeft(secs);
        if (secs === 10 && !warned.current) {
          warned.current = true;
          setLive(t.tenLeft);
        }
      }
      if (left <= 0) {
        end(false);
        return;
      }
      if (!preciseRef.current && now - lastFind.current > PRECISE_AFTER) {
        preciseRef.current = true;
        setPrecise(true);
        setLive(`${t.sharpened} ${hint()}`);
      }
      const { pitch, yaw } = view();
      const n = nearest(remaining(), pitch, yaw);
      if (n) {
        const bearing = (Math.atan2(n.dYaw, n.dPitch) * 180) / Math.PI;
        const coarse = Math.round(bearing / 45) * 45;
        radarCoarse.current?.setAttribute(
          "transform",
          `rotate(${coarse} 32 32)`,
        );
        radarFine.current?.setAttribute(
          "transform",
          `rotate(${bearing.toFixed(1)} 32 32)`,
        );
        radarDot.current?.setAttribute(
          "cy",
          (32 - (9 + (Math.min(n.dist, 90) / 90) * 17)).toFixed(1),
        );
        reticle.current?.setAttribute(
          "data-armed",
          n.dist <= GRAB_DEG ? "true" : "false",
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, hint, phase, remaining, t, view]);

  // Cleanup timers + audio on unmount.
  useEffect(() => {
    const list = timeouts.current;
    return () => {
      list.forEach((id) => window.clearTimeout(id));
      void audio.current?.close().catch(() => {});
    };
  }, []);

  // Arrow keys: intercepted in the capture phase so Pannellum's slow built-in pan never sees them.
  const onArrowDown = (e: React.KeyboardEvent) => {
    if (!ARROWS.includes(e.key) || (e.target as HTMLElement).id !== viewerId)
      return;
    e.preventDefault();
    e.stopPropagation();
    if (phaseRef.current !== "play") return;
    if (!held.current.size) heldSince.current = performance.now();
    held.current.add(e.key);
  };
  const onArrowUp = (e: React.KeyboardEvent) => {
    if (!ARROWS.includes(e.key)) return;
    e.stopPropagation();
    held.current.delete(e.key);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (phaseRef.current !== "play") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const { pitch, yaw } = view();
      const n = nearest(remaining(), pitch, yaw);
      if (n && n.dist <= GRAB_DEG) collect(n.target.id);
      else {
        sound("miss");
        setLive(`${t.miss} ${hint()}`);
      }
    } else if (e.key === "h" || e.key === "H") {
      e.preventDefault();
      setLive(hint());
    }
  };

  // Taps / clicks: generous radius around each visible gem; drags don't count.
  const onPointerDown = (e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = down.current;
    down.current = null;
    if (!d || phaseRef.current !== "play") return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return;
    let best: { id: string; dist: number } | null = null;
    for (const x of remaining()) {
      const div = divs.current.get(x.id);
      if (!div || div.style.visibility === "hidden") continue;
      const r = div.getBoundingClientRect();
      const dist = Math.hypot(
        e.clientX - (r.left + r.width / 2),
        e.clientY - (r.top + r.height / 2),
      );
      if (
        dist <= Math.max(TAP_PX, r.width * 0.9) &&
        (!best || dist < best.dist)
      )
        best = { id: x.id, dist };
    }
    if (best) collect(best.id);
  };

  const low = secsLeft <= 10;

  return (
    <div
      ref={root}
      className={`relative h-full min-h-[340px] w-full select-none overflow-hidden bg-gray-50 ${
        reducedMotion ? "fi360-still" : "fi360-anim"
      }`}
      style={{ touchAction: "none" }}
      onPointerDownCapture={onPointerDown}
      onPointerUpCapture={onPointerUp}
      // Keep mouse clicks on the HUD from moving focus to the dialog panel (the viewer focuses itself).
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest(".pnlm-container"))
          e.preventDefault();
      }}
      onKeyDownCapture={onArrowDown}
      onKeyUpCapture={onArrowUp}
      onFocus={(e) => setFocused((e.target as HTMLElement).id === viewerId)}
      onBlur={() => {
        setFocused(false);
        held.current.clear();
      }}
    >
      <style>{CSS}</style>

      <div className="absolute inset-0">
        <Pannellum360Viewer
          photo={photo}
          className="h-full w-full"
          hotSpots={hotSpots}
          autoRotate={false}
          showInstructions={false}
          showControls={false}
          showStatus={false}
          onReady={onReady}
          onError={onError}
          viewerProps={{
            id: viewerId,
            tabIndex: 0,
            role: "application",
            "aria-label": t.viewer,
            "aria-roledescription": "360°",
            "data-autofocus": "",
            onKeyDown,
          }}
        />
      </div>

      {/* Focus ring for the viewer (Pannellum removes the outline) */}
      {focused && (
        <div
          className="pointer-events-none absolute inset-0 z-20 ring-4 ring-inset"
          style={{ ["--tw-ring-color" as string]: COLOR }}
          aria-hidden
        />
      )}

      {phase === "play" || phase === "end" ? (
        <>
          {/* Reticle */}
          {phase === "play" && (
            <div
              ref={reticle}
              data-armed="false"
              aria-hidden
              className="group pointer-events-none absolute left-1/2 top-1/2 z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="absolute inset-0 rounded-full border-2 border-white/90 shadow-[0_0_0_1.5px_rgba(17,24,39,0.45)] transition-colors duration-200 group-data-[armed=true]:border-[#7c3aed] group-data-[armed=true]:bg-[#7c3aed]/15" />
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(17,24,39,0.45)]" />
              <span className="absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 rounded bg-[#7c3aed] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white group-data-[armed=true]:block">
                {t.grab}
              </span>
            </div>
          )}

          {/* Counter */}
          <div
            className={`absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-md ${bump && !reducedMotion ? "fi360-bump" : ""}`}
            key={`c${bump}`}
            role="img"
            aria-label={t.counter(found)}
          >
            {Array.from({ length: GEMS }, (_, i) => (
              <svg key={i} viewBox="0 0 32 32" className="h-4 w-4" aria-hidden>
                <polygon
                  points="4,12 10,4 22,4 28,12 16,30"
                  fill={i < found ? COLOR : "none"}
                  stroke={i < found ? COLOR : "#9ca3af"}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
            <span className="ml-0.5 font-mono text-sm font-bold text-gray-900">
              {found}/{GEMS}
            </span>
          </div>

          {/* Timer */}
          <div
            className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1.5 font-mono text-sm font-bold shadow-md ${
              low ? "bg-rose-600 text-white" : "bg-white/95 text-gray-900"
            }`}
            role="timer"
            aria-label={t.timer(secsLeft)}
          >
            0:{String(secsLeft).padStart(2, "0")}
          </div>

          {/* Radar */}
          <button
            type="button"
            onClick={() => setLive(hint())}
            aria-label={t.radar}
            title={t.radar}
            className="absolute bottom-3 right-3 z-10 h-[72px] w-[72px] rounded-full bg-white/95 p-1 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="#f5f3ff"
                stroke="#ddd6fe"
                strokeWidth="2"
              />
              <circle
                cx="32"
                cy="32"
                r="14"
                fill="none"
                stroke="#ede9fe"
                strokeWidth="1.5"
              />
              {/* you: the view cone points up */}
              <path
                d="M32 32 L25 14 A19 19 0 0 1 39 14 Z"
                fill="#7c3aed"
                opacity="0.12"
              />
              {precise ? (
                <g
                  ref={radarFine}
                  className={reducedMotion ? "" : "transition-transform"}
                >
                  <line
                    x1="32"
                    y1="32"
                    x2="32"
                    y2="8"
                    stroke={COLOR}
                    strokeWidth="2.5"
                    strokeDasharray="3 2.5"
                  />
                  <circle
                    ref={radarDot}
                    cx="32"
                    cy="10"
                    r="5"
                    fill={COLOR}
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                </g>
              ) : (
                <g ref={radarCoarse}>
                  <path
                    d="M17.7 7.2 A28.5 28.5 0 0 1 46.3 7.2"
                    fill="none"
                    stroke={COLOR}
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </g>
              )}
              <circle cx="32" cy="32" r="3.5" fill="#111827" />
            </svg>
          </button>

          {/* Keys, shown briefly */}
          {showKeys && phase === "play" && (
            <div className="pointer-events-none absolute bottom-3 left-3 right-[92px] z-10 flex flex-col items-start gap-1 text-xs font-medium sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:items-center">
              <span className="rounded-full bg-gray-900/80 px-3 py-1 text-white">
                {t.keysPointer}
              </span>
              <span className="hidden rounded-full bg-gray-900/80 px-3 py-1 font-mono text-[11px] text-white [@media(hover:hover)]:inline-block">
                {t.keysKb}
              </span>
            </div>
          )}
        </>
      ) : null}

      {phase === "loading" && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-gray-50"
          role="status"
        >
          <svg
            viewBox="0 0 32 32"
            className={`h-10 w-10 ${reducedMotion ? "" : "animate-spin [animation-duration:1.6s]"}`}
            aria-hidden
          >
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="#ede9fe"
              strokeWidth="4"
            />
            <path
              d="M16 4 A12 12 0 0 1 28 16"
              fill="none"
              stroke={COLOR}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm font-medium text-gray-600">{t.loading}</p>
        </div>
      )}

      {phase === "failed" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
          <p className="text-base font-bold text-gray-900">{t.failTitle}</p>
          <p className="max-w-xs text-sm text-gray-600">{t.failSub}</p>
          <button
            type="button"
            data-autofocus=""
            ref={(b) => b?.focus({ preventScroll: true })}
            onClick={() => {
              if (finished.current) return;
              finished.current = true;
              onFinish({ won: false, score: 0 });
            }}
            className="mt-1 min-h-11 rounded-xl bg-[#7c3aed] px-5 text-sm font-semibold text-white hover:bg-[#6d28d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
          >
            {t.finish}
          </button>
        </div>
      )}

      {phase === "end" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/40">
          <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-xl">
            <p
              className="text-xl font-bold tracking-tight"
              style={{ color: found >= GEMS ? COLOR : "#111827" }}
            >
              {found >= GEMS ? t.win : t.lose(found)}
            </p>
          </div>
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite" data-fi360-live>
        {live}
      </p>
    </div>
  );
}

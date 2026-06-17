'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import * as THREE from 'three';

const MONO = 'var(--font-jetbrains-mono), monospace';
const SANS = 'var(--font-space-grotesk), sans-serif';

const NAV_LINKS = [
  { href: '#work', label: 'work' },
  { href: '#explore', label: 'explore' },
  { href: '#demo', label: 'live demo' },
  { href: '#contact', label: 'contact' },
];

const TECH = [
  'NEXT.JS', 'REACT', 'TYPESCRIPT', 'C#', 'THREE.JS',
  'WEBGL', 'STRIPE', 'NODE', '360° IMAGING',
];

const STATS = [
  { value: '200k+', label: 'monthly users on a portal I led at PayPal' },
  { value: '400%', label: 'DAU growth I helped ship at Microsoft Bing' },
  { value: '2', label: 'SaaS products built & running solo, end to end' },
  { value: '∞', label: 'experiments in 3D, 360° & generative web' },
];

type Project = {
  href: string;
  tag: string;
  tagColor: string;
  tagBorder: string;
  title: string;
  body: React.ReactNode;
  tech: string[];
  cardBg?: string;
  cardBorder?: string;
  delay?: string;
};

const PROJECTS: Project[] = [
  {
    href: 'https://fastlane.paypal.com/',
    tag: 'PayPal · lead',
    tagColor: '#8da0ff',
    tagBorder: '#2c3358',
    title: 'Fastlane',
    body: (
      <>
        Technical co-lead for the profile-management portal — from repo creation to
        production launch. Maintained the Next.js app serving{' '}
        <b style={{ color: '#e8e2da', fontWeight: 600 }}>200k+ monthly users</b> and led its
        international expansion across continents.
      </>
    ),
    tech: ['Next.js', 'React', 'i18n'],
  },
  {
    href: 'https://www.bing.com/images?FORM=Z9LH',
    tag: 'Microsoft',
    tagColor: '#7ed47a',
    tagBorder: '#2a4a2c',
    title: 'Bing Image\nInspiration Feed',
    body: (
      <>
        Drove UX dev for a 0-to-1 recommendation feed for Bing Multimedia. Shipped features
        in C#, TypeScript &amp; React that contributed to a{' '}
        <b style={{ color: '#e8e2da', fontWeight: 600 }}>400% rise in daily active users</b> over
        9 months.
      </>
    ),
    tech: ['C#', 'TypeScript', 'React'],
    delay: '.06s',
  },
  {
    href: 'https://myalbumlink.com',
    tag: 'solo · SaaS',
    tagColor: '#ff6a3d',
    tagBorder: '#4a2c20',
    title: 'MyAlbumLink',
    body: (
      <>
        A multi-tenant SaaS for shareable media albums via a single link. Auto-compressed
        photo/video uploads, 360° content, watermarking, passcode protection, per-album
        analytics &amp; tiered Stripe subscriptions.
      </>
    ),
    tech: ['Multi-tenant', 'Stripe', '360°'],
    cardBg: '#15110f',
    cardBorder: '#322620',
  },
  {
    href: 'https://www.labwiselink.com',
    tag: 'solo · B2B',
    tagColor: '#c9a0ff',
    tagBorder: '#3a2c4a',
    title: 'LabWiseLink',
    body: (
      <>
        A multi-tenant dental-lab order platform connecting one lab with many clinics. 5-role
        RBAC, an order state machine with audit logging, real-time SSE alerts, file storage
        &amp; multi-clinic doctor support.
      </>
    ),
    tech: ['RBAC', 'SSE', 'State machine'],
    delay: '.06s',
  },
];

export default function HomeExperience() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let alive = true;
    const rafIds: number[] = [];
    const winListeners: Array<[keyof WindowEventMap, EventListener]> = [];
    const scenes: Array<{
      canvas: HTMLCanvasElement;
      renderer: THREE.WebGLRenderer;
      cam: THREE.PerspectiveCamera;
    }> = [];

    const addWin = (type: keyof WindowEventMap, fn: EventListener) => {
      window.addEventListener(type, fn);
      winListeners.push([type, fn]);
    };

    const raf = (fn: FrameRequestCallback) => {
      rafIds.push(requestAnimationFrame(fn));
    };

    // ---- renderer factory ----
    const mk = (canvas: HTMLCanvasElement) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
      scenes.push({ canvas, renderer, cam });
      return { renderer, scene, cam };
    };

    // ---- generic drag controller (hero) ----
    const attachDrag = (canvas: HTMLCanvasElement, opts: { rx: number; ry: number }) => {
      const st = {
        rx: opts.rx, ry: opts.ry, tx: opts.rx, ty: opts.ry,
        down: false, px: 0, py: 0, vx: 0, vy: 0, idle: 0,
        update: (() => {}) as (auto?: number) => void,
      };
      const get = (e: PointerEvent) => e;
      const onDown = (e: Event) => {
        st.down = true; st.idle = 0;
        const p = get(e as PointerEvent); st.px = p.clientX; st.py = p.clientY;
      };
      const onMove = (e: Event) => {
        if (!st.down) return;
        const p = get(e as PointerEvent);
        const dx = p.clientX - st.px, dy = p.clientY - st.py;
        st.px = p.clientX; st.py = p.clientY;
        st.ty += dx * 0.008; st.tx += dy * 0.008;
        st.vx = dx * 0.008; st.vy = dy * 0.008;
      };
      const onUp = () => { st.down = false; };
      canvas.addEventListener('pointerdown', onDown);
      addWin('pointermove', onMove);
      addWin('pointerup', onUp);
      st.update = (auto?: number) => {
        if (!st.down) {
          st.ty += st.vx; st.tx += st.vy; st.vx *= 0.94; st.vy *= 0.94;
          st.idle++; if (st.idle > 30) st.ty += auto ?? 0.0025;
        }
        st.rx += (st.tx - st.rx) * 0.08;
        st.ry += (st.ty - st.ry) * 0.08;
      };
      return st;
    };

    // ---- HERO: draggable particle cloud ----
    const initHero = () => {
      const c = document.getElementById('jrr-hero') as HTMLCanvasElement | null;
      if (!c) return;
      const { renderer, scene, cam } = mk(c);
      cam.position.z = 4.6;
      const N = 6000;
      const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      const a = new THREE.Color(0xff6a3d), b = new THREE.Color(0xffd089), d = new THREE.Color(0x6f7bff);
      for (let i = 0; i < N; i++) {
        const r = 1.7 + (Math.random() - 0.5) * 0.55;
        const th = Math.acos(2 * Math.random() - 1), ph = Math.random() * Math.PI * 2;
        pos[i * 3] = r * Math.sin(th) * Math.cos(ph);
        pos[i * 3 + 1] = r * Math.sin(th) * Math.sin(ph);
        pos[i * 3 + 2] = r * Math.cos(th);
        const t = Math.random();
        const mix = t < 0.72 ? a.clone().lerp(b, t / 0.72) : a.clone().lerp(d, (t - 0.72) / 0.28);
        col[i * 3] = mix.r; col[i * 3 + 1] = mix.g; col[i * 3 + 2] = mix.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.032, vertexColors: true, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      const group = new THREE.Group(); group.add(pts);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.15, 0.005, 8, 180),
        new THREE.MeshBasicMaterial({ color: 0xff6a3d, transparent: true, opacity: 0.4 }),
      );
      ring.rotation.x = Math.PI / 2.3; group.add(ring);
      scene.add(group);
      const place = () => {
        const wide = c.clientWidth > 760;
        group.position.x = wide ? 2.2 : 0;
        group.position.y = wide ? 0 : 1.4;
      };
      place();
      const drag = attachDrag(c, { rx: 0.2, ry: 0.3 });
      const loop = () => {
        if (!alive) return;
        drag.update(0.0035);
        group.rotation.x = drag.rx; group.rotation.y = drag.ry;
        pts.rotation.y += 0.0012;
        renderer.render(scene, cam);
        raf(loop);
      };
      loop();
    };

    // ---- LIVE DEMO: look-around 3D world ----
    const initWorld = () => {
      const c = document.getElementById('jrr-world') as HTMLCanvasElement | null;
      if (!c) return;
      const { renderer, scene, cam } = mk(c);
      scene.fog = new THREE.FogExp2(0x0b0a09, 0.035);
      cam.position.set(0, 0, 0);
      cam.rotation.order = 'YXZ';

      const SN = 2600;
      const sp = new Float32Array(SN * 3);
      for (let i = 0; i < SN; i++) {
        const r = 60, th = Math.acos(2 * Math.random() - 1), ph = Math.random() * Math.PI * 2;
        sp[i * 3] = r * Math.sin(th) * Math.cos(ph);
        sp[i * 3 + 1] = r * Math.sin(th) * Math.sin(ph);
        sp[i * 3 + 2] = r * Math.cos(th);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
        color: 0xfff2e0, size: 0.18, transparent: true, opacity: 0.7,
      })));

      const grid = new THREE.GridHelper(120, 60, 0xff6a3d, 0x3a2a22);
      grid.position.y = -8;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.4;
      scene.add(grid);

      const shapes: THREE.Mesh[] = [];
      const colors = [0xff6a3d, 0xffd089, 0x6f7bff, 0xff6a3d, 0xe85d75];
      const geoms = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.TorusGeometry(0.9, 0.28, 16, 60),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TorusKnotGeometry(0.7, 0.24, 90, 16),
      ];
      for (let i = 0; i < 26; i++) {
        const g = geoms[i % geoms.length];
        const wire = Math.random() > 0.45;
        const col = colors[i % colors.length];
        const m = wire
          ? new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.6 })
          : new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.2 });
        const mesh = new THREE.Mesh(g, m);
        const ang = Math.random() * Math.PI * 2;
        const rad = 9 + Math.random() * 22;
        mesh.position.set(Math.cos(ang) * rad, (Math.random() - 0.4) * 16, Math.sin(ang) * rad);
        const s = 0.6 + Math.random() * 2.2; mesh.scale.setScalar(s);
        mesh.userData.spin = (Math.random() - 0.5) * 0.01;
        mesh.userData.spin2 = (Math.random() - 0.5) * 0.01;
        mesh.userData.fy = mesh.position.y; mesh.userData.ph = Math.random() * Math.PI * 2;
        shapes.push(mesh); scene.add(mesh);
      }
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const pl = new THREE.PointLight(0xff6a3d, 60, 60); pl.position.set(0, 6, 0); scene.add(pl);
      const pl2 = new THREE.PointLight(0x6f7bff, 40, 60); pl2.position.set(10, -4, -8); scene.add(pl2);

      const look = { yaw: 0.4, pitch: 0, tyaw: 0.4, tpitch: 0, down: false, px: 0, py: 0, idle: 0 };
      const onDown = (e: Event) => {
        const p = e as PointerEvent;
        look.down = true; look.idle = 0; c.style.cursor = 'grabbing';
        look.px = p.clientX; look.py = p.clientY;
      };
      const onMove = (e: Event) => {
        if (!look.down) return;
        const p = e as PointerEvent;
        look.tyaw -= (p.clientX - look.px) * 0.004; look.tpitch -= (p.clientY - look.py) * 0.004;
        look.tpitch = Math.max(-0.9, Math.min(0.9, look.tpitch));
        look.px = p.clientX; look.py = p.clientY;
      };
      const onUp = () => { look.down = false; c.style.cursor = 'grab'; };
      c.addEventListener('pointerdown', onDown);
      addWin('pointermove', onMove);
      addWin('pointerup', onUp);

      let t = 0;
      const loop = () => {
        if (!alive) return;
        t += 0.01;
        if (!look.down) { look.idle++; if (look.idle > 60) look.tyaw += 0.0009; }
        look.yaw += (look.tyaw - look.yaw) * 0.07;
        look.pitch += (look.tpitch - look.pitch) * 0.07;
        cam.rotation.y = look.yaw; cam.rotation.x = look.pitch;
        shapes.forEach((m) => {
          m.rotation.x += m.userData.spin; m.rotation.y += m.userData.spin2;
          m.position.y = m.userData.fy + Math.sin(t + m.userData.ph) * 0.6;
        });
        renderer.render(scene, cam);
        raf(loop);
      };
      loop();
    };

    // ---- kick off WebGL scenes ----
    try { initHero(); } catch (e) { console.warn('hero', e); }
    try { initWorld(); } catch (e) { console.warn('world', e); }

    // ---- scramble text ----
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*<>/{}[]01';
    const scramble = (el: HTMLElement, text: string, delay: number) => {
      let frame = 0; const total = text.length;
      setTimeout(() => {
        const iv = setInterval(() => {
          frame++;
          let out = '';
          for (let i = 0; i < total; i++) {
            if (i < frame * 0.6) out += text[i];
            else if (text[i] === ' ') out += ' ';
            else out += chars[Math.floor(Math.random() * chars.length)];
          }
          el.textContent = out;
          if (frame * 0.6 >= total) { clearInterval(iv); el.textContent = text; }
        }, 34);
      }, delay);
    };
    const heroScramble = root.querySelector<HTMLElement>('#top [data-scramble]');
    if (heroScramble) scramble(heroScramble, heroScramble.getAttribute('data-scramble') || '', 300);

    // ---- magnetic buttons ----
    root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      el.style.transition = 'transform 0.18s ease-out';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * 0.35}px, ${my * 0.35}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = 'translate(0,0)'; });
    });

    // ---- 3D tilt cards ----
    root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
      const inner = card.querySelector<HTMLElement>('[data-tilt-inner]');
      if (!inner) return;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = `rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateZ(0)`;
        inner.style.borderColor = 'rgba(255,106,61,0.5)';
        inner.style.background = '#181513';
      });
      card.addEventListener('pointerleave', () => {
        inner.style.transform = 'rotateY(0) rotateX(0)';
        inner.style.borderColor = '';
        inner.style.background = '';
      });
    });

    // ---- scroll reveal ----
    const revealEls = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const show = (el: HTMLElement) => {
      el.classList.add('is-visible');
      const sc = el.matches('[data-scramble]') ? el : el.querySelector<HTMLElement>('[data-scramble]');
      if (sc && !sc.dataset.scrambled) {
        sc.dataset.scrambled = '1';
        scramble(sc, sc.getAttribute('data-scramble') || '', 80);
      }
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((ents) => {
        ents.forEach((en) => { if (en.isIntersecting) { show(en.target as HTMLElement); io.unobserve(en.target); } });
      }, { threshold: 0.18 });
      revealEls.forEach((el) => io.observe(el));
      setTimeout(() => revealEls.forEach((el) => { if (!el.classList.contains('is-visible')) show(el); }), 3500);
    } else {
      revealEls.forEach(show);
    }

    // ---- scroll-driven horizontal gallery ----
    const sec = document.getElementById('explore');
    const track = document.getElementById('jrr-track');
    const bar = document.getElementById('jrr-track-bar');
    let relayoutTrack: (() => void) | null = null;
    if (sec && track) {
      let cur = 0;
      const overflow = () => Math.max(0, track.scrollWidth - window.innerWidth + 40);
      // Size the section so vertical scroll distance ≈ horizontal travel (no dead space).
      const layout = () => {
        const extra = window.innerHeight * 0.35; // small lead-in / lead-out
        sec.style.height = window.innerHeight + overflow() + extra + 'px';
      };
      layout();
      relayoutTrack = layout;
      const loop = () => {
        if (!alive) return;
        const rect = sec.getBoundingClientRect();
        const total = sec.offsetHeight - window.innerHeight;
        let p = total > 0 ? -rect.top / total : 0;
        p = Math.max(0, Math.min(1, p));
        cur += (p - cur) * 0.12;
        track.style.transform = `translateX(${-cur * overflow()}px)`;
        if (bar) bar.style.width = 8 + cur * 92 + '%';
        raf(loop);
      };
      loop();
    }

    // ---- resize ----
    const onResize = () => {
      scenes.forEach((s) => {
        const w = s.canvas.clientWidth, h = s.canvas.clientHeight;
        if (!w || !h) return;
        s.renderer.setSize(w, h, false);
        s.cam.aspect = w / h; s.cam.updateProjectionMatrix();
      });
      relayoutTrack?.();
    };
    addWin('resize', onResize);

    return () => {
      alive = false;
      rafIds.forEach((id) => cancelAnimationFrame(id));
      winListeners.forEach(([type, fn]) => window.removeEventListener(type, fn));
      scenes.forEach((s) => s.renderer.dispose());
    };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        background: '#0b0a09',
        color: '#f6f0e9',
        fontFamily: SANS,
        // `clip` (not `hidden`) prevents horizontal overflow WITHOUT creating a
        // scroll container — which would otherwise break `position: sticky` below.
        overflowX: 'clip',
        position: 'relative',
      }}
    >
      <style>{`
        html{scroll-behavior:smooth;}
        ::selection{background:#ff6a3d;color:#0b0a09;}
        @keyframes jrr-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes jrr-marquee2{from{transform:translateX(-50%)}to{transform:translateX(0)}}
        @keyframes jrr-down{0%{transform:translateY(0);opacity:0}30%{opacity:1}100%{transform:translateY(14px);opacity:0}}
        @keyframes jrr-pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .jrr-reveal{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.2,.6,.2,1),transform .8s cubic-bezier(.2,.6,.2,1);}
        .jrr-reveal.is-visible{opacity:1;transform:none;}
        @media (prefers-reduced-motion: reduce){
          .jrr-reveal{opacity:1!important;transform:none!important;}
        }
      `}</style>

      {/* ===== NAV ===== */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px',
        backdropFilter: 'blur(8px)', background: 'linear-gradient(#0b0a09cc,#0b0a0900)',
      }}>
        <a href="#top" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 34, height: 34, border: '1.5px solid #ff6a3d', color: '#ff6a3d', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700,
            fontSize: 13, letterSpacing: '-0.04em',
          }}>JR</span>
          <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: '#c0b6ac' }}>
            jorge romero romanis
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30, fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em' }}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="jrr-nav" style={{ color: '#c0b6ac', textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#8fb98a' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7ed47a', animation: 'jrr-pulse 2s ease-in-out infinite' }} />
            available
          </span>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section id="top" style={{ position: 'relative', height: '100vh', minHeight: 680, overflow: 'hidden' }}>
        <canvas id="jrr-hero" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', width: 'max-content', animation: 'jrr-marquee 26s linear infinite',
            fontWeight: 700, fontSize: 'clamp(90px,13vw,190px)', letterSpacing: '-0.03em',
            whiteSpace: 'nowrap', color: 'transparent', WebkitTextStroke: '1.3px rgba(255,255,255,0.08)',
          }}>
            <span style={{ padding: '0 38px' }}>ENGINEERING&nbsp;×&nbsp;CREATIVITY&nbsp;×&nbsp;</span>
            <span style={{ padding: '0 38px' }}>ENGINEERING&nbsp;×&nbsp;CREATIVITY&nbsp;×&nbsp;</span>
          </div>
        </div>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex',
          flexDirection: 'column', justifyContent: 'center', padding: '0 clamp(24px,7vw,110px)',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#ff6a3d', marginBottom: 22 }}>
            software engineer · 360° storyteller
          </div>
          <h1 style={{ fontSize: 'clamp(54px,8.5vw,118px)', lineHeight: 0.92, fontWeight: 700, letterSpacing: '-0.035em', maxWidth: '11ch' }}>
            <span data-scramble="Hi, I'm Jorge." style={{ display: 'block' }}>Hi, I&apos;m Jorge.</span>
            <span style={{ display: 'block', color: '#9a8d80', fontWeight: 500, fontSize: '0.5em', letterSpacing: '-0.02em', marginTop: 14 }}>
              I build &amp; explore on the web.
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(16px,1.5vw,20px)', lineHeight: 1.55, color: '#c0b6ac', marginTop: 26, maxWidth: 520 }}>
            A software engineer shipping production apps for millions — and treating the browser as a playground for 3D, 360° and the new web.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 34, pointerEvents: 'auto', flexWrap: 'wrap' }}>
            <a href="#work" data-magnetic style={{ textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#0b0a09', background: '#ff6a3d', borderRadius: 12, padding: '15px 28px', display: 'inline-block' }}>
              See my work →
            </a>
            <a href="#demo" data-magnetic style={{ textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#f6f0e9', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '15px 28px', display: 'inline-block' }}>
              Step into a 3D scene
            </a>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 30, left: 'clamp(24px,7vw,110px)', fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: '#7a6e63', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-block', width: 1, height: 30, background: 'linear-gradient(#7a6e63,transparent)', animation: 'jrr-down 1.8s ease-in-out infinite' }} />
          scroll to explore
        </div>
        <div style={{ position: 'absolute', bottom: 30, right: 40, fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: '#7a6e63' }}>
          drag the particles ↺
        </div>
      </section>

      {/* ===== TECH MARQUEE STRIP ===== */}
      <div style={{ borderTop: '1px solid #211e1b', borderBottom: '1px solid #211e1b', padding: '20px 0', overflow: 'hidden', background: '#0d0c0b' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: 'jrr-marquee2 30s linear infinite', fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', color: '#6b635a' }}>
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: 'flex', gap: 46, paddingRight: 46 }}>
              {TECH.map((tech) => (
                <span key={tech} style={{ display: 'contents' }}>
                  <span>{tech}</span>
                  <span style={{ color: '#ff6a3d' }}>/</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ===== ABOUT / STATEMENT ===== */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(90px,14vh,170px) clamp(24px,7vw,40px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 60 }}>
          <div data-reveal className="jrr-reveal" style={{ fontSize: 'clamp(28px,3.6vw,52px)', lineHeight: 1.2, fontWeight: 500, letterSpacing: '-0.02em', maxWidth: '18ch', textWrap: 'pretty' }}>
            I write code that reaches <span style={{ color: '#ff6a3d' }}>millions</span>, then spend my nights pushing pixels into the <span style={{ color: '#6f7bff' }}>third dimension</span>.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 34, borderTop: '1px solid #211e1b', paddingTop: 40 }}>
            {STATS.map((s, i) => (
              <div key={s.value} data-reveal className="jrr-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div style={{ fontFamily: MONO, fontSize: 38, fontWeight: 700, color: '#ffd089' }}>{s.value}</div>
                <div style={{ fontSize: 14, color: '#9a8d80', marginTop: 6, lineHeight: 1.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SELECTED WORK ===== */}
      <section id="work" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(24px,7vw,40px) clamp(60px,10vh,120px)' }}>
        <div data-reveal className="jrr-reveal" style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 48, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: '#ff6a3d', letterSpacing: '0.1em' }}>01</span>
          <h2 data-scramble="Selected work" style={{ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 700, letterSpacing: '-0.03em' }}>Selected work</h2>
          <span style={{ fontFamily: MONO, fontSize: 13, color: '#7a6e63', letterSpacing: '0.04em', marginLeft: 'auto' }}>4 projects · 2 companies · 2 solo</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 24 }}>
          {PROJECTS.map((p) => (
            <a
              key={p.title}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              data-tilt
              data-reveal
              className="jrr-reveal"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block', perspective: 1000, transitionDelay: p.delay }}
            >
              <div data-tilt-inner style={{
                background: p.cardBg || '#131210', border: `1px solid ${p.cardBorder || '#262220'}`,
                borderRadius: 18, padding: 30, height: '100%', transformStyle: 'preserve-3d',
                transition: 'transform .25s ease-out,border-color .3s,background .3s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', transform: 'translateZ(30px)' }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: p.tagColor, letterSpacing: '0.06em', border: `1px solid ${p.tagBorder}`, borderRadius: 999, padding: '5px 12px' }}>{p.tag}</span>
                  <span style={{ fontSize: 20, color: '#7a6e63' }}>↗</span>
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 60, transform: 'translateZ(40px)', whiteSpace: 'pre-line' }}>{p.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#a89e94', marginTop: 12, transform: 'translateZ(20px)' }}>{p.body}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20, transform: 'translateZ(15px)' }}>
                  {p.tech.map((t) => (
                    <span key={t} style={{ fontFamily: MONO, fontSize: 11, color: '#8a8078', border: '1px solid #2a2622', borderRadius: 6, padding: '4px 9px' }}>{t}</span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ===== EXPLORE — SCROLL-DRIVEN HORIZONTAL GALLERY ===== */}
      <section id="explore" style={{ position: 'relative', height: '360vh', background: '#0d0c0b', borderTop: '1px solid #211e1b' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ padding: '0 clamp(24px,7vw,40px)', marginBottom: 32, display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: MONO, fontSize: 13, color: '#ff6a3d', letterSpacing: '0.1em' }}>02</span>
            <h2 style={{ fontSize: 'clamp(30px,4.5vw,54px)', fontWeight: 700, letterSpacing: '-0.03em' }}>Beyond the code</h2>
            <span style={{ fontFamily: MONO, fontSize: 12, color: '#7a6e63', marginLeft: 'auto' }}>keep scrolling →</span>
          </div>
          <div id="jrr-track" style={{ display: 'flex', gap: 26, padding: '0 clamp(24px,7vw,40px)', willChange: 'transform' }}>

            {/* Photography */}
            <GalleryTile href="/gallery" title="Photography" index="01 / 04"
              copy="A collection of favorite shots — light, landscape and the occasional accident worth keeping."
              width="min(64vw,560px)" gradient="radial-gradient(120% 120% at 20% 15%,#2a1c14,#0c0b0a)" icon="📷" />

            {/* 360 Tours */}
            <GalleryTile href="/gallery360" title="360° Tours" index="02 / 04"
              copy="Immersive virtual walkthroughs — step inside a space from anywhere in the world."
              width="min(64vw,560px)" gradient="radial-gradient(120% 120% at 75% 25%,#161a2e,#0c0b0a)" icon="🌐" />

            {/* Aerial Video */}
            <div style={{ flex: '0 0 auto', width: 'min(70vw,640px)' }}>
              <div style={{ width: '100%', height: '54vh', maxHeight: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2622', background: '#000' }}>
                <iframe
                  src="https://www.youtube.com/embed/mLDi3wrbtpc?si=NFQJJMPjjCzVupzO"
                  title="Aerial videography"
                  style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
                <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Aerial videography</h3>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#7a6e63' }}>03 / 04</span>
              </div>
              <p style={{ fontSize: 14, color: '#9a8d80', lineHeight: 1.55, marginTop: 6, maxWidth: '46ch' }}>
                Drone footage capturing perspectives you can&rsquo;t get any other way.
              </p>
            </div>

            {/* Interactive Tools */}
            <Link href="/tools" style={{ flex: '0 0 auto', width: 'min(64vw,560px)', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: '100%', height: '54vh', maxHeight: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2622', background: 'radial-gradient(120% 120% at 30% 20%,#1a130f,#0c0b0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: '#ff6a3d', letterSpacing: '0.1em', textAlign: 'center', lineHeight: 2 }}>
                  &lt;/&gt;<br /><span style={{ color: '#9a8d80' }}>interactive experiments<br />&amp; creative coding</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
                <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Interactive tools</h3>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#7a6e63' }}>04 / 04</span>
              </div>
              <p style={{ fontSize: 14, color: '#9a8d80', lineHeight: 1.55, marginTop: 6, maxWidth: '46ch' }}>
                Fun projects, generative toys and experiments — like the one running just below.
              </p>
            </Link>

          </div>
          <div style={{ padding: '0 clamp(24px,7vw,40px)', marginTop: 34 }}>
            <div style={{ height: 2, background: '#211e1b', borderRadius: 2, overflow: 'hidden', maxWidth: 340 }}>
              <div id="jrr-track-bar" style={{ height: '100%', width: '8%', background: '#ff6a3d', borderRadius: 2 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== LIVE INTERACTIVE 360 DEMO ===== */}
      <section id="demo" style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden', borderTop: '1px solid #211e1b' }}>
        <canvas id="jrr-world" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: 'grab' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'clamp(90px,12vh,120px) clamp(24px,7vw,40px) 40px' }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', color: '#ff6a3d', marginBottom: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff6a3d', animation: 'jrr-pulse 1.4s ease-in-out infinite' }} />
              LIVE · RUNNING IN YOUR BROWSER
            </div>
            <h2 style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>Step inside a 3D scene.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#c0b6ac', marginTop: 18, maxWidth: 440 }}>
              No video, no screenshot — a real-time WebGL world rendered live. Drag to look around, the way a 360° tour feels. This is the kind of thing I build for fun.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: MONO, fontSize: 11, color: '#8a7e72', letterSpacing: '0.08em' }}>
            <span>three.js · ~6k objects · 60fps</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>drag to look around <span style={{ fontSize: 15 }}>↺</span></span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 22, height: 22, margin: '-11px 0 0 -11px', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%' }} />
      </section>

      {/* ===== CONTACT / FOOTER ===== */}
      <section id="contact" style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(90px,16vh,180px) clamp(24px,7vw,40px) 70px' }}>
        <div data-reveal className="jrr-reveal" style={{ fontFamily: MONO, fontSize: 13, color: '#ff6a3d', letterSpacing: '0.1em', marginBottom: 24 }}>03 · let&rsquo;s talk</div>
        <h2 data-reveal className="jrr-reveal" style={{ fontSize: 'clamp(44px,8vw,104px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95 }}>
          Let&rsquo;s build<br />something <span style={{ color: '#ff6a3d', fontStyle: 'italic' }}>worth exploring.</span>
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 48 }}>
          <a href="mailto:jorgeromanis@yahoo.com.mx" data-magnetic style={{ textDecoration: 'none', fontSize: 16, fontWeight: 600, color: '#0b0a09', background: '#ff6a3d', borderRadius: 14, padding: '18px 34px', display: 'inline-block' }}>
            jorgeromanis@yahoo.com.mx
          </a>
          <Link href="/about" data-magnetic style={{ textDecoration: 'none', fontSize: 16, fontWeight: 600, color: '#f6f0e9', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '18px 34px', display: 'inline-block' }}>
            More about me →
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 'clamp(70px,12vh,130px)', paddingTop: 28, borderTop: '1px solid #211e1b', fontFamily: MONO, fontSize: 12, color: '#6b635a', letterSpacing: '0.06em' }}>
          <span>© 2026 Jorge Romero Romanis</span>
          <span>Software engineer · creative explorer · 360° storyteller</span>
        </div>
      </section>
    </div>
  );
}

function GalleryTile({ href, title, index, copy, width, gradient, icon }: {
  href: string; title: string; index: string; copy: string; width: string; gradient: string; icon: string;
}) {
  return (
    <Link href={href} style={{ flex: '0 0 auto', width, textDecoration: 'none', color: 'inherit' }}>
      <div style={{ width: '100%', height: '54vh', maxHeight: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid #2a2622', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 64, opacity: 0.55, filter: 'grayscale(0.2)' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
        <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h3>
        <span style={{ fontFamily: MONO, fontSize: 12, color: '#7a6e63' }}>{index}</span>
      </div>
      <p style={{ fontSize: 14, color: '#9a8d80', lineHeight: 1.55, marginTop: 6, maxWidth: '46ch' }}>{copy}</p>
    </Link>
  );
}

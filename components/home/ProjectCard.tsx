'use client';

import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';
import { MONO } from './data';
import type { Project } from './data';

/**
 * Tilt + cursor spotlight. The original used raw style writes on pointermove;
 * routing it through motion values + springs means the card settles instead of
 * snapping, and it lets the spotlight track the same source of truth.
 */
export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);

  // -0.5 .. 0.5 across the card
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // 0 .. 100 for the spotlight, in percent
  const sx = useMotionValue(50);
  const sy = useMotionValue(50);

  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), spring);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [8, -8]), spring);

  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${sx}% ${sy}%, rgba(255,106,61,0.16), transparent 68%)`;

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    px.set(nx - 0.5);
    py.set(ny - 0.5);
    sx.set(nx * 100);
    sy.set(ny * 100);
  };

  const onLeave = () => {
    px.set(0);
    py.set(0);
    sx.set(50);
    sy.set(50);
  };

  return (
    <motion.a
      ref={ref}
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        perspective: 1100,
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          background: project.cardBg || '#131210',
          border: `1px solid ${project.cardBorder || '#262220'}`,
          borderRadius: 18,
          padding: 30,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
        whileHover={{ borderColor: 'rgba(255,106,61,0.5)' }}
        transition={{ duration: 0.3 }}
      >
        {/* cursor spotlight */}
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: spotlight,
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', transform: 'translateZ(30px)', position: 'relative' }}>
          <span style={{
            fontFamily: MONO, fontSize: 12, color: project.tagColor, letterSpacing: '0.06em',
            border: `1px solid ${project.tagBorder}`, borderRadius: 999, padding: '5px 12px',
          }}>
            {project.tag}
          </span>
          <motion.span
            style={{ fontSize: 20, color: '#7a6e63', display: 'inline-block' }}
            whileHover={{ x: 3, y: -3 }}
          >
            ↗
          </motion.span>
        </div>

        <h3 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 60,
          transform: 'translateZ(45px)', whiteSpace: 'pre-line', position: 'relative',
        }}>
          {project.title}
        </h3>

        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#a89e94', marginTop: 12, transform: 'translateZ(22px)', position: 'relative' }}>
          {project.body}
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20, transform: 'translateZ(16px)', position: 'relative' }}>
          {project.tech.map((t) => (
            <span key={t} style={{
              fontFamily: MONO, fontSize: 11, color: '#8a8078',
              border: '1px solid #2a2622', borderRadius: 6, padding: '4px 9px',
            }}>
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.a>
  );
}

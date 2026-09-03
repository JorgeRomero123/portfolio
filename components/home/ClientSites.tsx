'use client';

import { motion } from 'framer-motion';
import { ACCENT, MONO, CLIENT_SITES } from './data';

/**
 * Deliberately lighter than ProjectCard — these are client sites, not products,
 * and three of them in full tilt-cards would out-shout the PayPal work sitting
 * directly above. Rules and type instead of boxes and shadows.
 */
export default function ClientSites() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))',
        gap: 0,
        borderTop: '1px solid #e4eaf3',
      }}
    >
      {CLIENT_SITES.map((c, i) => (
        <motion.a
          key={c.href}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          data-reveal
          className="jrr-client"
          whileHover={{ backgroundColor: '#eff4fd' }}
          transition={{ duration: 0.28 }}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '28px clamp(16px,2vw,26px) 32px',
            borderBottom: '1px solid #e4eaf3',
            // Hairlines between columns only; the last one would double up
            // against the section edge.
            borderRight: i === CLIENT_SITES.length - 1 ? 'none' : '1px solid #e4eaf3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <h3 style={{ fontSize: 'clamp(21px,2.2vw,26px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {c.name}
            </h3>
            <motion.span
              aria-hidden
              className="jrr-client-arrow"
              style={{ fontSize: 16, color: '#a8b5cc', flex: '0 0 auto' }}
            >
              ↗
            </motion.span>
          </div>

          <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>
            {c.sector}
          </div>

          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#4e5f80', margin: 0 }}>
            {c.body}
          </p>

          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', color: '#9aa8c2', marginTop: 'auto', paddingTop: 14 }}>
            {c.place}
          </div>
        </motion.a>
      ))}
    </div>
  );
}

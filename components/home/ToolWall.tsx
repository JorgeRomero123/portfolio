'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MONO, TOOL_GROUPS, TOOL_COUNT } from './data';

/**
 * The pile. Every one of these is a real, working route under /tools — the
 * point of showing all 25 at once is the volume, not any single entry.
 */
export default function ToolWall() {
  return (
    <div style={{ display: 'grid', gap: 46 }}>
      {TOOL_GROUPS.map((group, gi) => (
        <div key={group.label}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
            fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: group.accent,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: group.accent }} />
            {group.label}
            <span style={{ flex: 1, height: 1, background: '#211e1b' }} />
            <span style={{ color: '#6b635a' }}>{group.tools.length}</span>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-8%' }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.035, delayChildren: gi * 0.05 } },
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(min(210px,100%),1fr))',
              gap: 10,
            }}
          >
            {group.tools.map((tool) => (
              <motion.div
                key={tool.name}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.97 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                }}
                whileHover={{ y: -4, backgroundColor: '#191614', borderColor: 'rgba(255,106,61,0.4)' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#121110', border: '1px solid #232020',
                  borderRadius: 12, padding: '13px 14px',
                }}
              >
                <span style={{ fontSize: 17, lineHeight: 1 }} aria-hidden="true">{tool.icon}</span>
                <span style={{ fontSize: 13.5, color: '#c0b6ac', lineHeight: 1.3 }}>{tool.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href="/tools"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
            fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em', color: '#ff6a3d',
            border: '1px solid #4a2c20', borderRadius: 12, padding: '15px 24px',
          }}
        >
          open all {TOOL_COUNT} tools →
        </Link>
      </motion.div>
    </div>
  );
}

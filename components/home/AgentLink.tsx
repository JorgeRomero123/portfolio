'use client';

import { motion } from 'framer-motion';
import { MONO } from './data';

/** Plain-text brief for AI agents. A real link, so it is in the HTML an agent reads. */
export default function AgentLink({ className }: { className?: string }) {
  return (
    <motion.a
      href="/agent.md"
      className={className}
      whileHover={{ scale: 1.04, borderColor: 'rgba(11,27,58,0.5)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 17 }}
      style={{
        textDecoration: 'none', fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: '#44557a',
        border: '1px dashed rgba(11,27,58,0.28)', borderRadius: 12, padding: '12px 20px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      Are you an AI agent? Click here
    </motion.a>
  );
}

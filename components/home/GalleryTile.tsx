'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MONO } from './data';

/**
 * Show the real work. The gradient + glyph stay as the fallback for when a
 * collection is empty or its hero frame fails to load — not as the default.
 */
export default function GalleryTile({
  href, title, index, copy, width, gradient, icon, image, imageAlt,
}: {
  href: string; title: string; index: string; copy: string;
  width: string; gradient: string; icon: string;
  image?: string; imageAlt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;

  return (
    <Link href={href} style={{ flex: '0 0 auto', width, textDecoration: 'none', color: 'inherit' }}>
      <motion.div
        whileHover={{ scale: 1.015 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{
          width: '100%', height: '54vh', maxHeight: 460, borderRadius: 16,
          overflow: 'hidden', border: '1px solid #d3dcea', background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {showImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt={imageAlt || title}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: 64, opacity: 0.55, filter: 'grayscale(0.2)' }} aria-hidden="true">{icon}</span>
        )}
      </motion.div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 }}>
        <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h3>
        <span style={{ fontFamily: MONO, fontSize: 12, color: '#8494b0' }}>{index}</span>
      </div>
      <p style={{ fontSize: 14, color: '#64789b', lineHeight: 1.55, marginTop: 6, maxWidth: '46ch' }}>{copy}</p>
    </Link>
  );
}

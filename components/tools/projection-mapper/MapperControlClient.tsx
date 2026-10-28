'use client';

import dynamic from 'next/dynamic';

// The control reads its room and saved layout from the URL and localStorage on first
// render, so it only renders in the browser.
const MapperControl = dynamic(() => import('./MapperControl'), {
  ssr: false,
  loading: () => <div className="h-[28rem] animate-pulse rounded-2xl bg-white shadow-sm" />,
});

export default function MapperControlClient() {
  return <MapperControl />;
}

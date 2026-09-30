'use client';

// The game stage: full-width, fills the viewport below the sticky nav. The 3D board is loaded with
// next/dynamic (ssr: false) so three/fiber/drei live in their own chunk. Rendering pauses when the
// stage scrolls out of view or the tab is hidden.
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import GameShell from './GameShell';

const BoardScene = dynamic(() => import('./board/BoardScene'), { ssr: false, loading: () => null });

export default function GameStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    const onVis = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div ref={ref} className="relative h-[calc(100svh-4rem)] min-h-[520px] w-full overflow-hidden bg-gray-50">
      <GameShell Board={BoardScene} active={inView && tabVisible} />
    </div>
  );
}

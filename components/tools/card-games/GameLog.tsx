'use client';

import { useEffect, useRef } from 'react';

interface GameLogProps {
  log: string[];
}

export default function GameLog({ log }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className="bg-gray-900 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs">
      {log.map((entry, i) => (
        <div
          key={i}
          className={
            entry.startsWith('---')
              ? 'text-yellow-400 font-bold my-1'
              : 'text-gray-300'
          }
        >
          {entry}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { WINNER_OVERLAY_DURATION } from '@/lib/card-games/constants';

interface Winner {
  playerName: string;
  amount: number;
  hand: { description: string };
}

interface WinnerOverlayProps {
  winners: Winner[] | null;
}

export default function WinnerOverlay({ winners }: WinnerOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (winners && winners.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), WINNER_OVERLAY_DURATION);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [winners]);

  if (!visible || !winners || winners.length === 0) return null;

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 rounded-2xl">
      <div className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-sm mx-4">
        <div className="text-4xl mb-2">🏆</div>
        {winners.map((w, i) => (
          <div key={i} className="mb-2">
            <div className="text-xl font-bold text-gray-900">{w.playerName}</div>
            <div className="text-emerald-600 font-semibold">wins {w.amount} chips</div>
            <div className="text-sm text-gray-500">{w.hand.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

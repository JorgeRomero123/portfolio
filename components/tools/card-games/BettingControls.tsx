'use client';

import { useState } from 'react';
import { PokerActionType, FilteredGameState } from '@/lib/card-games/types';

interface BettingControlsProps {
  gameState: FilteredGameState;
  onAction: (type: PokerActionType, amount?: number) => void;
}

export default function BettingControls({ gameState, onAction }: BettingControlsProps) {
  const { validActions, callAmount, minRaiseTotal, maxRaiseTotal } = gameState;
  const [raiseAmount, setRaiseAmount] = useState(minRaiseTotal);

  if (validActions.length === 0) return null;

  const canRaise = validActions.includes('raise');

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-3 shadow-lg">
      <div className="text-xs text-gray-500 mb-2 text-center font-medium">Your Turn</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {validActions.includes('fold') && (
          <button
            onClick={() => onAction('fold')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors"
          >
            Fold
          </button>
        )}
        {validActions.includes('check') && (
          <button
            onClick={() => onAction('check')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            Check
          </button>
        )}
        {validActions.includes('call') && (
          <button
            onClick={() => onAction('call')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Call {callAmount}
          </button>
        )}
        {canRaise && (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={minRaiseTotal}
              max={maxRaiseTotal}
              value={raiseAmount}
              onChange={e => setRaiseAmount(Number(e.target.value))}
              className="w-24 accent-amber-500"
            />
            <button
              onClick={() => onAction('raise', raiseAmount)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              Raise {raiseAmount}
            </button>
          </div>
        )}
        {validActions.includes('all-in') && (
          <button
            onClick={() => onAction('all-in')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            All In
          </button>
        )}
      </div>
    </div>
  );
}

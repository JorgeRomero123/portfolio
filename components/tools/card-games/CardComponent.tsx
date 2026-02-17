'use client';

import { Card } from '@/lib/card-games/types';

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

interface CardComponentProps {
  card?: Card | null;
  faceDown?: boolean;
  small?: boolean;
  animate?: boolean;
  className?: string;
}

export default function CardComponent({ card, faceDown, small, animate, className = '' }: CardComponentProps) {
  const w = small ? 'w-10 h-14' : 'w-14 h-20';
  const animClass = animate ? 'animate-[card-deal_0.3s_ease-out]' : '';

  if (faceDown || !card) {
    return (
      <div
        className={`${w} rounded-lg border-2 border-gray-300 bg-gradient-to-br from-blue-700 to-blue-900 shadow-md flex items-center justify-center ${animClass} ${className}`}
        style={animate ? { animation: 'card-deal 0.3s ease-out' } : undefined}
      >
        <div className="w-3/4 h-3/4 rounded border border-blue-400/30 bg-blue-800/50 flex items-center justify-center">
          <span className="text-blue-300/60 text-xs font-bold">?</span>
        </div>
      </div>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  const rankSize = small ? 'text-sm' : 'text-base';
  const suitSize = small ? 'text-lg' : 'text-2xl';

  return (
    <div
      className={`${w} rounded-lg border-2 border-gray-200 bg-white shadow-md flex flex-col items-center justify-between py-1 px-0.5 ${animClass} ${className}`}
      style={animate ? { animation: 'card-deal 0.3s ease-out' } : undefined}
    >
      <span className={`${rankSize} font-bold ${color} leading-none`}>{card.rank}</span>
      <span className={`${suitSize} ${color} leading-none`}>{symbol}</span>
      <style jsx>{`
        @keyframes card-deal {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

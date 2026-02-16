'use client';

import { FilteredPlayer } from '@/lib/card-games/types';
import CardComponent from './CardComponent';

interface PlayerSeatProps {
  player: FilteredPlayer;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isActive: boolean;
  isSelf: boolean;
}

export default function PlayerSeat({ player, isDealer, isSmallBlind, isBigBlind, isActive, isSelf }: PlayerSeatProps) {
  const opacity = player.folded ? 'opacity-40' : '';
  const highlight = isActive && !player.folded ? 'ring-2 ring-yellow-400 bg-yellow-50/50' : '';
  const selfBorder = isSelf ? 'border-emerald-400' : 'border-gray-200';

  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${selfBorder} ${highlight} ${opacity} bg-white/80 backdrop-blur-sm min-w-[90px] transition-all`}>
      {/* Cards */}
      <div className="flex gap-0.5">
        {player.cardCount > 0 ? (
          player.holeCards ? (
            player.holeCards.map((card, i) => (
              <CardComponent key={i} card={card} small />
            ))
          ) : (
            Array.from({ length: player.cardCount }).map((_, i) => (
              <CardComponent key={i} faceDown small />
            ))
          )
        ) : null}
      </div>

      {/* Name + Chips */}
      <div className="text-center">
        <div className={`text-xs font-semibold truncate max-w-[80px] ${isSelf ? 'text-emerald-700' : 'text-gray-800'}`}>
          {player.name}
          {isSelf && ' (You)'}
        </div>
        <div className="text-xs text-gray-500">{player.chips} chips</div>
      </div>

      {/* Badges */}
      <div className="flex gap-1">
        {isDealer && (
          <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1.5 rounded-full font-bold">D</span>
        )}
        {isSmallBlind && (
          <span className="text-[10px] bg-blue-400 text-white px-1.5 rounded-full font-bold">SB</span>
        )}
        {isBigBlind && (
          <span className="text-[10px] bg-red-400 text-white px-1.5 rounded-full font-bold">BB</span>
        )}
        {player.allIn && (
          <span className="text-[10px] bg-orange-500 text-white px-1.5 rounded-full font-bold">ALL IN</span>
        )}
        {player.folded && (
          <span className="text-[10px] bg-gray-400 text-white px-1.5 rounded-full font-bold">FOLD</span>
        )}
      </div>

      {/* Current bet */}
      {player.totalBetThisRound > 0 && (
        <div className="text-[10px] text-amber-700 font-medium">
          Bet: {player.totalBetThisRound}
        </div>
      )}
    </div>
  );
}

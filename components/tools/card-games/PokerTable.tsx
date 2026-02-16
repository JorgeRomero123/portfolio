'use client';

import { FilteredGameState, PokerActionType } from '@/lib/card-games/types';
import PlayerSeat from './PlayerSeat';
import CardComponent from './CardComponent';
import BettingControls from './BettingControls';
import GameLog from './GameLog';
import WinnerOverlay from './WinnerOverlay';

interface PokerTableProps {
  gameState: FilteredGameState;
  playerId: string;
  onAction: (type: PokerActionType, amount?: number) => void;
}

export default function PokerTable({ gameState, playerId, onAction }: PokerTableProps) {
  const { players, communityCards, pot, dealerIndex, activePlayerIndex, handNumber, round } = gameState;

  // Rotate players so current player is at the bottom
  const selfIndex = players.findIndex(p => p.id === playerId);
  const rotated = [...players.slice(selfIndex), ...players.slice(0, selfIndex)];
  const rotatedDealerIndex = (dealerIndex - selfIndex + players.length) % players.length;
  const rotatedActiveIndex = (activePlayerIndex - selfIndex + players.length) % players.length;

  // Compute SB/BB indices (relative to rotated array)
  const sbIndex = players.length === 2
    ? rotatedDealerIndex
    : (rotatedDealerIndex + 1) % players.length;
  const bbIndex = (sbIndex + 1) % players.length;

  // Position players around the table
  const getPosition = (index: number, total: number): string => {
    if (index === 0) return 'col-start-2 row-start-3'; // bottom center (self)
    if (total <= 3) {
      if (index === 1) return 'col-start-1 row-start-2';
      if (index === 2) return 'col-start-3 row-start-2';
    }
    if (total <= 5) {
      const positions = ['', 'col-start-1 row-start-2', 'col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-3 row-start-2'];
      return positions[index] || '';
    }
    // 6-8 players
    const positions = ['',
      'col-start-1 row-start-3', 'col-start-1 row-start-2', 'col-start-1 row-start-1',
      'col-start-2 row-start-1', 'col-start-3 row-start-1', 'col-start-3 row-start-2',
      'col-start-3 row-start-3',
    ];
    return positions[index] || '';
  };

  return (
    <div className="relative">
      {/* Table area */}
      <div className="bg-gradient-to-br from-emerald-800 to-green-900 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden min-h-[500px]">
        <WinnerOverlay winners={gameState.winners} />

        {/* Table info */}
        <div className="absolute top-3 left-3 flex gap-2 text-xs">
          <span className="bg-black/30 text-white px-2 py-1 rounded">Hand #{handNumber}</span>
          <span className="bg-black/30 text-white px-2 py-1 rounded capitalize">{round}</span>
        </div>

        {/* Player grid */}
        <div className="grid grid-cols-3 grid-rows-3 gap-3 items-center justify-items-center py-4">
          {rotated.map((player, i) => (
            <div key={player.id} className={getPosition(i, rotated.length)}>
              <PlayerSeat
                player={player}
                isDealer={i === rotatedDealerIndex}
                isSmallBlind={i === sbIndex}
                isBigBlind={i === bbIndex}
                isActive={i === rotatedActiveIndex && gameState.handInProgress}
                isSelf={i === 0}
              />
            </div>
          ))}

          {/* Community cards + pot in center */}
          <div className="col-start-2 row-start-2 flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {communityCards.map((card, i) => (
                <CardComponent key={i} card={card} />
              ))}
              {/* Empty placeholders */}
              {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-14 h-20 rounded-lg border-2 border-dashed border-white/20" />
              ))}
            </div>
            <div className="bg-black/40 text-white px-4 py-1.5 rounded-full text-sm font-bold">
              Pot: {pot}
            </div>
          </div>
        </div>

        {/* Betting controls (overlaid at bottom) */}
        {gameState.validActions.length > 0 && (
          <div className="mt-2">
            <BettingControls gameState={gameState} onAction={onAction} />
          </div>
        )}
      </div>

      {/* Game log */}
      <div className="mt-4">
        <GameLog log={gameState.gameLog} />
      </div>
    </div>
  );
}

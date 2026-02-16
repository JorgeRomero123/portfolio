'use client';

import { FilteredBlackjackState, BlackjackActionType } from '@/lib/card-games/types';
import CardComponent from './CardComponent';
import BlackjackControls from './BlackjackControls';
import GameLog from './GameLog';
import WinnerOverlay from './WinnerOverlay';
import { handTotal } from '@/lib/card-games/blackjack-engine';

interface BlackjackTableProps {
  gameState: FilteredBlackjackState;
  playerId: string;
  onAction: (type: BlackjackActionType) => void;
}

function HandValue({ total, soft }: { total: number; soft: boolean }) {
  return (
    <span className="text-sm font-bold">
      {soft && total < 21 ? `${total - 10}/${total}` : total}
    </span>
  );
}

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return null;
  const config: Record<string, { text: string; color: string }> = {
    blackjack: { text: 'BLACKJACK!', color: 'bg-yellow-500 text-black' },
    win: { text: 'WIN', color: 'bg-emerald-500 text-white' },
    lose: { text: 'LOSE', color: 'bg-red-500 text-white' },
    push: { text: 'PUSH', color: 'bg-gray-500 text-white' },
  };
  const cfg = config[result];
  if (!cfg) return null;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${cfg.color}`}>
      {cfg.text}
    </span>
  );
}

export default function BlackjackTable({ gameState, playerId, onAction }: BlackjackTableProps) {
  const { dealerCards, dealerTotal, players, activePlayerIndex, handNumber, phase } = gameState;

  // Compute dealer display total from visible cards
  const visibleDealerCards = dealerCards.filter((c): c is NonNullable<typeof c> => c !== null);
  const dealerDisplay = gameState.dealerTotal !== null
    ? handTotal(visibleDealerCards)
    : handTotal(visibleDealerCards.slice(0, 1));

  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-emerald-800 to-green-900 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden min-h-[400px]">
        <WinnerOverlay winners={gameState.winners} />

        {/* Table info */}
        <div className="absolute top-3 left-3 flex gap-2 text-xs">
          <span className="bg-black/30 text-white px-2 py-1 rounded">Hand #{handNumber}</span>
          <span className="bg-black/30 text-white px-2 py-1 rounded capitalize">Blackjack</span>
        </div>

        {/* Dealer area */}
        <div className="flex flex-col items-center gap-2 mb-6 pt-8">
          <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">Dealer</div>
          <div className="flex gap-1.5">
            {dealerCards.map((card, i) => (
              <CardComponent key={i} card={card} faceDown={card === null} />
            ))}
          </div>
          <div className="bg-black/40 text-white px-3 py-1 rounded-full text-sm font-bold">
            {dealerTotal !== null ? (
              <HandValue total={dealerDisplay.total} soft={dealerDisplay.soft} />
            ) : (
              <HandValue total={dealerDisplay.total} soft={dealerDisplay.soft} />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 my-4" />

        {/* Player hands */}
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          {players.map((player, pIdx) => (
            <div
              key={player.id}
              className={`bg-black/20 rounded-xl p-3 min-w-[160px] ${
                phase === 'playing' && pIdx === activePlayerIndex
                  ? 'ring-2 ring-yellow-400'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${player.id === playerId ? 'text-yellow-300' : 'text-white'}`}>
                  {player.name}
                  {player.id === playerId && <span className="text-xs ml-1">(You)</span>}
                </span>
                <span className="text-xs text-white/70">{player.chips} chips</span>
              </div>

              {player.hands.map((hand, hIdx) => {
                const ht = handTotal(hand.cards);
                const isActiveHand = phase === 'playing' && pIdx === activePlayerIndex && hIdx === player.activeHandIndex;
                return (
                  <div
                    key={hIdx}
                    className={`mb-2 ${player.hands.length > 1 ? 'p-2 rounded-lg' : ''} ${
                      isActiveHand ? 'bg-white/10' : ''
                    }`}
                  >
                    {player.hands.length > 1 && (
                      <div className="text-xs text-white/60 mb-1">Hand {hIdx + 1}</div>
                    )}
                    <div className="flex gap-1 mb-1">
                      {hand.cards.map((card, cIdx) => (
                        <CardComponent key={cIdx} card={card} small />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs">
                        <HandValue total={ht.total} soft={ht.soft} />
                      </span>
                      <span className="text-yellow-300 text-xs">Bet: {hand.bet}</span>
                      <ResultBadge result={hand.result} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Controls */}
        {gameState.validActions.length > 0 && (
          <div className="mt-2">
            <BlackjackControls validActions={gameState.validActions} onAction={onAction} />
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

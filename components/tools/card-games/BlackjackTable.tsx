'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FilteredBlackjackState, BlackjackActionType } from '@/lib/card-games/types';
import CardComponent from './CardComponent';
import BlackjackControls from './BlackjackControls';
import GameLog from './GameLog';
import WinnerOverlay from './WinnerOverlay';
import { handTotal } from '@/lib/card-games/blackjack-engine';
import { WINNER_OVERLAY_DURATION } from '@/lib/card-games/constants';

interface BlackjackTableProps {
  gameState: FilteredBlackjackState;
  playerId: string;
  onAction: (type: BlackjackActionType) => void;
  onPlaceBet: (amount: number) => void;
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

function BetSelector({ currentBet, maxBet, onPlaceBet }: { currentBet: number; maxBet: number; onPlaceBet: (amount: number) => void }) {
  const [bet, setBet] = useState(currentBet);

  useEffect(() => {
    setBet(prev => Math.min(prev, maxBet));
  }, [maxBet]);

  const adjustBet = (delta: number) => {
    setBet(prev => Math.max(1, Math.min(maxBet, prev + delta)));
  };

  const presets = [10, 25, 50, 100].filter(v => v <= maxBet);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="text-white/80 text-sm font-semibold uppercase tracking-wider">Place Your Bet</div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => adjustBet(-5)}
          className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg flex items-center justify-center transition-colors"
          disabled={bet <= 1}
        >
          -
        </button>
        <div className="bg-black/40 text-yellow-300 px-5 py-2 rounded-lg text-2xl font-bold min-w-[80px] text-center">
          {bet}
        </div>
        <button
          onClick={() => adjustBet(5)}
          className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg flex items-center justify-center transition-colors"
          disabled={bet >= maxBet}
        >
          +
        </button>
      </div>

      {presets.length > 0 && (
        <div className="flex gap-2">
          {presets.map(v => (
            <button
              key={v}
              onClick={() => setBet(v)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                bet === v
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => onPlaceBet(bet)}
        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg text-sm shadow-lg transition-colors mt-1"
      >
        Deal
      </button>
    </div>
  );
}

// Build the dealing order: player1-card1, player2-card1, dealer-card1, player1-card2, player2-card2, dealer-card2
function buildDealOrder(playerCount: number, dealerCardCount: number): { type: 'player' | 'dealer'; playerIdx: number; cardIdx: number }[] {
  const order: { type: 'player' | 'dealer'; playerIdx: number; cardIdx: number }[] = [];
  const rounds = Math.max(2, dealerCardCount);
  for (let round = 0; round < rounds; round++) {
    for (let p = 0; p < playerCount; p++) {
      order.push({ type: 'player', playerIdx: p, cardIdx: round });
    }
    if (round < dealerCardCount) {
      order.push({ type: 'dealer', playerIdx: -1, cardIdx: round });
    }
  }
  return order;
}

const DEAL_CARD_INTERVAL = 250;

export default function BlackjackTable({ gameState, playerId, onAction, onPlaceBet }: BlackjackTableProps) {
  const { dealerCards, dealerTotal, players, activePlayerIndex, handNumber, phase } = gameState;

  // --- Dealing animation state ---
  const [revealedCards, setRevealedCards] = useState(0);
  const [isDealing, setIsDealing] = useState(false);
  const prevHandNumberRef = useRef(handNumber);
  // Track card counts for detecting hits during play
  const prevCardCountsRef = useRef<string>('');
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());

  const totalInitialCards = players.reduce((sum, p) => sum + p.hands.reduce((s, h) => s + h.cards.length, 0), 0) + dealerCards.length;
  const dealOrder = buildDealOrder(players.length, dealerCards.length);
  const initialDealSize = dealOrder.length;

  // When hand number changes, start dealing animation
  useEffect(() => {
    if (handNumber !== prevHandNumberRef.current && gameState.handInProgress) {
      prevHandNumberRef.current = handNumber;
      setRevealedCards(0);
      setIsDealing(true);
      setAnimatingCards(new Set());
    }
  }, [handNumber, gameState.handInProgress]);

  // Staggered reveal interval
  useEffect(() => {
    if (!isDealing) return;

    const timer = setInterval(() => {
      setRevealedCards(prev => {
        const next = prev + 1;
        if (next >= initialDealSize) {
          setIsDealing(false);
          clearInterval(timer);
          return initialDealSize;
        }
        return next;
      });
    }, DEAL_CARD_INTERVAL);

    return () => clearInterval(timer);
  }, [isDealing, initialDealSize]);

  // Detect new cards added during play (hit/double) - animate them
  useEffect(() => {
    if (isDealing) return; // Don't track during initial deal

    const currentCounts = players.map(p => p.hands.map(h => h.cards.length).join(',')).join('|') + '|' + dealerCards.length;
    if (prevCardCountsRef.current && prevCardCountsRef.current !== currentCounts) {
      // Find new cards and animate them
      const newAnimating = new Set<string>();
      players.forEach((p, pIdx) => {
        p.hands.forEach((h, hIdx) => {
          const lastCardIdx = h.cards.length - 1;
          if (lastCardIdx >= 0) {
            newAnimating.add(`p${pIdx}-h${hIdx}-c${lastCardIdx}`);
          }
        });
      });
      const lastDealerIdx = dealerCards.length - 1;
      if (lastDealerIdx >= 0) {
        newAnimating.add(`d-${lastDealerIdx}`);
      }
      setAnimatingCards(newAnimating);
      // Clear animation flags after animation completes
      const clearTimer = setTimeout(() => setAnimatingCards(new Set()), 400);
      return () => clearTimeout(clearTimer);
    }
    prevCardCountsRef.current = currentCounts;
  }, [players, dealerCards, isDealing]);

  // Compute what's visible during dealing
  const isCardRevealed = useCallback((type: 'player' | 'dealer', playerIdx: number, cardIdx: number): boolean => {
    if (!isDealing) return true;
    const idx = dealOrder.findIndex(d => d.type === type && d.playerIdx === playerIdx && d.cardIdx === cardIdx);
    return idx !== -1 && idx < revealedCards;
  }, [isDealing, dealOrder, revealedCards]);

  // Winner overlay timing
  const [showWinner, setShowWinner] = useState(false);
  const winnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gameState.winners && !gameState.handInProgress) {
      setShowWinner(true);
      if (winnerTimerRef.current) clearTimeout(winnerTimerRef.current);
      winnerTimerRef.current = setTimeout(() => setShowWinner(false), WINNER_OVERLAY_DURATION);
    } else {
      setShowWinner(false);
    }
    return () => {
      if (winnerTimerRef.current) clearTimeout(winnerTimerRef.current);
    };
  }, [gameState.winners, gameState.handInProgress, handNumber]);

  // Compute dealer display total from visible cards
  const visibleDealerCards = dealerCards.filter((c): c is NonNullable<typeof c> => c !== null);
  const dealerDisplay = gameState.dealerTotal !== null
    ? handTotal(visibleDealerCards)
    : handTotal(visibleDealerCards.slice(0, 1));

  // Show bet selector when hand is not in progress and winner overlay has faded
  const showBetSelector = !gameState.handInProgress && !showWinner && !isDealing;
  const currentPlayer = players.find(p => p.id === playerId);

  // Determine if we should show no eligible message
  const playerChips = currentPlayer?.chips ?? 0;
  const noChips = playerChips < 1;

  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-emerald-800 to-green-900 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden min-h-[400px]">
        {showWinner && <WinnerOverlay winners={gameState.winners} />}

        {/* Table info */}
        <div className="absolute top-3 left-3 flex gap-2 text-xs">
          <span className="bg-black/30 text-white px-2 py-1 rounded">Hand #{handNumber}</span>
          <span className="bg-black/30 text-white px-2 py-1 rounded capitalize">Blackjack</span>
        </div>

        {/* Dealer area */}
        <div className="flex flex-col items-center gap-2 mb-6 pt-8">
          <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">Dealer</div>
          <div className="flex gap-1.5">
            {dealerCards.map((card, i) => {
              const revealed = isCardRevealed('dealer', -1, i);
              const shouldAnimate = (isDealing && revealed) || animatingCards.has(`d-${i}`);
              if (!revealed) {
                return <CardComponent key={i} card={null} faceDown />;
              }
              return <CardComponent key={i} card={card} faceDown={card === null} animate={shouldAnimate} />;
            })}
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
                      {hand.cards.map((card, cIdx) => {
                        const revealed = isCardRevealed('player', pIdx, cIdx);
                        const shouldAnimate = (isDealing && revealed) || animatingCards.has(`p${pIdx}-h${hIdx}-c${cIdx}`);
                        if (!revealed) {
                          return <CardComponent key={cIdx} card={null} faceDown small />;
                        }
                        return <CardComponent key={cIdx} card={card} small animate={shouldAnimate} />;
                      })}
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

        {/* Bet selector between hands */}
        {showBetSelector && !noChips && (
          <BetSelector
            currentBet={Math.min(gameState.betAmount, playerChips)}
            maxBet={playerChips}
            onPlaceBet={onPlaceBet}
          />
        )}

        {showBetSelector && noChips && (
          <div className="text-center py-4">
            <span className="text-white/60 text-sm">No chips remaining</span>
          </div>
        )}

        {/* Controls - suppressed during dealing animation */}
        {!isDealing && !showBetSelector && gameState.validActions.length > 0 && (
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

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { GameState, Player, PokerAction, RoomConfig, FilteredGameState } from '@/lib/card-games/types';
import { initializeHand, processAction, startNextHand } from '@/lib/card-games/poker-engine';
import { filterStateForAllPlayers } from '@/lib/card-games/state-filter';
import { WINNER_OVERLAY_DURATION } from '@/lib/card-games/constants';

interface UsePokerGameOptions {
  isHost: boolean;
  roomCode: string;
  config: RoomConfig;
  players: { id: string; name: string }[];
  onBroadcast: (playerStates: Record<string, FilteredGameState>) => void;
}

export function usePokerGame({ isHost, roomCode, config, players, onBroadcast }: UsePokerGameOptions) {
  const gameStateRef = useRef<GameState | null>(null);
  const nextHandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const broadcast = useCallback((state: GameState) => {
    const playerStates = filterStateForAllPlayers(state);
    onBroadcast(playerStates);
  }, [onBroadcast]);

  const startGame = useCallback(() => {
    if (!isHost) return;

    const gamePlayers: Player[] = players.map(p => ({
      id: p.id,
      name: p.name,
      chips: config.startingChips,
      holeCards: [],
      totalBetThisRound: 0,
      totalBetThisHand: 0,
      folded: false,
      allIn: false,
      sittingOut: false,
      connected: true,
    }));

    const state = initializeHand(gamePlayers, config, -1);
    gameStateRef.current = state;
    broadcast(state);
  }, [isHost, players, config, broadcast]);

  const handleAction = useCallback((action: PokerAction) => {
    if (!isHost || !gameStateRef.current) return;

    const newState = processAction(gameStateRef.current, action);
    gameStateRef.current = newState;
    broadcast(newState);

    // If hand ended, auto-start next hand after delay
    if (!newState.handInProgress && newState.players.filter(p => p.chips > 0).length >= 2) {
      if (nextHandTimerRef.current) clearTimeout(nextHandTimerRef.current);
      nextHandTimerRef.current = setTimeout(() => {
        if (gameStateRef.current && !gameStateRef.current.handInProgress) {
          const nextState = startNextHand(gameStateRef.current, config);
          gameStateRef.current = nextState;
          broadcast(nextState);
        }
      }, WINNER_OVERLAY_DURATION);
    }
  }, [isHost, config, broadcast]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (nextHandTimerRef.current) clearTimeout(nextHandTimerRef.current);
    };
  }, []);

  return {
    startGame,
    handleAction,
    getState: () => gameStateRef.current,
  };
}

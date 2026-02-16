'use client';

import { useCallback, useRef, useEffect } from 'react';
import { BlackjackGameState, BlackjackPlayer, BlackjackAction, RoomConfig, FilteredAnyGameState } from '@/lib/card-games/types';
import { initializeBlackjackHand, processBlackjackAction, startNextBlackjackHand } from '@/lib/card-games/blackjack-engine';
import { filterBlackjackStateForAllPlayers } from '@/lib/card-games/state-filter';
import { WINNER_OVERLAY_DURATION } from '@/lib/card-games/constants';

interface UseBlackjackGameOptions {
  isHost: boolean;
  roomCode: string;
  config: RoomConfig;
  players: { id: string; name: string }[];
  onBroadcast: (playerStates: Record<string, FilteredAnyGameState>) => void;
}

export function useBlackjackGame({ isHost, roomCode, config, players, onBroadcast }: UseBlackjackGameOptions) {
  const gameStateRef = useRef<BlackjackGameState | null>(null);
  const nextHandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const broadcast = useCallback((state: BlackjackGameState) => {
    const playerStates = filterBlackjackStateForAllPlayers(state);
    onBroadcast(playerStates);
  }, [onBroadcast]);

  const startGame = useCallback(() => {
    if (!isHost) return;

    const gamePlayers: BlackjackPlayer[] = players.map(p => ({
      id: p.id,
      name: p.name,
      chips: config.startingChips,
      hands: [],
      activeHandIndex: 0,
      connected: true,
    }));

    const state = initializeBlackjackHand(gamePlayers, config.betAmount, 0);
    gameStateRef.current = state;
    broadcast(state);
  }, [isHost, players, config, broadcast]);

  const handleAction = useCallback((action: BlackjackAction) => {
    if (!isHost || !gameStateRef.current) return;

    const newState = processBlackjackAction(gameStateRef.current, action);
    gameStateRef.current = newState;
    broadcast(newState);

    // If hand ended, auto-start next hand after delay
    if (!newState.handInProgress) {
      const hasEligiblePlayers = newState.players.some(p => p.chips >= newState.betAmount);
      if (hasEligiblePlayers) {
        if (nextHandTimerRef.current) clearTimeout(nextHandTimerRef.current);
        nextHandTimerRef.current = setTimeout(() => {
          if (gameStateRef.current && !gameStateRef.current.handInProgress) {
            const nextState = startNextBlackjackHand(gameStateRef.current, config.betAmount);
            gameStateRef.current = nextState;
            broadcast(nextState);
          }
        }, WINNER_OVERLAY_DURATION);
      }
    }
  }, [isHost, config, broadcast]);

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

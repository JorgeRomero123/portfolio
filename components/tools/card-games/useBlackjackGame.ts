'use client';

import { useCallback, useRef, useEffect } from 'react';
import { BlackjackGameState, BlackjackPlayer, BlackjackAction, RoomConfig, FilteredAnyGameState } from '@/lib/card-games/types';
import { initializeBlackjackHand, processBlackjackAction, startNextBlackjackHand } from '@/lib/card-games/blackjack-engine';
import { filterBlackjackStateForAllPlayers } from '@/lib/card-games/state-filter';


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

  // Shared logic: after any state change that ends a hand, schedule winner overlay
  // but do NOT auto-start next hand — player must place bet via handlePlaceBet
  const broadcastAndHandleEnd = useCallback((state: BlackjackGameState) => {
    gameStateRef.current = state;
    broadcast(state);
  }, [broadcast]);

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
    broadcastAndHandleEnd(state);
  }, [isHost, players, config, broadcastAndHandleEnd]);

  const handleAction = useCallback((action: BlackjackAction) => {
    if (!isHost || !gameStateRef.current) return;

    const newState = processBlackjackAction(gameStateRef.current, action);
    broadcastAndHandleEnd(newState);
  }, [isHost, broadcastAndHandleEnd]);

  const handlePlaceBet = useCallback((betAmount: number) => {
    if (!isHost || !gameStateRef.current) return;

    // Clear any pending timer
    if (nextHandTimerRef.current) {
      clearTimeout(nextHandTimerRef.current);
      nextHandTimerRef.current = null;
    }

    const nextState = startNextBlackjackHand(gameStateRef.current, betAmount);
    broadcastAndHandleEnd(nextState);
  }, [isHost, broadcastAndHandleEnd]);

  useEffect(() => {
    return () => {
      if (nextHandTimerRef.current) clearTimeout(nextHandTimerRef.current);
    };
  }, []);

  return {
    startGame,
    handleAction,
    handlePlaceBet,
    getState: () => gameStateRef.current,
  };
}

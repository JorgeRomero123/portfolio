'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RoomConfig, FilteredGameState, FilteredAnyGameState, FilteredBlackjackState, PokerActionType, BlackjackActionType } from '@/lib/card-games/types';
import { DEFAULT_CONFIG, MIN_PLAYERS_TO_START, MIN_BLACKJACK_PLAYERS } from '@/lib/card-games/constants';
import Lobby, { generateRoomCode } from './Lobby';
import RoomWaiting from './RoomWaiting';
import PokerTable from './PokerTable';
import BlackjackTable from './BlackjackTable';
import { usePusher } from './usePusher';
import { usePokerGame } from './usePokerGame';
import { useBlackjackGame } from './useBlackjackGame';

type View = 'lobby' | 'waiting' | 'playing';

interface CardGamesProps {
  initialRoomCode?: string;
}

export default function CardGames({ initialRoomCode }: CardGamesProps) {
  const [view, setView] = useState<View>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [playerId] = useState(() => typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [config, setConfig] = useState<RoomConfig>(DEFAULT_CONFIG);
  const [hostGameState, setHostGameState] = useState<FilteredAnyGameState | null>(null);

  const pusher = usePusher({
    roomCode,
    playerId,
    playerName,
    enabled: view !== 'lobby',
  });

  const { members, gameState: pusherGameState, sendAction, isConnected } = pusher;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setOnAction = (pusher as any).setOnAction as ((cb: (event: string, data: Record<string, unknown>) => void) => void) | undefined;

  // The displayed game state: host uses locally computed state; non-host uses Pusher state
  const gameState = isHost ? hostGameState : pusherGameState;

  const pendingBroadcast = useRef<Record<string, FilteredAnyGameState> | null>(null);
  const broadcastInFlight = useRef(false);

  const flushBroadcast = useCallback(async (playerStates: Record<string, FilteredAnyGameState>) => {
    try {
      await fetch('/api/card-games/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: `presence-room-${roomCode}`,
          playerStates,
        }),
      });
    } catch (err) {
      console.error('Broadcast failed:', err);
    }
  }, [roomCode]);

  const handleBroadcast = useCallback(async (playerStates: Record<string, FilteredAnyGameState>) => {
    // Host updates its own local state immediately
    if (playerStates[playerId]) {
      setHostGameState(playerStates[playerId]);
    }

    // If a broadcast is already in flight, queue the latest state
    if (broadcastInFlight.current) {
      pendingBroadcast.current = playerStates;
      return;
    }

    broadcastInFlight.current = true;
    await flushBroadcast(playerStates);

    // Send any queued broadcast (latest state wins)
    while (pendingBroadcast.current) {
      const queued = pendingBroadcast.current;
      pendingBroadcast.current = null;
      await flushBroadcast(queued);
    }

    broadcastInFlight.current = false;
  }, [playerId, flushBroadcast]);

  // Poker-compatible broadcast wrapper
  const handlePokerBroadcast = useCallback((playerStates: Record<string, FilteredGameState>) => {
    handleBroadcast(playerStates);
  }, [handleBroadcast]);

  const poker = usePokerGame({
    isHost,
    roomCode,
    config,
    players: members.map(m => ({ id: m.id, name: m.info.name })),
    onBroadcast: handlePokerBroadcast,
  });

  const blackjack = useBlackjackGame({
    isHost,
    roomCode,
    config,
    players: members.map(m => ({ id: m.id, name: m.info.name })),
    onBroadcast: handleBroadcast,
  });

  // Determine effective game type
  const effectiveGameType = isHost
    ? config.gameType
    : (gameState?.gameType ?? config.gameType);

  // Host listens to client events via Pusher
  useEffect(() => {
    if (!isHost || !setOnAction) return;

    setOnAction((event: string, data: Record<string, unknown>) => {
      if (event === 'client-start-game') {
        if (config.gameType === 'blackjack') {
          blackjack.startGame();
        } else {
          poker.startGame();
        }
      } else if (event === 'client-action') {
        if (config.gameType === 'blackjack') {
          blackjack.handleAction({
            playerId: data.playerId as string,
            type: data.type as BlackjackActionType,
          });
        } else {
          poker.handleAction({
            playerId: data.playerId as string,
            type: data.type as PokerActionType,
            amount: data.amount as number | undefined,
          });
        }
      }
    });
  }, [isHost, setOnAction, poker, blackjack, config.gameType]);

  const handleCreateRoom = useCallback((name: string, roomConfig: RoomConfig) => {
    const code = generateRoomCode();
    setPlayerName(name);
    setRoomCode(code);
    setIsHost(true);
    setConfig(roomConfig);
    setView('waiting');
  }, []);

  const handleJoinRoom = useCallback((name: string, code: string) => {
    setPlayerName(name);
    setRoomCode(code);
    setIsHost(false);
    setView('waiting');
  }, []);

  const handleStartGame = useCallback(() => {
    if (isHost) {
      if (config.gameType === 'blackjack') {
        blackjack.startGame();
      } else {
        poker.startGame();
      }
      setView('playing');
      sendAction('client-start-game', { playerId });
    } else {
      sendAction('client-start-game', { playerId });
    }
  }, [isHost, config.gameType, poker, blackjack, sendAction, playerId]);

  // Non-host transitions to playing when they receive game state
  useEffect(() => {
    if (!isHost && pusherGameState && view === 'waiting') {
      setView('playing');
    }
  }, [isHost, pusherGameState, view]);

  const handlePokerAction = useCallback((type: PokerActionType, amount?: number) => {
    if (isHost) {
      poker.handleAction({ playerId, type, amount });
    } else {
      sendAction('client-action', { playerId, type, amount: amount ?? 0 });
    }
  }, [isHost, poker, sendAction, playerId]);

  const handleBlackjackAction = useCallback((type: BlackjackActionType) => {
    if (isHost) {
      blackjack.handleAction({ playerId, type });
    } else {
      sendAction('client-action', { playerId, type });
    }
  }, [isHost, blackjack, sendAction, playerId]);

  if (view === 'lobby') {
    return (
      <Lobby
        initialRoomCode={initialRoomCode}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  const minPlayers = effectiveGameType === 'blackjack' ? MIN_BLACKJACK_PLAYERS : MIN_PLAYERS_TO_START;

  if (view === 'waiting') {
    return (
      <div>
        {!isConnected && (
          <div className="max-w-md mx-auto mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 text-center">
              Connecting to room...
            </div>
          </div>
        )}
        <RoomWaiting
          roomCode={roomCode}
          members={members}
          isHost={isHost}
          onStartGame={handleStartGame}
          minPlayers={minPlayers}
        />
      </div>
    );
  }

  if (view === 'playing' && gameState) {
    if (gameState.gameType === 'blackjack') {
      return (
        <BlackjackTable
          gameState={gameState as FilteredBlackjackState}
          playerId={playerId}
          onAction={handleBlackjackAction}
        />
      );
    }

    return (
      <PokerTable
        gameState={gameState as FilteredGameState}
        playerId={playerId}
        onAction={handlePokerAction}
      />
    );
  }

  return (
    <div className="text-center text-gray-500 py-12">
      Loading game...
    </div>
  );
}

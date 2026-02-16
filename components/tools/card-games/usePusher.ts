'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import PusherClient from 'pusher-js';
import { FilteredAnyGameState } from '@/lib/card-games/types';

interface PusherMember {
  id: string;
  info: { name: string };
}

interface UsePusherOptions {
  roomCode: string;
  playerId: string;
  playerName: string;
  enabled: boolean;
}

interface UsePusherReturn {
  members: PusherMember[];
  gameState: FilteredAnyGameState | null;
  sendAction: (event: string, data: Record<string, unknown>) => void;
  isConnected: boolean;
}

export function usePusher({ roomCode, playerId, playerName, enabled }: UsePusherOptions): UsePusherReturn {
  const [members, setMembers] = useState<PusherMember[]>([]);
  const [gameState, setGameState] = useState<FilteredAnyGameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pusherRef = useRef<PusherClient | null>(null);
  const channelRef = useRef<ReturnType<PusherClient['subscribe']> | null>(null);
  const onActionRef = useRef<((event: string, data: Record<string, unknown>) => void) | null>(null);

  // Expose a callback for the host to listen to client events
  const setOnAction = useCallback((cb: (event: string, data: Record<string, unknown>) => void) => {
    onActionRef.current = cb;
  }, []);

  useEffect(() => {
    if (!enabled || !roomCode || !playerId) return;

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: '/api/card-games/pusher-auth',
        transport: 'ajax',
        headers: {
          'x-player-id': playerId,
          'x-player-name': playerName,
        },
      },
    });

    pusherRef.current = pusher;
    const channelName = `presence-room-${roomCode}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', (data: { members: Record<string, { name: string }> }) => {
      setIsConnected(true);
      const memberList = Object.entries(data.members).map(([id, info]) => ({ id, info }));
      setMembers(memberList);
    });

    channel.bind('pusher:member_added', (member: { id: string; info: { name: string } }) => {
      setMembers(prev => {
        if (prev.find(m => m.id === member.id)) return prev;
        return [...prev, { id: member.id, info: member.info }];
      });
    });

    channel.bind('pusher:member_removed', (member: { id: string }) => {
      setMembers(prev => prev.filter(m => m.id !== member.id));
    });

    // Listen for game state updates for this player
    channel.bind(`state-update-${playerId}`, (data: FilteredAnyGameState) => {
      setGameState(data);
    });

    // Listen for client events (actions, start-game)
    channel.bind('client-action', (data: Record<string, unknown>) => {
      onActionRef.current?.('client-action', data);
    });
    channel.bind('client-start-game', (data: Record<string, unknown>) => {
      onActionRef.current?.('client-start-game', data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
      pusherRef.current = null;
      channelRef.current = null;
      setIsConnected(false);
      setMembers([]);
      setGameState(null);
    };
  }, [enabled, roomCode, playerId, playerName]);

  const sendAction = useCallback((event: string, data: Record<string, unknown>) => {
    if (channelRef.current) {
      channelRef.current.trigger(event, data);
    }
  }, []);

  // Attach the setOnAction to the return so the host hook can register its callback
  return { members, gameState, sendAction, isConnected, setOnAction } as UsePusherReturn & { setOnAction: typeof setOnAction };
}

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { emptyState, type MapState } from './model';

/**
 * Keeps every page in a room (phone controls, laptop control, projector output) on the
 * same MapState. Two transports run side by side:
 * - BroadcastChannel: windows of the same browser, instant and offline.
 * - Supabase Realtime broadcast: other devices (phone -> laptop/projector).
 * Conflicts resolve last-writer-wins on `updatedAt`. Nothing is stored server-side:
 * each page keeps its own copy in localStorage and a newcomer asks the room for state.
 */

type Message = { type: 'state'; state: MapState } | { type: 'hello' };
export type SyncStatus = 'local' | 'connecting' | 'online';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const remoteSyncAvailable = Boolean(SUPABASE_URL && SUPABASE_KEY);

let client: SupabaseClient | null = null;
function supabase() {
  if (!remoteSyncAvailable) return null;
  client ??= createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 30 } },
  });
  return client;
}

const ROOM_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function randomRoom() {
  return Array.from({ length: 4 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join('');
}
export const normalizeRoom = (r: string) => r.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

export function getDeviceId() {
  try {
    let id = localStorage.getItem('pm-device');
    if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem('pm-device', id); }
    return id;
  } catch { return 'unknown'; }
}

const storageKey = (room: string) => `pm-state-${room}`;
export function loadState(room: string): MapState {
  try {
    const raw = localStorage.getItem(storageKey(room));
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch {}
  return emptyState();
}
function saveState(room: string, state: MapState) {
  try { localStorage.setItem(storageKey(room), JSON.stringify(state)); } catch {}
}

export interface Room {
  /** Broadcast a new state (call after stamping updatedAt). */
  send(state: MapState): void;
  close(): void;
}

export function joinRoom(
  room: string,
  getState: () => MapState,
  onRemoteState: (state: MapState) => void,
  onStatus: (status: SyncStatus) => void,
): Room {
  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`pm-${room}`) : null;
  let channel: RealtimeChannel | null = null;
  let subscribed = false;

  const handle = (msg: Message) => {
    if (msg.type === 'hello') {
      const s = getState();
      if (s.updatedAt > 0) post({ type: 'state', state: s }, true);
    } else if (msg.type === 'state') {
      const mine = getState();
      if (msg.state.updatedAt > mine.updatedAt) {
        saveState(room, msg.state);
        onRemoteState(msg.state);
      } else if (msg.state.updatedAt < mine.updatedAt) {
        // They're behind (e.g. answered our hello with an older layout): catch them up.
        post({ type: 'state', state: mine });
      }
    }
  };

  // Realtime is rate limited, so drags are throttled to ~20 messages a second
  // (the latest state always goes out last). BroadcastChannel gets every frame.
  let lastRemote = 0;
  let trailing: ReturnType<typeof setTimeout> | null = null;
  let queued: Message | null = null;
  const sendRemote = (msg: Message) => {
    if (!channel || !subscribed) return;
    queued = msg;
    const wait = 50 - (Date.now() - lastRemote);
    if (wait <= 0) flush();
    else trailing ??= setTimeout(flush, wait);
  };
  const flush = () => {
    trailing = null;
    if (!queued || !channel) return;
    lastRemote = Date.now();
    channel.send({ type: 'broadcast', event: 'msg', payload: queued });
    queued = null;
  };

  const post = (msg: Message, remoteOnly = false) => {
    if (!remoteOnly) bc?.postMessage(msg);
    sendRemote(msg);
  };

  if (bc) bc.onmessage = (e: MessageEvent<Message>) => handle(e.data);
  bc?.postMessage({ type: 'hello' } satisfies Message);

  const sb = supabase();
  if (sb) {
    onStatus('connecting');
    channel = sb.channel(`projection-mapper:${room}`, { config: { broadcast: { self: false } } });
    channel
      .on('broadcast', { event: 'msg' }, ({ payload }) => handle(payload as Message))
      .subscribe((status) => {
        subscribed = status === 'SUBSCRIBED';
        onStatus(subscribed ? 'online' : 'connecting');
        if (subscribed) channel!.send({ type: 'broadcast', event: 'msg', payload: { type: 'hello' } });
      });
  } else {
    onStatus('local');
  }

  return {
    send(state) {
      saveState(room, state);
      post({ type: 'state', state });
    },
    close() {
      if (trailing) clearTimeout(trailing);
      bc?.close();
      if (channel) sb?.removeChannel(channel);
    },
  };
}

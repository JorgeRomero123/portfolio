import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/card-games/pusher-server';
import { BroadcastPayload } from '@/lib/card-games/types';

export async function POST(request: NextRequest) {
  try {
    const { channel, playerStates } = (await request.json()) as BroadcastPayload;

    if (!channel || !playerStates) {
      return NextResponse.json({ error: 'Missing channel or playerStates' }, { status: 400 });
    }

    const pusher = getPusherServer();
    const promises = Object.entries(playerStates).map(([playerId, state]) =>
      pusher.trigger(channel, `state-update-${playerId}`, state)
    );

    await Promise.all(promises);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 });
  }
}

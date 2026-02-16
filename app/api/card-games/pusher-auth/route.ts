import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/card-games/pusher-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');
    const playerName = request.headers.get('x-player-name') || 'Anonymous';
    const playerId = request.headers.get('x-player-id');

    if (!socketId || !channelName || !playerId) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
    }

    const pusher = getPusherServer();
    const presenceData = {
      user_id: playerId,
      user_info: { name: playerName },
    };

    const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}

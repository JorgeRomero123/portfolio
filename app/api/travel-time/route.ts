import { NextRequest, NextResponse } from 'next/server';

interface LatLng {
  lat: number;
  lng: number;
}

interface DirectionsResult {
  origin: LatLng;
  duration: string;
  durationSeconds: number;
  distance: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const { origins, destination } = await request.json();

    if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      return NextResponse.json({ error: 'A valid destination is required' }, { status: 400 });
    }

    if (!Array.isArray(origins) || origins.length === 0) {
      return NextResponse.json({ error: 'At least one origin is required' }, { status: 400 });
    }

    for (const o of origins) {
      if (typeof o.lat !== 'number' || typeof o.lng !== 'number') {
        return NextResponse.json({ error: 'Each origin must have numeric lat and lng' }, { status: 400 });
      }
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfiguration: missing API key' }, { status: 500 });
    }

    const results: DirectionsResult[] = await Promise.all(
      origins.map(async (origin: LatLng) => {
        try {
          const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
          url.searchParams.set('origin', `${origin.lat},${origin.lng}`);
          url.searchParams.set('destination', `${destination.lat},${destination.lng}`);
          url.searchParams.set('key', apiKey);

          const res = await fetch(url.toString());
          const data = await res.json();

          if (data.status !== 'OK' || !data.routes?.length) {
            return { origin, duration: '', durationSeconds: 0, distance: '', status: data.status || 'NO_ROUTE' };
          }

          const leg = data.routes[0].legs[0];
          return {
            origin,
            duration: leg.duration.text,
            durationSeconds: leg.duration.value,
            distance: leg.distance.text,
            status: 'OK',
          };
        } catch {
          return { origin, duration: '', durationSeconds: 0, distance: '', status: 'ERROR' };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Travel time error:', error);
    const message = error instanceof Error ? error.message : 'Failed to calculate travel times';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

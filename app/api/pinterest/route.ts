import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  if (!url.match(/^https?:\/\/(www\.)?(pinterest\.\w+|pin\.it)\//)) {
    return NextResponse.json({ error: 'Not a valid Pinterest URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Pinterest returned status ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const images = extractImages(html);

    if (images.length === 0) {
      return NextResponse.json(
        {
          error:
            'No images found. The board may be private or Pinterest may have blocked the request.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Pinterest board. Please try again.' },
      { status: 500 }
    );
  }
}

function extractImages(html: string): string[] {
  const urls = new Set<string>();

  // Strategy 1: Parse __PWS_DATA__ embedded JSON
  const pwsMatch = html.match(
    /<script[^>]*id="__PWS_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (pwsMatch) {
    try {
      const data = JSON.parse(pwsMatch[1]);
      collectPinImages(data, urls);
    } catch {
      // JSON parse failed, fall through to regex
    }
  }

  // Strategy 2: Regex for original resolution pinimg URLs
  const origRegex =
    /https?:\/\/i\.pinimg\.com\/originals\/[^\s"'\\]+?\.(jpg|jpeg|png|gif|webp)/gi;
  for (const m of html.matchAll(origRegex)) {
    urls.add(m[0]);
  }

  // Strategy 3: Fall back to 736x resolution
  if (urls.size === 0) {
    const fallbackRegex =
      /https?:\/\/i\.pinimg\.com\/736x\/[^\s"'\\]+?\.(jpg|jpeg|png|gif|webp)/gi;
    for (const m of html.matchAll(fallbackRegex)) {
      urls.add(m[0]);
    }
  }

  return [...urls];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function collectPinImages(
  obj: any,
  urls: Set<string>,
  depth = 0
): void {
  if (!obj || typeof obj !== 'object' || depth > 30) return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectPinImages(item, urls, depth + 1);
    }
    return;
  }

  // Pin image structure: { images: { orig: { url: "..." } } }
  if (obj.images?.orig?.url && typeof obj.images.orig.url === 'string') {
    urls.add(obj.images.orig.url);
  }

  for (const value of Object.values(obj)) {
    if (typeof value === 'object') {
      collectPinImages(value, urls, depth + 1);
    }
  }
}

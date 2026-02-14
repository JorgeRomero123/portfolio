import { NextRequest, NextResponse } from 'next/server';

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  terreno: 'Terreno',
  oficina: 'Oficina',
  local_comercial: 'Local Comercial',
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const {
      propertyType,
      operationType,
      bedrooms,
      bathrooms,
      totalArea,
      builtArea,
      amenities,
      colonia,
      city,
      state,
    } = body;

    const typeLabel = PROPERTY_TYPE_LABELS[propertyType] || propertyType;
    const opLabel = operationType === 'renta' ? 'renta' : 'venta';

    const details: string[] = [];
    if (totalArea) details.push(`${totalArea} m² de terreno`);
    if (builtArea) details.push(`${builtArea} m² de construcción`);
    if (bedrooms) details.push(`${bedrooms} recámaras`);
    if (bathrooms) details.push(`${bathrooms} baños`);
    if (amenities?.length) details.push(`amenidades: ${amenities.join(', ')}`);

    const locationParts = [colonia, city, state].filter(Boolean);
    const location = locationParts.length > 0 ? ` en ${locationParts.join(', ')}` : '';

    const promptText = `Escribe una descripción atractiva y profesional en español para una ficha técnica inmobiliaria. La propiedad es una ${typeLabel} en ${opLabel}${location}. Características: ${details.join(', ') || 'no especificadas'}. La descripción debe ser de 3-4 oraciones, en tono profesional pero cálido, destacando los puntos fuertes. Si se incluyen fotos, describe lo que ves en ellas para enriquecer la descripción. Solo responde con la descripción, sin comillas ni encabezados.`;

    // Build message content: text + optional images
    const content: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    > = [];

    // Add up to 4 images if provided (keep token cost reasonable)
    const images: string[] = body.images || [];
    for (const dataUrl of images.slice(0, 4)) {
      const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (match) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: match[1], data: match[2] },
        });
      }
    }

    content.push({ type: 'text', text: promptText });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const result = await response.json();
    const description = result.content?.[0]?.text?.trim() || '';

    return NextResponse.json({ description });
  } catch (err) {
    console.error('Description generation error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

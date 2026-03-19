import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const { fieldLabel, currentValue, allFields } = await req.json();

    if (!fieldLabel) {
      return NextResponse.json(
        { error: 'Field label is required' },
        { status: 400 }
      );
    }

    // Build context from all fields that have values
    const contextLines = Object.entries(allFields as Record<string, string>)
      .filter(([, value]) => value && value.trim())
      .map(([label, value]) => `- ${label}: ${value}`)
      .join('\n');

    const systemPrompt = `Eres un consultor de desarrollo web experto en negocios mexicanos. Tu trabajo es ayudar a completar un formulario de intake para diseñar un sitio web.

Basándote en la información que ya tiene el cliente, genera una sugerencia útil, específica y concisa para el campo solicitado.

Reglas:
- Responde SOLO con la sugerencia, sin explicaciones ni preámbulos
- Si hay un valor parcial en el campo, mejóralo y complétalo
- Si no hay valor, genera una sugerencia basada en el contexto de los otros campos
- Sé específico al negocio del cliente, no genérico
- Responde en español
- Máximo 2-3 oraciones para campos de texto, o una lista corta si aplica`;

    const userMessage = contextLines
      ? `Información del cliente hasta ahora:\n${contextLines}\n\n${currentValue ? `Valor actual del campo "${fieldLabel}": ${currentValue}\nMejora y completa este valor.` : `Genera una sugerencia para el campo: "${fieldLabel}"`}`
      : `No hay información previa del cliente. Genera un ejemplo realista para el campo: "${fieldLabel}"`;

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
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate suggestion' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const suggestion = data.content?.[0]?.text || '';

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Intake suggest error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}

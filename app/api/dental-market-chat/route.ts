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
    const { question, context, history } = await req.json();

    if (!question || !context) {
      return NextResponse.json(
        { error: 'Se requiere pregunta y contexto' },
        { status: 400 }
      );
    }

    const messages = [
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: question },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `Eres un asistente experto en el mercado dental mexicano. Responde preguntas basándote ÚNICAMENTE en los datos del estudio de mercado proporcionado. Si la información no está en los datos, dilo claramente. Responde siempre en español, de forma concisa y profesional. Usa datos específicos y cifras cuando estén disponibles. NUNCA uses formato markdown (ni negritas, cursivas, encabezados, viñetas con *, ni bloques de código). Responde en texto plano simple, usando guiones (-) para listas si es necesario.

DATOS DEL ESTUDIO DE MERCADO:
${context}`,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json(
        { error: 'Error al consultar la IA' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const answer = data.content[0]?.text || 'No se pudo generar una respuesta.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

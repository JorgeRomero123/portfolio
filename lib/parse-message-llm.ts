import { parseMessage as parseMessageRegex } from './parse-message';

type Parsed = { copias: number; tipo: 'color' | 'bn' };

const SYSTEM_PROMPT = `Eres un parser para una papelería en México. Recibes mensajes de clientes por WhatsApp pidiendo impresiones y extraes dos datos: cuántas copias quieren y si las quieren a color o en blanco y negro.

Reglas:
- "copias" es un entero >= 1. Si no se menciona cantidad, devuelve 1.
- "tipo" es "color" o "bn". Por defecto, "bn".
- Interpreta lenguaje natural mexicano con errores de ortografía, abreviaciones y mezclas. Ejemplos:
  - "3 copias a color" → {copias:3, tipo:"color"}
  - "imprime 5" → {copias:5, tipo:"bn"}
  - "porfa a color dos" → {copias:2, tipo:"color"}
  - "byn x4" → {copias:4, tipo:"bn"}
  - "" → {copias:1, tipo:"bn"}
  - "una" → {copias:1, tipo:"bn"}

Responde SOLO con un objeto JSON válido con las llaves "copias" y "tipo". Sin explicación, sin markdown, sin código.`;

export async function parseMessage(message: string): Promise<Parsed> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return parseMessageRegex(message);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message || '(mensaje vacío)' }],
      }),
    });

    if (!response.ok) throw new Error(`anthropic ${response.status}`);

    const json = await response.json();
    const text: string = json?.content?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no json in response');

    const parsed = JSON.parse(match[0]);
    const copias = Number.isInteger(parsed.copias) && parsed.copias > 0 ? parsed.copias : 1;
    const tipo: 'color' | 'bn' = parsed.tipo === 'color' ? 'color' : 'bn';

    return { copias, tipo };
  } catch (err) {
    console.error('parseMessageLLM fallback to regex:', err);
    return parseMessageRegex(message);
  }
}

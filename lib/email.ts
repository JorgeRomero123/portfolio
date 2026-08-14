/**
 * Envío de correo vía la API SMTP de SendPulse.
 * Se usa fetch directo para no cargar otro SDK en el bundle del servidor.
 *
 * SendPulse pide dos pasos: primero un token OAuth (client_credentials, vive
 * una hora) y luego el envío. El HTML va en base64, no en texto plano.
 */

const OAUTH_URL = 'https://api.sendpulse.com/oauth/access_token';
const SMTP_URL = 'https://api.sendpulse.com/smtp/emails';

type EnviarCorreo = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export class EmailNoConfigurado extends Error {}

// El token vive 1 hora; en Fluid Compute la instancia se reusa entre
// invocaciones, así que vale la pena guardarlo en memoria.
let cache: { token: string; expira: number } | null = null;

async function obtenerToken(): Promise<string> {
  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new EmailNoConfigurado('Faltan SENDPULSE_CLIENT_ID y SENDPULSE_CLIENT_SECRET');
  }

  // Se renueva 60 s antes de que expire, para no mandar con un token ya muerto.
  if (cache && Date.now() < cache.expira - 60_000) return cache.token;

  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const cuerpo = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    message?: string;
    error_description?: string;
  };

  if (!res.ok || !cuerpo.access_token) {
    const detalle = cuerpo.error_description ?? cuerpo.message ?? `HTTP ${res.status}`;
    throw new Error(`SendPulse no dio token: ${detalle}`);
  }

  cache = {
    token: cuerpo.access_token,
    expira: Date.now() + (cuerpo.expires_in ?? 3600) * 1000,
  };

  return cache.token;
}

/** Parte "Nombre <correo@dominio.com>" en sus dos partes. */
function parseRemitente(valor: string): { name: string; email: string } {
  const m = valor.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1] || 'Quehaceres', email: m[2].trim() };
  return { name: 'Quehaceres', email: valor.trim() };
}

/**
 * Remitente, en dos formatos: EMAIL_FROM="Nombre <correo>" o el par
 * SENDPULSE_FROM_EMAIL / SENDPULSE_FROM_NAME que usa la propia consola.
 * Tiene que ser un remitente verificado en SendPulse.
 */
function remitente(): { name: string; email: string } {
  const combinado = process.env.EMAIL_FROM?.trim();
  // Se ignora si quedó con el valor de ejemplo.
  if (combinado && !combinado.includes('tudominio.com')) return parseRemitente(combinado);

  const email = process.env.SENDPULSE_FROM_EMAIL?.trim();
  if (email) return { name: process.env.SENDPULSE_FROM_NAME?.trim() || 'Quehaceres', email };

  throw new EmailNoConfigurado('Falta EMAIL_FROM (o SENDPULSE_FROM_EMAIL)');
}

export async function enviarCorreo({ to, subject, html, text }: EnviarCorreo): Promise<string> {
  const desde = remitente();
  const token = await obtenerToken();
  const destinatarios = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));

  const res = await fetch(SMTP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: {
        subject,
        // La API exige el HTML en base64.
        html: Buffer.from(html, 'utf8').toString('base64'),
        text: text ?? '',
        from: desde,
        to: destinatarios,
      },
    }),
  });

  const cuerpo = (await res.json().catch(() => ({}))) as {
    result?: boolean;
    id?: string | number;
    is_error?: boolean;
    message?: string;
    error_code?: number;
  };

  if (!res.ok || cuerpo.is_error || cuerpo.result === false) {
    const detalle = cuerpo.message ?? `HTTP ${res.status}`;
    throw new Error(`SendPulse rechazó el envío: ${detalle}`);
  }

  return String(cuerpo.id ?? '');
}

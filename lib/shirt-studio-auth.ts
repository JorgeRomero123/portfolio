// Password gate for /shirt-studio (personal iPad drawing app served from public/shirt-studio).
// The password is a casual lock. The cookie is signed with AUTH_SECRET so it can't be
// forged from this (public) source alone.
export const SHIRT_STUDIO_PASSWORD = '1234';
export const SHIRT_STUDIO_COOKIE = 'ss_auth';
export const SHIRT_STUDIO_HOME = '/shirt-studio/index.html';

export async function shirtStudioToken(): Promise<string> {
  const data = new TextEncoder().encode(`shirt-studio:${SHIRT_STUDIO_PASSWORD}:${process.env.AUTH_SECRET ?? ''}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function shirtStudioLoginPage(error: boolean): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Shirt Studio">
<meta name="theme-color" content="#121315">
<title>Shirt Studio</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #121315; color: #ededea;
    font: 16px/1.4 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  body { display: grid; place-items: center; padding: 24px; }
  form { width: min(340px, 100%); text-align: center; }
  h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -0.02em; }
  p { color: #9a9b9f; margin: 0 0 24px; }
  input { width: 100%; height: 56px; border-radius: 14px; border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.05); color: inherit; font-size: 24px; text-align: center; letter-spacing: .3em; outline: none; }
  input:focus { border-color: rgba(255,255,255,.4); }
  button { width: 100%; height: 52px; margin-top: 12px; border: 0; border-radius: 14px; background: #ededea; color: #121315;
    font: inherit; font-weight: 600; cursor: pointer; }
  .err { color: #ff6a55; margin: 12px 0 0; min-height: 22px; }
</style>
</head><body>
<form method="post" action="/api/shirt-studio/login">
  <h1>Shirt Studio</h1>
  <p>Enter the password to open the app.</p>
  <input name="password" type="password" inputmode="numeric" autocomplete="current-password" autofocus aria-label="Password">
  <button type="submit">Open</button>
  <p class="err">${error ? 'Wrong password. Try again.' : ''}</p>
</form>
</body></html>`;
}

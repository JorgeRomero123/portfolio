// Formato canónico de archivo_url en la DB: host + path, sin scheme.
// Ej: "cdn.jorgeromeroromanis.com/print/<uuid>.<ext>"
// Al leer desde la API se prepende "https://" para que el dashboard y el
// cliente local siempre reciban URLs completamente formadas.

export function toStorageFormat(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/+/g, '/');
}

export function toPublicUrl(stored: string): string {
  if (!stored) return stored;
  if (/^https?:\/\//.test(stored)) return stored;
  return `https://${stored}`;
}

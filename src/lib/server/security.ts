import type { APIContext } from 'astro';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function safeNext(value: unknown, fallback = '/mi-solicitud'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n\u0000-\u001f]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, 'https://local.invalid');
    return parsed.origin === 'https://local.invalid' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch { return fallback; }
}

export function assertSameOrigin(context: Pick<APIContext, 'request' | 'url'>) {
  const origin = context.request.headers.get('origin');
  if (!origin || origin !== context.url.origin) throw new HttpError(403, 'Origen no permitido.');
  if (Number(context.request.headers.get('content-length') || 0) > 11_000_000) throw new HttpError(413, 'El archivo es demasiado grande.');
}

export async function formData(context: Pick<APIContext, 'request' | 'url'>): Promise<FormData> {
  assertSameOrigin(context);
  if (!/^(application\/x-www-form-urlencoded|multipart\/form-data)/i.test(context.request.headers.get('content-type') || '')) throw new HttpError(415, 'Formulario no válido.');
  const reader = context.request.body?.getReader();
  if (!reader) throw new HttpError(400,'Formulario vacío.');
  const chunks: ArrayBuffer[] = [];
  let size = 0;
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 11_000_000) { await reader.cancel(); throw new HttpError(413,'El archivo es demasiado grande.'); }
    chunks.push(new Uint8Array(value).buffer);
  }
  return new Response(new Blob(chunks),{headers:{'Content-Type':context.request.headers.get('content-type')!}}).formData();
}

export function text(data: FormData, key: string, max = 5000): string {
  const value = data.get(key);
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) throw new HttpError(400, 'Revisa los datos del formulario.');
  return value.trim();
}
export function optionalText(data: FormData, key: string, max = 5000): string {
  return data.has(key) ? text(data, key, max) : '';
}
export function emailAddress(value: string): string {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new HttpError(400, 'Correo electrónico no válido.');
  return email;
}
export function uuid(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new HttpError(400, 'Identificador no válido.');
  return value;
}
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
}
export function redirectTo(path: string, state: string, value: string): Response {
  const target = new URL(safeNext(path, '/'), 'https://local.invalid');
  target.searchParams.set(state, value);
  return new Response(null, { status: 303, headers: { Location: `${target.pathname}${target.search}${target.hash}`, 'Cache-Control': 'no-store' } });
}
export function errorResponse(error: unknown): Response {
  const status = error instanceof HttpError ? error.status : 503;
  return new Response(status === 503 ? 'El servicio no está disponible en este momento. Inténtalo más tarde.' : error instanceof Error ? error.message : 'No se pudo completar la operación.', {status, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
}

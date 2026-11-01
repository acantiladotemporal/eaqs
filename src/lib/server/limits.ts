import type { APIContext } from 'astro';
import { createHash } from 'node:crypto';
import { adminClient } from './auth';
import { HttpError } from './security';

export async function rateLimit(key: string, limit: number, seconds: number) {
  const hashed = createHash('sha256').update(key).digest('hex');
  const {data,error} = await adminClient().rpc('rate_limit',{p_key:hashed,p_limit:limit,p_window_seconds:seconds});
  if (error) throw new HttpError(503,'Servicio temporalmente no disponible.');
  if (data !== true) throw new HttpError(429,'Espera antes de volver a intentarlo.');
}
export async function limitPublicRequest(context: APIContext, action: string, email: string) {
  // clientAddress is supplied by the adapter, never by a user-controlled form field.
  let address = 'unknown';
  try { address = context.clientAddress; } catch { /* Global and email limits still apply. */ }
  await rateLimit(`${action}:email:${email}`,3,3600);
  await rateLimit(`${action}:address:${address}`,20,3600);
  await rateLimit(`${action}:global`,90,86400);
}

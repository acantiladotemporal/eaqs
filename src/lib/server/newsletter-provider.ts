import { Webhook } from 'svix';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient } from './auth';
import { env } from './config';
import { emailAddress, HttpError } from './security';

export interface ProviderContact { id: string; email: string; unsubscribed: boolean; }
export type SubscriberState = 'pending' | 'confirmed' | 'unsubscribed';
export interface ContactsProvider {
  get(email: string): Promise<ProviderContact | null>;
  create(email: string): Promise<ProviderContact>;
  unsubscribe(contact: ProviderContact): Promise<void>;
}
export interface SubscriberRecord {
  id: string; email: string; status: SubscriberState; subscription_version: string; provider_contact_id?: string | null; unsubscribed_at?: string | null;
}
export type ContactSyncResult = { outcome: 'synced' | 'remote_unsubscribed' | 'pending'; contactId?: string };

/** Only a server-owned API key is accepted. The destination is fixed, never user supplied. */
export class ResendContactsProvider implements ContactsProvider {
  constructor(private apiKey: string, private fetcher: typeof fetch = fetch) {}
  private async request(method: string, path: string, body?: object): Promise<Response> {
    const response = await this.fetcher(`https://api.resend.com${path}`, {
      method, headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok && response.status !== 404 && response.status !== 409) {
      throw new HttpError(503, `Sincronización de contactos: HTTP ${response.status}.`);
    }
    return response;
  }
  async get(email: string): Promise<ProviderContact | null> {
    const normalized = emailAddress(email);
    const response = await this.request('GET', `/contacts/${encodeURIComponent(normalized)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new HttpError(503, 'No se pudo consultar el contacto.');
    const value = await response.json() as Partial<ProviderContact>;
    if (typeof value.id !== 'string' || !value.id || typeof value.unsubscribed !== 'boolean' || value.email?.toLowerCase() !== normalized) throw new HttpError(503, 'Respuesta de contactos no válida.');
    return { id: value.id, email: normalized, unsubscribed: value.unsubscribed };
  }
  async create(email: string): Promise<ProviderContact> {
    const normalized = emailAddress(email);
    // Only used after double opt-in and a GET that did not find an existing contact.
    const response = await this.request('POST', '/contacts', { email: normalized });
    if (!response.ok && response.status !== 409) throw new HttpError(503, 'No se pudo crear el contacto.');
    const contact = await this.get(normalized);
    if (!contact) throw new HttpError(503, 'No se pudo verificar el contacto creado.');
    return contact;
  }
  async unsubscribe(contact: ProviderContact): Promise<void> {
    const response = await this.request('PATCH', `/contacts/${encodeURIComponent(contact.id)}`, { unsubscribed: true });
    // An already removed contact also cannot receive marketing from that record.
    if (!response.ok && response.status !== 404) throw new HttpError(503, 'No se pudo actualizar la baja.');
  }
}

/** A remote unsubscribe is never reversed by a local retry or an administrative sync. */
export async function reconcileContact(subscriber: Pick<SubscriberRecord, 'email' | 'status' | 'provider_contact_id'>, provider: ContactsProvider): Promise<ContactSyncResult> {
  if (subscriber.status === 'pending') return { outcome: 'pending' };
  let contact = await provider.get(subscriber.email);
  if (subscriber.status === 'unsubscribed') {
    if (contact && !contact.unsubscribed) await provider.unsubscribe(contact);
    return { outcome: 'synced', ...(contact ? { contactId: contact.id } : {}) };
  }
  if (!contact && subscriber.provider_contact_id) return { outcome: 'remote_unsubscribed', contactId: subscriber.provider_contact_id };
  if (!contact) contact = await provider.create(subscriber.email);
  return { outcome: contact.unsubscribed ? 'remote_unsubscribed' : 'synced', contactId: contact.id };
}

async function saveSyncState(service: SupabaseClient, subscriber: SubscriberRecord, state: 'pending' | 'failed' | 'synced', error: string | null, contactId?: string): Promise<boolean> {
  const payload: Record<string, unknown> = { provider_sync_status: state, provider_sync_error: error, provider_synced_at: state === 'synced' ? new Date().toISOString() : null };
  if (contactId) payload.provider_contact_id = contactId;
  const result = await service.from('newsletter_subscribers').update(payload).eq('id', subscriber.id).eq('subscription_version', subscriber.subscription_version).eq('status', subscriber.status).select('id').maybeSingle();
  if (result.error) throw new HttpError(503, 'No se pudo registrar la sincronización.');
  return Boolean(result.data);
}

export async function syncNewsletterSubscriber(id: string, service: SupabaseClient = adminClient()): Promise<boolean> {
  const result = await service.from('newsletter_subscribers').select('id,email,status,subscription_version,provider_contact_id,unsubscribed_at').eq('id', id).maybeSingle();
  if (result.error || !result.data) throw new HttpError(503, 'No se pudo consultar la suscripción.');
  const subscriber = result.data as SubscriberRecord;
  if (subscriber.status === 'pending' && !subscriber.unsubscribed_at) return false;
  const key = env('RESEND_API_KEY');
  if (env('NEWSLETTER_MARKETING_ENABLED') !== 'true' || !key || !env('RESEND_WEBHOOK_SECRET')) {
    await saveSyncState(service, subscriber, 'pending', 'La sincronización de marketing aún no está habilitada.');
    return false;
  }
  try {
    // A new opt-in request must not cancel an earlier withdrawal until it is confirmed.
    const effective = subscriber.status === 'pending' ? { ...subscriber, status: 'unsubscribed' as const } : subscriber;
    const outcome = await reconcileContact(effective, new ResendContactsProvider(key));
    if (outcome.outcome === 'remote_unsubscribed' && outcome.contactId) {
      const applied = await service.rpc('apply_newsletter_provider_event', { p_email: subscriber.email, p_contact_id: outcome.contactId, p_created_at: new Date().toISOString() });
      if (applied.error) throw new HttpError(503, 'No se pudo registrar la baja del proveedor.');
      const latest = await service.from('newsletter_subscribers').select('id,email,status,subscription_version').eq('id', id).maybeSingle();
      if (latest.error || !latest.data) throw new HttpError(503, 'No se pudo comprobar la baja.');
      if (latest.data.status === 'unsubscribed') await saveSyncState(service, latest.data as SubscriberRecord, 'synced', null, outcome.contactId);
      return false;
    }
    if (outcome.outcome !== 'synced') return false;
    const saved = await saveSyncState(service, subscriber, 'synced', null, outcome.contactId);
    if (!saved) {
      // A concurrent unsubscribe/re-consent invalidates this acknowledgement.
      // Its new version remains pending; an operator must reconcile before a campaign.
      return false;
    }
    return true;
  } catch (error) {
    await saveSyncState(service, subscriber, 'failed', error instanceof HttpError ? error.message : 'No se pudo conectar con el proveedor.');
    return false;
  }
}

export function verifyNewsletterWebhook(raw: string, headers: Headers, secret: string): unknown {
  if (!secret) throw new HttpError(503, 'Webhook no configurado.');
  try {
    new Webhook(secret).verify(raw, {
      'svix-id': headers.get('svix-id') || '',
      'svix-timestamp': headers.get('svix-timestamp') || '',
      'svix-signature': headers.get('svix-signature') || '',
    });
    return JSON.parse(raw) as unknown;
  } catch { throw new HttpError(400, 'Firma de webhook no válida.'); }
}

export function unsubscribeEvent(value: unknown): { email: string; contactId: string; createdAt: string } | null {
  if (!value || typeof value !== 'object') throw new HttpError(400, 'Evento no válido.');
  const event = value as { type?: unknown; created_at?: unknown; data?: unknown };
  if (event.type !== 'contact.updated' && event.type !== 'contact.deleted') return null;
  if (!event.data || typeof event.data !== 'object') throw new HttpError(400, 'Evento no válido.');
  const data = event.data as { id?: unknown; email?: unknown; unsubscribed?: unknown };
  if (event.type === 'contact.updated' && data.unsubscribed !== true) return null;
  if (typeof data.id !== 'string' || !data.id || data.id.length > 255 || typeof data.email !== 'string' || typeof event.created_at !== 'string') throw new HttpError(400, 'Evento no válido.');
  const created = new Date(event.created_at);
  if (Number.isNaN(created.getTime()) || created.getTime() > Date.now() + 300000) throw new HttpError(400, 'Fecha del evento no válida.');
  return { email: emailAddress(data.email), contactId: data.id, createdAt: created.toISOString() };
}

export async function limitedWebhookBody(request: Request, limit = 131072): Promise<string> {
  if (Number(request.headers.get('content-length') || 0) > limit) throw new HttpError(413, 'Evento demasiado grande.');
  if (!request.body) throw new HttpError(400, 'Falta el evento.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new HttpError(413, 'Evento demasiado grande.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(body); }
  catch { throw new HttpError(400, 'Evento no válido.'); }
}

import type { APIRoute } from 'astro';
import { adminClient } from '../../../lib/server/auth';
import { formData, text, redirectTo, HttpError } from '../../../lib/server/security';
import { tokenHash } from '../../../lib/server/email';
import { syncNewsletterSubscriber } from '../../../lib/server/newsletter-provider';

export const POST: APIRoute = async context => {
  try {
    const data = await formData(context);
    const value = text(data, 'token', 100);
    if (!/^[\w-]{43}$/.test(value)) return redirectTo('/newsletter/baja', 'error', 'invalid');
    const service = adminClient();
    const result = await service.from('newsletter_subscribers').update({
      status: 'unsubscribed', unsubscribed_at: new Date().toISOString(), confirmation_token_hash: null, token_expires_at: null,
    }).eq('unsubscribe_token_hash', tokenHash(value)).select('id').maybeSingle();
    if (result.error) throw new HttpError(503, 'No se pudo registrar la baja.');
    if (!result.data) return redirectTo('/newsletter/baja', 'error', 'invalid');
    let synced = false;
    try { synced = await syncNewsletterSubscriber(result.data.id, service); }
    catch { /* The local unsubscribe is durable; no campaign is enabled with pending sync. */ }
    return synced ? redirectTo('/', 'newsletter', 'unsubscribed') : redirectTo('/newsletter/baja', 'done', 'pending');
  } catch { return redirectTo('/newsletter/baja', 'error', 'unavailable'); }
};

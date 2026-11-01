import type { APIRoute } from 'astro';
import { adminClient } from '../../../lib/server/auth';
import { env } from '../../../lib/server/config';
import { errorResponse, HttpError } from '../../../lib/server/security';
import { limitedWebhookBody, unsubscribeEvent, verifyNewsletterWebhook } from '../../../lib/server/newsletter-provider';

export const POST: APIRoute = async context => {
  try {
    if (!env('RESEND_WEBHOOK_SECRET')) throw new HttpError(503, 'Webhook no configurado.');
    if (!/^application\/json(?:;|$)/i.test(context.request.headers.get('content-type') || '')) throw new HttpError(415, 'Formato no válido.');
    const raw = await limitedWebhookBody(context.request);
    const payload = verifyNewsletterWebhook(raw, context.request.headers, env('RESEND_WEBHOOK_SECRET'));
    const event = unsubscribeEvent(payload);
    if (event) {
      const service = adminClient();
      const applied = await service.rpc('apply_newsletter_provider_event', { p_email: event.email, p_contact_id: event.contactId, p_created_at: event.createdAt });
      if (applied.error) throw new HttpError(503, 'No se pudo registrar el evento.');
      if (applied.data === true) {
        // Acknowledge only this applied withdrawal, not a newer local re-consent.
        const saved = await service.from('newsletter_subscribers').update({ provider_sync_status: 'synced', provider_sync_error: null, provider_synced_at: new Date().toISOString() }).eq('email', event.email).eq('status', 'unsubscribed').eq('provider_last_event_at', event.createdAt);
        if (saved.error) throw new HttpError(503, 'No se pudo registrar la sincronización.');
      }
    }
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
};

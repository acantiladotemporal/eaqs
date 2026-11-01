import type { APIRoute } from 'astro';
import { adminClient } from '../../../lib/server/auth';
import { formData, text, redirectTo, HttpError } from '../../../lib/server/security';
import { tokenHash, token, mailTemplate, queueMail } from '../../../lib/server/email';
import { siteUrl } from '../../../lib/server/config';
import { syncNewsletterSubscriber } from '../../../lib/server/newsletter-provider';

export const POST: APIRoute = async context => {
  try {
    const data = await formData(context);
    const value = text(data, 'token', 100);
    if (!/^[\w-]{43}$/.test(value)) return redirectTo('/newsletter/confirmar', 'error', 'expired');
    const unsubscribe = token();
    const service = adminClient();
    const updated = await service.from('newsletter_subscribers').update({
      status: 'confirmed', confirmed_at: new Date().toISOString(), unsubscribed_at: null,
      confirmation_token_hash: null, token_expires_at: null, unsubscribe_token_hash: tokenHash(unsubscribe),
    }).eq('confirmation_token_hash', tokenHash(value)).eq('status', 'pending').gt('token_expires_at', new Date().toISOString()).select('id,email').maybeSingle();
    if (updated.error) throw new HttpError(503, 'No se pudo confirmar la suscripción.');
    if (!updated.data) return redirectTo('/newsletter/confirmar', 'error', 'expired');
    let synced = false;
    try { synced = await syncNewsletterSubscriber(updated.data.id, service); }
    catch { /* The committed confirmation remains auditable as pending/failed sync. */ }
    const current = await service.from('newsletter_subscribers').select('status').eq('id', updated.data.id).single();
    if (current.error) throw new HttpError(503, 'No se pudo comprobar la confirmación.');
    if (current.data.status === 'unsubscribed') return redirectTo('/newsletter/confirmar', 'error', 'suppressed');
    if (current.data.status !== 'confirmed') throw new HttpError(503, 'No se pudo comprobar la confirmación.');
    const link = new URL('/newsletter/baja', siteUrl());
    link.searchParams.set('token', unsubscribe);
    try {
      await queueMail(updated.data.email, `newsletter-welcome:${updated.data.id}:${tokenHash(unsubscribe)}`, mailTemplate('Tu correo está confirmado', 'Gracias por hacer espacio a una mirada más atenta sobre música e infancia. La escuela terminará de preparar el alta antes del primer envío. Puedes darte de baja cuando quieras.', { label: 'Darme de baja', url: link.href }));
    } catch { /* Welcome delivery is not a prerequisite for retaining the verified consent. */ }
    return synced ? redirectTo('/', 'newsletter', 'confirmed') : redirectTo('/newsletter/confirmar', 'done', 'pending');
  } catch { return redirectTo('/newsletter/confirmar', 'error', 'unavailable'); }
};

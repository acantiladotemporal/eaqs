import { adminClient } from './auth';
import { siteUrl } from './config';
import { token, tokenHash, queueMail, mailTemplate } from './email';
import { emailAddress, HttpError } from './security';

export async function subscribeNewsletter(inputEmail: string, source: string) {
  const email = emailAddress(inputEmail);
  const service = adminClient();
  const found = await service.from('newsletter_subscribers').select('id,status').eq('email', email).maybeSingle();
  if (found.error) throw new HttpError(503, 'No se pudo registrar la solicitud.');
  if (found.data?.status === 'confirmed') return;
  const confirmation = token();
  const record = {
    email, source, status: 'pending', confirmation_token_hash: tokenHash(confirmation),
    token_expires_at: new Date(Date.now() + 86400000).toISOString(), consented_at: new Date().toISOString(),
    privacy_version: '2026-11', confirmed_at: null,
    // Preserve an existing unsubscribe token/provider suppression while re-consent is pending.
  };
  const saved = await service.from('newsletter_subscribers').upsert(record, { onConflict: 'email' }).select('id').single();
  if (saved.error) throw new HttpError(503, 'No se pudo registrar la solicitud.');
  const link = new URL('/newsletter/confirmar', siteUrl());
  link.searchParams.set('token', confirmation);
  const template = mailTemplate('Confirma tu suscripción', 'Una idea a la semana para escuchar, comprender y acompañar la infancia. Confirma tu correo para empezar. El enlace caduca en 24 horas.', { label: 'Confirmar mi suscripción', url: link.href });
  const sent = await queueMail(email, `newsletter-confirm:${saved.data.id}:${tokenHash(confirmation)}`, template);
  if (!sent) throw new HttpError(503, 'La solicitud está guardada, pero no hemos podido enviarte el enlace. Inténtalo más tarde.');
}

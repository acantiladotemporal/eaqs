import type { APIRoute } from 'astro';
import { buildNewsletterWelcomeTemplate, logEmailEvent, sendResendEmail } from '../../../lib/server/email';
import { isSupabaseServerConfigured, supabaseAdmin } from '../../../lib/server/supabase-admin';

export const prerender = false;

interface NewsletterInput {
  email?: string;
  source?: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request }) => {
  const payload = (await request.json().catch(() => null)) as NewsletterInput | null;
  const email = payload?.email?.trim().toLowerCase() || '';
  const source = payload?.source?.trim() || 'unknown';

  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ ok: false, message: 'Email invalido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (isSupabaseServerConfigured) {
    try {
      const { error } = await supabaseAdmin
        .from('newsletter_subscribers')
        .upsert(
          {
            email,
            source,
          },
          { onConflict: 'email' }
        );

      if (error) throw error;
    } catch (error) {
      console.warn('[newsletter] Unable to upsert subscriber:', error);
    }
  }

  const template = buildNewsletterWelcomeTemplate(email);
  const sendResult = await sendResendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  await logEmailEvent({
    email,
    eventType: 'newsletter_sent',
    template: 'newsletter_welcome',
    payload: {
      source,
      resend: sendResult.message,
    },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'Suscripcion registrada',
      emailSent: sendResult.ok,
      emailSkipped: sendResult.skipped,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};


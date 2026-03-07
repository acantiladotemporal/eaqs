import type { APIRoute } from 'astro';
import { logEmailEvent, sendResendEmail } from '../../../lib/server/email';
import { isSupabaseServerConfigured, supabaseAdmin } from '../../../lib/server/supabase-admin';

export const prerender = false;

const cronSecret = import.meta.env.CRON_SECRET?.trim();
const siteUrl = import.meta.env.PUBLIC_SITE_URL?.trim() || 'https://eaqs.vercel.app';

function getTemplate(kind: string) {
  if (kind === 'conversion') {
    return {
      template: 'capture_conversion',
      subject: 'Tu aula puede sonar distinta este trimestre',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#3f3832;">
          <h1 style="font-size:24px;margin-bottom:12px;">Convocatoria abierta</h1>
          <p>Reserva tu plaza para la Cohorte 01 de Neuroeducacion Musical.</p>
          <p>10 modulos, acceso privado y certificacion. Oferta actual: 390 EUR.</p>
          <p><a href="${siteUrl}/registro" style="color:#b4892f;">Reservar plaza</a></p>
        </div>
      `,
      text:
        `Convocatoria abierta: 10 modulos, acceso privado y certificacion. Oferta actual 390 EUR. Reserva: ${siteUrl}/registro`,
    };
  }

  if (kind === 'closing') {
    return {
      template: 'capture_closing',
      subject: 'Cierre de plazas: domingo 12 abril a las 23:59',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#3f3832;">
          <h1 style="font-size:24px;margin-bottom:12px;">Ultimo aviso de cohorte</h1>
          <p>El cierre de plazas es este domingo a las 23:59 (Europe/Madrid) o al completar 20 docentes.</p>
          <p><a href="${siteUrl}/registro" style="color:#b4892f;">Entrar al checkout</a></p>
        </div>
      `,
      text:
        `Ultimo aviso: cierre domingo 12 abril a las 23:59 (Europe/Madrid) o al completar 20 plazas. Checkout: ${siteUrl}/registro`,
    };
  }

  return {
    template: 'capture_weekly',
    subject: 'Una idea de neuroeducacion musical para tu semana',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#3f3832;">
          <h1 style="font-size:24px;margin-bottom:12px;">Newsletter semanal</h1>
          <p>Esta semana: una secuencia breve para regular energia y foco en aula desde el ritmo.</p>
          <p>Si quieres recorrer el metodo completo, la convocatoria de la cohorte esta activa.</p>
          <p><a href="${siteUrl}/registro" style="color:#b4892f;">Ver detalles del curso</a></p>
        </div>
      `,
      text:
        `Newsletter semanal: secuencia breve para regular energia y foco en aula. Curso completo en ${siteUrl}/registro`,
    };
}

function normalizeCronToken(token: string | null) {
  if (!token) return '';
  return token.replace(/^Bearer\s+/i, '').trim();
}

export const POST: APIRoute = async ({ request, url }) => {
  const headerToken = normalizeCronToken(request.headers.get('authorization'));
  const queryToken = (url.searchParams.get('token') || '').trim();
  const providedToken = headerToken || queryToken;

  if (!cronSecret || providedToken !== cronSecret) {
    return new Response(JSON.stringify({ ok: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isSupabaseServerConfigured) {
    return new Response(JSON.stringify({ ok: false, message: 'Supabase server no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const kind = (url.searchParams.get('kind') || 'weekly').trim().toLowerCase();
  const template = getTemplate(kind);
  const limit = Number(url.searchParams.get('limit') || '200');
  const safeLimit = Number.isFinite(limit) ? Math.max(Math.min(limit, 500), 1) : 200;

  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('email')
    .order('created_at', { ascending: true })
    .limit(safeLimit);

  if (error) {
    return new Response(JSON.stringify({ ok: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const row of data || []) {
    const email = String(row.email || '').trim().toLowerCase();
    if (!email) continue;

    const sendResult = await sendResendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (sendResult.ok) sent += 1;
    if (!sendResult.ok && !sendResult.skipped) failed += 1;

    await logEmailEvent({
      email,
      eventType: 'newsletter_sent',
      template: template.template,
      payload: {
        kind,
        resend: sendResult.message,
      },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      kind,
      total: (data || []).length,
      sent,
      failed,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const GET = POST;

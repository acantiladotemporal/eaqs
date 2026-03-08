import type { EmailEventType } from '../course-data';
import { isSupabaseServerConfigured, supabaseAdmin } from './supabase-admin';

interface ResendPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailLogInput {
  email: string;
  eventType: EmailEventType;
  template: string;
  payload?: Record<string, unknown>;
}

const resendApiKey = import.meta.env.RESEND_API_KEY?.trim();
const resendFrom = import.meta.env.RESEND_FROM_EMAIL?.trim() || 'El Arbol Que Suena <hola@elarbolquesuena.com>';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function sendResendEmail(input: ResendPayload) {
  if (!resendApiKey) {
    return { ok: false as const, skipped: true as const, message: 'RESEND_API_KEY missing' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [normalizeEmail(input.to)],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      return {
        ok: false as const,
        skipped: false as const,
        message: `Resend error ${response.status}: ${bodyText}`,
      };
    }

    return {
      ok: true as const,
      skipped: false as const,
      message: 'sent',
    };
  } catch (error) {
    return {
      ok: false as const,
      skipped: false as const,
      message: error instanceof Error ? error.message : 'Unknown resend error',
    };
  }
}

export async function logEmailEvent(input: EmailLogInput) {
  if (!isSupabaseServerConfigured) return;

  try {
    await supabaseAdmin.from('email_events').insert({
      email: normalizeEmail(input.email),
      event_type: input.eventType,
      template: input.template,
      provider: 'resend',
      payload: input.payload || {},
    });
  } catch (error) {
    console.warn('[email] Unable to log email event:', error);
  }
}

export function buildNewsletterWelcomeTemplate(email: string) {
  return {
    subject: 'Bienvenida a la newsletter de El Arbol Que Suena',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#3f3832;">
        <h1 style="font-size:24px;margin-bottom:12px;">Gracias por unirte</h1>
        <p>Hola ${email},</p>
        <p>Ya estas dentro de la newsletter semanal de neuroeducacion musical.</p>
        <p>Recibiras una idea accionable por semana para aplicar en aula con foco en 0-6 y transferible a 0-9.</p>
        <p>Equipo El Arbol Que Suena.</p>
      </div>
    `,
    text:
      `Gracias por unirte, ${email}. ` +
      'Ya estas dentro de la newsletter semanal de neuroeducacion musical de El Arbol Que Suena.',
  };
}

export function buildPurchaseConfirmationTemplate(name: string, accessUrl: string) {
  const safeName = name || 'Docente';

  return {
    subject: 'Pago confirmado - El Arbol Que Suena',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#3f3832;">
        <h1 style="font-size:24px;margin-bottom:12px;">Tu plaza esta confirmada</h1>
        <p>Hola ${safeName},</p>
        <p>Tu pago del curso de Neuroeducacion Musical ha sido validado correctamente.</p>
        <p>Entra en tu perfil privado para seguir el calendario de la cohorte y avanzar modulo a modulo.</p>
        <p><a href="${accessUrl}" style="color:#b4892f;">Acceder al aula</a></p>
        <p>Equipo El Arbol Que Suena.</p>
      </div>
    `,
    text:
      `Hola ${safeName}. Tu pago ha sido confirmado. ` +
      `Accede a tu aula desde ${accessUrl}`,
  };
}

import { COURSE_LAUNCH_PRICE_EUR } from '../course-data';

const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY?.trim();
const stripePriceId = import.meta.env.STRIPE_PRICE_ID?.trim();

interface CreateSessionInput {
  email: string;
  fullName?: string;
  source?: string;
  clientReferenceId?: string;
  origin: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

function buildCheckoutParams(input: CreateSessionInput) {
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${input.origin}/gracias?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${input.origin}/registro?checkout=cancelled`);
  params.append('locale', 'es');
  params.append('allow_promotion_codes', 'true');
  params.append('customer_email', input.email.trim().toLowerCase());

  if (input.clientReferenceId) {
    params.append('client_reference_id', input.clientReferenceId);
  }

  params.append('metadata[email]', input.email.trim().toLowerCase());
  params.append('metadata[source]', input.source || 'registro');
  params.append('metadata[full_name]', input.fullName?.trim() || '');

  if (stripePriceId) {
    params.append('line_items[0][price]', stripePriceId);
    params.append('line_items[0][quantity]', '1');
  } else {
    params.append('line_items[0][price_data][currency]', 'eur');
    params.append('line_items[0][price_data][unit_amount]', String(COURSE_LAUNCH_PRICE_EUR * 100));
    params.append('line_items[0][price_data][product_data][name]', 'Curso de Neuroeducacion Musical Cohorte 01');
    params.append(
      'line_items[0][price_data][product_data][description]',
      'Acceso completo a 10 modulos, comunidad privada y certificacion oficial.'
    );
    params.append('line_items[0][quantity]', '1');
  }

  return params;
}

export async function createStripeCheckoutSession(input: CreateSessionInput) {
  if (!stripeSecretKey) {
    return { ok: false as const, message: 'STRIPE_SECRET_KEY missing' };
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildCheckoutParams(input).toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const stripeMessage =
      payload?.error?.message || `Stripe checkout error (${response.status})`;
    return { ok: false as const, message: stripeMessage };
  }

  return {
    ok: true as const,
    session: payload as StripeCheckoutSession,
  };
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  if (!stripeSecretKey) {
    return { ok: false as const, message: 'STRIPE_SECRET_KEY missing' };
  }

  const safeSessionId = encodeURIComponent(sessionId.trim());
  const url = `https://api.stripe.com/v1/checkout/sessions/${safeSessionId}?expand[]=payment_intent`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const stripeMessage =
      payload?.error?.message || `Stripe session retrieval error (${response.status})`;
    return { ok: false as const, message: stripeMessage };
  }

  return {
    ok: true as const,
    session: payload,
  };
}


import type { APIRoute } from 'astro';
import { finalizeCheckoutSession } from '../../../lib/server/finalize-checkout';
import { retrieveStripeCheckoutSession } from '../../../lib/server/stripe';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const sessionId = url.searchParams.get('session_id')?.trim() || '';

  if (!sessionId) {
    return new Response(JSON.stringify({ ok: false, message: 'session_id requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stripeResult = await retrieveStripeCheckoutSession(sessionId);
  if (!stripeResult.ok) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: stripeResult.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const session = stripeResult.session as {
    id: string;
    payment_status?: string;
    status?: string;
    customer_email?: string;
    customer_details?: {
      email?: string | null;
      name?: string | null;
    };
    amount_total?: number | null;
    currency?: string | null;
    payment_intent?: string | null;
    metadata?: Record<string, string>;
  };

  const result = await finalizeCheckoutSession(session, url.origin);

  return new Response(
    JSON.stringify({
      ok: true,
      paid: result.paid,
      paymentStatus: result.paymentStatus,
      email: result.email,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

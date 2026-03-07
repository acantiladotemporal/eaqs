import type { APIRoute } from 'astro';
import { getCheckoutAvailability, createPendingEnrollment, linkStripeSessionToEnrollment } from '../../../lib/server/enrollments';
import { createStripeCheckoutSession } from '../../../lib/server/stripe';

export const prerender = false;

interface CreateCheckoutPayload {
  email?: string;
  fullName?: string;
  source?: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request, url }) => {
  const payload = (await request.json().catch(() => null)) as CreateCheckoutPayload | null;
  const email = payload?.email?.trim().toLowerCase() || '';
  const fullName = payload?.fullName?.trim() || '';
  const source = payload?.source?.trim() || 'registro';

  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ ok: false, message: 'Email invalido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const availability = await getCheckoutAvailability(new Date());
  if (!availability.open) {
    const reason = availability.soldOut ? 'sold_out' : 'closed_by_date';
    const message = availability.soldOut
      ? 'No hay plazas disponibles en esta cohorte.'
      : 'La convocatoria esta cerrada.';

    return new Response(
      JSON.stringify({
        ok: false,
        reason,
        message,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const pendingEnrollment = await createPendingEnrollment({
    email,
    fullName,
    source,
  });

  const checkoutResult = await createStripeCheckoutSession({
    email,
    fullName,
    source,
    clientReferenceId: pendingEnrollment?.id || undefined,
    origin: url.origin,
  });

  if (!checkoutResult.ok) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: checkoutResult.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const sessionId = checkoutResult.session.id;
  await linkStripeSessionToEnrollment(pendingEnrollment?.id, sessionId, email);

  return new Response(
    JSON.stringify({
      ok: true,
      checkoutUrl: checkoutResult.session.url,
      sessionId,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};


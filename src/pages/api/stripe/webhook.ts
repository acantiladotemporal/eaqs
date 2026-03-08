import { createHmac, timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { finalizeCheckoutSession } from '../../../lib/server/finalize-checkout';

export const prerender = false;

const stripeWebhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET?.trim();
const siteUrl = import.meta.env.PUBLIC_SITE_URL?.trim();

function parseStripeSignature(signatureHeader: string | null) {
  if (!signatureHeader) return null;

  const items = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = items.find((part) => part.startsWith('t='))?.slice(2);
  const signature = items.find((part) => part.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) return null;
  return { timestamp, signature };
}

function verifyStripeSignature(payload: string, signatureHeader: string | null) {
  if (!stripeWebhookSecret) return false;
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) return false;

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expected = createHmac('sha256', stripeWebhookSecret).update(signedPayload, 'utf8').digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const incomingBuffer = Buffer.from(parsed.signature, 'utf8');
  if (expectedBuffer.length !== incomingBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, incomingBuffer);
}

export const POST: APIRoute = async ({ request, url }) => {
  if (!stripeWebhookSecret) {
    return new Response('STRIPE_WEBHOOK_SECRET missing', { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('stripe-signature');
  const valid = verifyStripeSignature(rawBody, signatureHeader);

  if (!valid) {
    return new Response('Invalid webhook signature', { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    type?: string;
    data?: {
      object?: Record<string, unknown>;
    };
  };

  const sessionObject = event?.data?.object;
  if (!sessionObject || typeof sessionObject !== 'object') {
    return new Response('Invalid event payload', { status: 400 });
  }

  const eventType = event?.type || '';
  const shouldFinalize =
    eventType === 'checkout.session.completed' ||
    eventType === 'checkout.session.async_payment_succeeded' ||
    eventType === 'checkout.session.expired';

  if (shouldFinalize) {
    await finalizeCheckoutSession(
      sessionObject as {
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
      },
      siteUrl || url.origin
    );
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};


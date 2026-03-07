import { inviteLearnerToSupabase } from './auth-admin';
import { buildPurchaseConfirmationTemplate, logEmailEvent, sendResendEmail } from './email';
import { markEnrollmentFromStripeSession, markWelcomeEmailSent } from './enrollments';

interface StripeSessionLike {
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
}

export async function finalizeCheckoutSession(session: StripeSessionLike, origin: string) {
  const enrollment = await markEnrollmentFromStripeSession(session);
  const paymentStatus = session.payment_status || session.status || 'unknown';
  const paid = paymentStatus === 'paid' || paymentStatus === 'complete';

  const learnerEmail = (
    session.customer_email ||
    session.customer_details?.email ||
    enrollment?.email ||
    session.metadata?.email ||
    ''
  )
    .trim()
    .toLowerCase();
  const learnerName = (session.customer_details?.name || enrollment?.full_name || '').trim();

  if (paid && learnerEmail) {
    const metadata = (enrollment?.metadata || {}) as Record<string, unknown>;
    const alreadySent = Boolean(metadata.transactional_sent);

    if (!alreadySent) {
      const accessUrl = `${origin}/login?next=/dashboard`;
      const template = buildPurchaseConfirmationTemplate(learnerName || 'Docente', accessUrl);
      const sendResult = await sendResendEmail({
        to: learnerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      await logEmailEvent({
        email: learnerEmail,
        eventType: 'transactional_sent',
        template: 'payment_confirmed',
        payload: {
          sessionId: session.id,
          resend: sendResult.message,
          paid: true,
        },
      });

      await markWelcomeEmailSent(enrollment?.id);
    }

    await inviteLearnerToSupabase(learnerEmail, learnerName || null, `${origin}/login?next=/dashboard`);
  }

  return {
    paid,
    paymentStatus,
    email: learnerEmail || null,
    enrollmentId: enrollment?.id || null,
  };
}


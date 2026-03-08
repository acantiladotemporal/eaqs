import { COURSE_LAUNCH_PRICE_EUR, getCheckoutState } from '../course-data';
import { isSupabaseServerConfigured, supabaseAdmin } from './supabase-admin';

interface PendingEnrollmentInput {
  email: string;
  fullName?: string;
  source?: string;
}

interface StripeCheckoutSessionPayload {
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

const ENROLLMENTS_TABLE = 'enrollments';

function tableErrorToMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error || 'unknown');
}

export async function getPaidEnrollmentCount() {
  if (!isSupabaseServerConfigured) return 0;

  try {
    const { count, error } = await supabaseAdmin
      .from(ENROLLMENTS_TABLE)
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'paid');

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.warn('[enrollments] Unable to count paid seats:', tableErrorToMessage(error));
    return 0;
  }
}

export async function getCheckoutAvailability(now = new Date()) {
  const paidSeats = await getPaidEnrollmentCount();
  return getCheckoutState(paidSeats, now);
}

export async function createPendingEnrollment(input: PendingEnrollmentInput) {
  if (!isSupabaseServerConfigured) return null;

  const email = input.email.trim().toLowerCase();
  if (!email) return null;

  const payload = {
    email,
    full_name: input.fullName?.trim() || null,
    source: input.source?.trim() || 'registro',
    status: 'pending',
    amount_eur: COURSE_LAUNCH_PRICE_EUR,
    currency: 'EUR',
    metadata: {
      source: input.source?.trim() || 'registro',
    },
  };

  try {
    const { data, error } = await supabaseAdmin
      .from(ENROLLMENTS_TABLE)
      .insert(payload)
      .select('id, email, status, full_name')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('[enrollments] Unable to insert pending enrollment:', tableErrorToMessage(error));
    return null;
  }
}

export async function linkStripeSessionToEnrollment(
  enrollmentId: string | null | undefined,
  sessionId: string,
  email: string
) {
  if (!isSupabaseServerConfigured) return;
  if (!sessionId) return;

  const updatePayload = {
    stripe_session_id: sessionId,
    email: email.trim().toLowerCase(),
  };

  try {
    if (enrollmentId) {
      await supabaseAdmin.from(ENROLLMENTS_TABLE).update(updatePayload).eq('id', enrollmentId);
      return;
    }

    const { data } = await supabaseAdmin
      .from(ENROLLMENTS_TABLE)
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      await supabaseAdmin.from(ENROLLMENTS_TABLE).update(updatePayload).eq('id', data.id);
      return;
    }

    await supabaseAdmin.from(ENROLLMENTS_TABLE).insert({
      ...updatePayload,
      status: 'pending',
      amount_eur: COURSE_LAUNCH_PRICE_EUR,
      currency: 'EUR',
    });
  } catch (error) {
    console.warn('[enrollments] Unable to link stripe session:', tableErrorToMessage(error));
  }
}

export async function markEnrollmentFromStripeSession(session: StripeCheckoutSessionPayload) {
  if (!isSupabaseServerConfigured) return null;
  if (!session.id) return null;

  const normalizedEmail = (
    session.customer_email ||
    session.customer_details?.email ||
    session.metadata?.email ||
    ''
  )
    .trim()
    .toLowerCase();

  const normalizedName = (session.customer_details?.name || session.metadata?.full_name || '').trim();

  try {
    const { data: existing } = await supabaseAdmin
      .from(ENROLLMENTS_TABLE)
      .select('id, email, status, metadata')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    const paymentStatus = session.payment_status || session.status;
    const isPaid = paymentStatus === 'paid' || paymentStatus === 'complete';
    const nextStatus = isPaid ? 'paid' : 'pending';

    const payload = {
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent || null,
      email: normalizedEmail || existing?.email || null,
      full_name: normalizedName || null,
      status: nextStatus,
      amount_eur: typeof session.amount_total === 'number' ? session.amount_total / 100 : COURSE_LAUNCH_PRICE_EUR,
      currency: (session.currency || 'eur').toUpperCase(),
      paid_at: isPaid ? new Date().toISOString() : null,
    };

    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from(ENROLLMENTS_TABLE)
        .update(payload)
        .eq('id', existing.id)
        .select('id, email, full_name, status, metadata')
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabaseAdmin
      .from(ENROLLMENTS_TABLE)
      .insert(payload)
      .select('id, email, full_name, status, metadata')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('[enrollments] Unable to mark paid enrollment:', tableErrorToMessage(error));
    return null;
  }
}

export async function markWelcomeEmailSent(enrollmentId: string | null | undefined) {
  if (!isSupabaseServerConfigured || !enrollmentId) return;

  try {
    const { data: existing } = await supabaseAdmin
      .from(ENROLLMENTS_TABLE)
      .select('metadata')
      .eq('id', enrollmentId)
      .maybeSingle();

    const metadata = {
      ...(existing?.metadata || {}),
      transactional_sent: true,
      transactional_sent_at: new Date().toISOString(),
    };

    await supabaseAdmin.from(ENROLLMENTS_TABLE).update({ metadata }).eq('id', enrollmentId);
  } catch (error) {
    console.warn('[enrollments] Unable to mark transactional email sent:', tableErrorToMessage(error));
  }
}


import { isSupabaseAdminConfigured, supabaseAdmin } from './supabase-admin';

export async function inviteLearnerToSupabase(email: string, fullName: string | null, redirectTo: string) {
  if (!isSupabaseAdminConfigured) {
    return { ok: false as const, skipped: true as const, message: 'SUPABASE_SERVICE_ROLE_KEY missing' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false as const, skipped: true as const, message: 'Email missing' };
  }

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
    data: {
      full_name: fullName || null,
    },
    redirectTo,
  });

  if (!error) {
    return { ok: true as const, skipped: false as const, message: 'invited' };
  }

  if (error.message.toLowerCase().includes('already')) {
    return { ok: true as const, skipped: true as const, message: 'already invited' };
  }

  return { ok: false as const, skipped: false as const, message: error.message };
}


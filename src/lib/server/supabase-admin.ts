import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const isSupabaseServerConfigured = Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

const safeUrl = supabaseUrl || 'https://example.supabase.co';
const safeKey = supabaseServiceRoleKey || supabaseAnonKey || 'public-anon-key-placeholder';

if (!isSupabaseServerConfigured) {
  console.warn(
    '[supabase-admin] Missing PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Server features run in degraded mode.'
  );
}

if (!isSupabaseAdminConfigured) {
  console.warn('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY missing. Admin operations are limited.');
}

export const supabaseAdmin = createClient(safeUrl, safeKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const safeSupabaseUrl = isSupabaseConfigured ? supabaseUrl! : 'https://example.supabase.co';
const safeSupabaseKey = isSupabaseConfigured ? supabaseKey! : 'public-anon-key-placeholder';

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. Build continues with placeholder client.'
  );
}

export const supabase = createClient(safeSupabaseUrl, safeSupabaseKey);

/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    user: import('@supabase/supabase-js').User | null;
    db: import('@supabase/supabase-js').SupabaseClient | null;
    isAdmin: boolean;
    enrollment: { id: string; cohort_id: string; user_id: string | null; status: string; reference?: string } | null;
  }
}

export function env(name: string): string {
  // An explicitly empty runtime binding must override a value compiled during local development.
  return (process.env[name] ?? import.meta.env?.[name] ?? '').trim();
}

export function siteUrl(): string {
  const configured = env('PUBLIC_SITE_URL');
  if (configured) return new URL(configured).origin;
  return import.meta.env?.DEV ? 'http://127.0.0.1:4321' : 'https://www.elarbolquesuena.com';
}

export function supabaseConfig() {
  return {
    url: env('PUBLIC_SUPABASE_URL'),
    key: env('PUBLIC_SUPABASE_PUBLISHABLE_KEY') || env('PUBLIC_SUPABASE_ANON_KEY'),
    secret: env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

// Deliberately closed until the bank contract and the sandbox checks are complete.
export const PAYMENTS_ENABLED = false;
export const DEFAULT_COHORT_ID = '11111111-1111-4111-8111-111111111111';

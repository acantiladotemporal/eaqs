import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { createClient, type User } from '@supabase/supabase-js';
import type { APIContext } from 'astro';
import { supabaseConfig } from './config';
import { HttpError } from './security';

export function requestClient(context: Pick<APIContext, 'request' | 'cookies' | 'url'>) {
  const { url, key } = supabaseConfig();
  if (!url || !key) return null;
  return createServerClient(url, key, {
    cookies: {
      getAll: () => parseCookieHeader(context.request.headers.get('Cookie') ?? '').map(cookie => ({name: cookie.name, value: cookie.value ?? ''})),
      setAll: cookies => cookies.forEach(({name, value, options}) => context.cookies.set(name, value, {...options, path: '/', secure: context.url.protocol === 'https:', sameSite: 'lax', httpOnly: true})),
    },
  });
}

export function adminClient() {
  const { url, secret } = supabaseConfig();
  if (!url || !secret) throw new HttpError(503, 'Servicio no disponible.');
  return createClient(url, secret, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});
}
export function userIsAdmin(user: User | null): boolean {
  return Boolean(user?.email_confirmed_at && user.app_metadata?.role === 'admin');
}
export function requireUser(context: Pick<APIContext, 'locals'>) {
  if (!context.locals.user || !context.locals.db) throw new HttpError(401, 'Inicia sesión para continuar.');
  return { user: context.locals.user, db: context.locals.db };
}
export function requireAdmin(context: Pick<APIContext, 'locals'>) {
  const session = requireUser(context);
  if (!context.locals.isAdmin) throw new HttpError(403, 'Acceso reservado a la escuela.');
  return session;
}
export function requireEnrollment(context: Pick<APIContext, 'locals'>) {
  const session = requireUser(context);
  if (!context.locals.enrollment || context.locals.enrollment.status !== 'active') throw new HttpError(403, 'Necesitas una matrícula confirmada.');
  return {...session, enrollment: context.locals.enrollment};
}

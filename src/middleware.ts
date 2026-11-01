import { defineMiddleware } from 'astro:middleware';
import { requestClient, userIsAdmin } from './lib/server/auth';
import { safeNext } from './lib/server/security';
import { env } from './lib/server/config';
import { canIndexSite, canonicalHostRedirect, canonicalPath, isSearchPage } from './lib/seo';

const privatePage = /^\/(dashboard|modulos|examen|foro|trabajo-final|certificado|tutorias)(\/|$)/;
const accountPage = /^\/(admin|mi-solicitud)(\/|$)/;

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.db = null;
  context.locals.isAdmin = false;
  context.locals.enrollment = null;
  const path = context.url.pathname;
  const hostRedirect = canonicalHostRedirect(context.url, context.site);
  const needsSession = privatePage.test(path) || accountPage.test(path) || /^\/api\/(auth|admin|learning|materials|submissions|certificates)/.test(path) || path === '/auth/confirm';
  if (needsSession && !hostRedirect) {
    const db = requestClient(context);
    context.locals.db = db;
    if (db) {
      const { data: { user }, error } = await db.auth.getUser();
      if (!error && user?.email_confirmed_at) {
        context.locals.user = user;
        context.locals.isAdmin = userIsAdmin(user);
        const result = await db.from('enrollments').select('id,cohort_id,user_id,status,reference').eq('user_id',user.id).eq('status','active').limit(1).maybeSingle();
        if (!result.error) context.locals.enrollment = result.data;
      }
    }
  }
  let response: Response;
  if (hostRedirect) {
    response = context.redirect(hostRedirect, 308);
  } else if ((context.request.method === 'GET' || context.request.method === 'HEAD') && isSearchPage(path) && path !== canonicalPath(path)) {
    response = context.redirect(canonicalPath(path) + context.url.search, 301);
  } else if ((privatePage.test(path) || accountPage.test(path)) && !context.locals.user) {
    response = context.redirect(`/login?next=${encodeURIComponent(safeNext(path + context.url.search))}`, 303);
  } else if (/^\/admin(\/|$)/.test(path) && !context.locals.isAdmin) {
    response = new Response('Acceso reservado a la escuela.', {status:403});
  } else if (privatePage.test(path) && !context.locals.enrollment) {
    response = context.redirect('/mi-solicitud',303);
  } else {
    response = await next();
  }
  response.headers.set('X-Content-Type-Options','nosniff');
  if (!response.headers.has('Referrer-Policy')) response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self' https://*.supabase.co https://*.r2.cloudflarestorage.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (path.startsWith('/vista-previa')) {
    response.headers.set('X-Robots-Tag','noindex, nofollow');
    response.headers.set('Cache-Control','no-store');
  }
  const indexingAllowed = !!context.site && !import.meta.env.DEV && canIndexSite(context.url, context.site, env('SEO_INDEXING_ENABLED') === 'true');
  if ((!indexingAllowed || !isSearchPage(path) || response.status >= 400) && !response.headers.has('X-Robots-Tag')) {
    response.headers.set('X-Robots-Tag', needsSession || path.startsWith('/vista-previa') || path.startsWith('/api/') || response.status >= 400 ? 'noindex, nofollow' : 'noindex, follow');
  }
  if (needsSession || path.startsWith('/api/') || path.startsWith('/auth/')) response.headers.set('Cache-Control','private, no-store');
  return response;
});

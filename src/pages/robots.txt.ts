import type { APIRoute } from 'astro';
import { env } from '../lib/server/config';
import { canIndexSite } from '../lib/seo';

export const GET: APIRoute = ({ url, site }) => {
  const enabled = !!site && !import.meta.env.DEV && canIndexSite(url, site, env('SEO_INDEXING_ENABLED') === 'true');
  // Crawlers must be able to read noindex headers on previews and account pages.
  const body = `User-agent: *\nAllow: /\n${enabled ? `\nSitemap: ${new URL('/sitemap.xml', site).href}\n` : ''}`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': enabled ? 'public, max-age=3600' : 'no-store' } });
};

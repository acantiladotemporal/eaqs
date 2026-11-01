import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { env } from '../lib/server/config';
import { canIndexSite, escapeXml, sitemapUrls } from '../lib/seo';

export const GET: APIRoute = async ({ url, site }) => {
  const enabled = !!site && !import.meta.env.DEV && canIndexSite(url, site, env('SEO_INDEXING_ENABLED') === 'true');
  const posts = enabled ? await getCollection('blog', ({ data }) => !data.draft) : [];
  const urls = enabled && site ? sitemapUrls(site, posts.map(post => post.id)) : [];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(location => `\n  <url><loc>${escapeXml(location)}</loc></url>`).join('')}\n</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': enabled ? 'public, max-age=3600' : 'no-store' } });
};

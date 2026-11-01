import { COURSE_NAME } from './course-data';

export const SEARCH_PAGES = ['/', '/programa', '/escuela-internacional-neuroeducacion-musical', '/metodologia', '/contacto'] as const;

export function canonicalPath(path: string): string {
  return new URL(path, 'https://example.invalid').pathname.replace(/\/+$/, '') || '/';
}

export function canonicalUrl(path: string, site: URL): string {
  return new URL(canonicalPath(path), site).href;
}

/** Only the school's root domain redirects; previews and local development keep their origin. */
export function canonicalHostRedirect(requestUrl: URL, site: URL | undefined): string | null {
  if (site?.origin !== 'https://www.elarbolquesuena.com' || requestUrl.hostname !== 'elarbolquesuena.com') return null;
  return site.origin + requestUrl.pathname + requestUrl.search;
}

export function isSearchPage(path: string): boolean {
  const normalized = canonicalPath(path);
  return (SEARCH_PAGES as readonly string[]).includes(normalized) || normalized === '/blog' || normalized.startsWith('/blog/');
}

/** Indexing is opt-in, exclusively on the canonical HTTPS origin. */
export function canIndexSite(requestUrl: URL, site: URL, enabled: boolean): boolean {
  return enabled && site.protocol === 'https:' && requestUrl.origin === site.origin;
}

export function sitemapUrls(site: URL, publishedPostIds: string[]): string[] {
  const paths: string[] = [...SEARCH_PAGES];
  if (publishedPostIds.length) paths.push('/blog', ...publishedPostIds.map(id => `/blog/${id}`));
  return paths.map(path => canonicalUrl(path, site));
}

export function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function pageStructuredData(path: string, title: string, description: string, site: URL): Record<string, unknown> {
  const url = canonicalUrl(path, site);
  const schoolId = new URL('/#school', site).href;
  const websiteId = new URL('/#website', site).href;
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'EducationalOrganization', '@id': schoolId,
      name: 'El Árbol Que Suena', url: site.href,
      description: 'Escuela Internacional de Neuroeducación Musical.',
      logo: { '@type': 'ImageObject', url: new URL('/images/brand-logo.png', site).href, width: 1254, height: 1254 },
    },
    { '@type': 'WebSite', '@id': websiteId, name: 'El Árbol Que Suena', url: site.href, inLanguage: 'es', publisher: { '@id': schoolId } },
    {
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, description,
      inLanguage: 'es', isPartOf: { '@id': websiteId }, about: { '@id': schoolId },
    },
  ];
  if (canonicalPath(path) === '/programa') graph.push({
    '@type': 'Course', '@id': `${url}#course`, url, name: COURSE_NAME,
    description: 'Formación online en español para docentes de niños y niñas de 0 a 6 años, especialmente de 3 a 6. Diez módulos, tutorías y certificado propio.',
    inLanguage: 'es', provider: { '@id': schoolId },
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

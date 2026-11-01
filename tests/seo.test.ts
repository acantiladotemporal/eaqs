import assert from 'node:assert/strict';
import test from 'node:test';
import { canIndexSite, canonicalPath, canonicalUrl, escapeXml, isSearchPage, pageStructuredData, sitemapUrls } from '../src/lib/seo';

const site = new URL('https://www.elarbolquesuena.com');

test('canonical URLs use the configured origin without queries, fragments or duplicate trailing slashes', () => {
  assert.equal(canonicalUrl('/programa/?utm_source=ensayo#modulo-1', site), 'https://www.elarbolquesuena.com/programa');
  assert.equal(canonicalPath('/'), '/');
  assert.equal(canonicalUrl('https://preview.invalid/programa?email=test%40example.invalid', site), 'https://www.elarbolquesuena.com/programa');
});

test('indexing requires explicit activation and the canonical HTTPS origin', () => {
  assert.equal(canIndexSite(new URL('/programa', site), site, true), true);
  for (const url of ['http://127.0.0.1:4321', 'https://preview.invalid', 'http://www.elarbolquesuena.com', 'https://www.elarbolquesuena.com.evil.invalid']) {
    assert.equal(canIndexSite(new URL(url), site, true), false, url);
  }
  assert.equal(canIndexSite(site, site, false), false);
});

test('account, transaction, legal drafts and preview routes are excluded from search pages', () => {
  for (const path of ['/login', '/registro', '/gracias', '/dashboard', '/modulos/1', '/mi-solicitud', '/admin', '/newsletter/confirmar', '/vista-previa', '/privacidad', '/api/launch/status']) {
    assert.equal(isSearchPage(path), false, path);
  }
  assert.equal(isSearchPage('/programa'), true);
  assert.equal(isSearchPage('/escuela-internacional-neuroeducacion-musical'), true);
  assert.equal(isSearchPage('/azahara-mateos'), false);
  assert.equal(isSearchPage('/blog/una-reflexion'), true);
});

test('sitemap includes only primary pages and explicitly published articles', () => {
  const empty = sitemapUrls(site, []);
  assert.equal(empty.length, 5);
  assert.ok(empty.includes('https://www.elarbolquesuena.com/escuela-internacional-neuroeducacion-musical'));
  assert.ok(!empty.some(url => url.includes('/azahara-mateos')));
  assert.ok(!empty.some(url => url.includes('/blog')));
  const published = sitemapUrls(site, ['una-reflexion']);
  assert.ok(published.includes('https://www.elarbolquesuena.com/blog/una-reflexion'));
  assert.ok(!published.some(url => /registro|login|vista-previa|0-9/.test(url)));
});

test('structured data describes the school and course without ratings or unconfirmed commercial facts', () => {
  const schema = pageStructuredData('/programa', 'Programa', 'Diez módulos', site);
  const graph = schema['@graph'] as Record<string, unknown>[];
  assert.ok(graph.some(entity => entity['@type'] === 'EducationalOrganization'));
  const course = graph.find(entity => entity['@type'] === 'Course');
  assert.ok(course);
  assert.equal(course.offers, undefined);
  assert.equal(course.aggregateRating, undefined);
  assert.equal(course.startDate, undefined);
});

test('sitemap values are escaped as XML', () => {
  assert.equal(escapeXml('a&b<c>"\''), 'a&amp;b&lt;c&gt;&quot;&apos;');
});

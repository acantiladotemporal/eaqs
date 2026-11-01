import assert from 'node:assert/strict';

// Only the local, credential-free production server. Never submits a form.
export async function auditNavigation(base) {
  const origin = new URL(base).origin;
  const cache = new Map();
  const links = new Map();
  const external = new Set();
  const queue = ['/', '/programa', '/escuela-internacional-neuroeducacion-musical', '/metodologia', '/contacto', '/registro', '/registro?error=closed', '/registro?sent=1', '/login', '/login?sent=1', '/login?error=expired', '/gracias', '/privacidad', '/cookies', '/aviso-legal', '/terminos', '/blog', '/newsletter/confirmar', '/newsletter/confirmar?done=pending', '/newsletter/baja', '/newsletter/baja?done=pending', '/condiciones', '/aviso.legal', '/pago', '/examen-1', '/no-existe-ensayo'];
  for (const route of ['/newsletter/confirmar', '/newsletter/baja']) queue.push(`${route}?token=${'a'.repeat(43)}`, `${route}?error=unavailable`);
  const decode = value => value.replace(/&amp;/g, '&').replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, dec) => String.fromCodePoint(parseInt(hex || dec, hex ? 16 : 10)));
  async function page(url, hops = 0) {
    assert.ok(hops < 6, `Redirect loop: ${url}`);
    const path = url.pathname + url.search;
    if (cache.has(path)) return cache.get(path);
    assert.equal(url.origin, origin, `Local audit cannot contact ${url.origin}`);
    const response = await fetch(url, { redirect: 'manual' });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const target = new URL(response.headers.get('location'), url);
      assert.equal(target.origin, origin, `Unexpected external redirect from ${path}`);
      const result = await page(target, hops + 1);
      cache.set(path, result);
      return result;
    }
    assert.equal(response.status, path === '/no-existe-ensayo' ? 404 : 200, `Broken destination: ${path}`);
    const html = (await response.text()).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => decode(match[1]));
    assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${path}`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `Expected one H1: ${path}`);
    const result = { html, ids: new Set(ids), path };
    cache.set(path, result);
    return result;
  }
  for (let index = 0; index < queue.length; index++) {
    const source = new URL(queue[index], base);
    const { html } = await page(source);
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/g)) {
      const href = decode(match[1]);
      assert.ok(href && href !== '#', `Empty link on ${source.pathname}`);
      assert.ok(!/^javascript:/i.test(href), `Script link on ${source.pathname}`);
      if (href.startsWith('mailto:')) {
        assert.match(href, /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/, `Invalid email link: ${href}`);
        continue;
      }
      const target = new URL(href, source);
      if (target.origin !== origin) { external.add(target.href); continue; }
      assert.ok(!/^\/azahara-mateos(?:\/|$)/.test(target.pathname), `Legacy school link on ${source.pathname}`);
      if (!links.has(target.href)) {
        links.set(target.href, source.pathname);
        const destination = await page(target);
        if (target.hash) assert.ok(destination.ids.has(decodeURIComponent(target.hash.slice(1))), `Missing anchor ${href} linked from ${source.pathname}`);
        if (!queue.includes(target.pathname + target.search)) queue.push(target.pathname + target.search);
      }
    }
    if (/^\/(registro|login|gracias|newsletter\/)/.test(source.pathname)) {
      assert.ok(!html.includes('data-newsletter-capture'), `Competing newsletter on focused page ${source.pathname}`);
      assert.ok(!html.includes('class="desktop-nav"'), `Retail menu on focused page ${source.pathname}`);
      assert.ok(html.includes('href="/contacto"') && html.includes('href="/privacidad"'), `Missing help or privacy on ${source.pathname}`);
    }
  }
  for (const path of ['/', '/programa', '/escuela-internacional-neuroeducacion-musical', '/metodologia', '/contacto']) {
    const { html } = await page(new URL(path, base));
    assert.match(html, /href="\/registro"/, `No admission route on ${path}`);
    assert.match(html, /data-newsletter-capture/, `No newsletter fallback on ${path}`);
  }
  return { pages: cache.size, links: links.size, external: [...external] };
}

// Read-only verification of our deployed, closed Worker. Never sends a form or queries a database.
import assert from 'node:assert/strict';
import { auditNavigation } from './navigation.audit.mjs';
const url = new URL(process.env.EAQS_WORKER_TEST_URL || 'http://127.0.0.1:4389');
assert.ok(url.hostname === '127.0.0.1' || (url.protocol === 'https:' && url.hostname.startsWith('eaqs.') && url.hostname.endsWith('.workers.dev')), 'Use the school Worker preview, not an arbitrary live site');
const base = url.origin;
const statusResponse = await fetch(base + '/api/launch/status');
assert.equal(statusResponse.status, 200);
const status = await statusResponse.json();
assert.equal(status.paymentsEnabled, false);
assert.equal(status.applicationsOpen, false);
let checks = 1;
for (const path of ['/dashboard', '/modulos/1', '/examen/1', '/foro', '/tutorias', '/trabajo-final', '/certificado', '/admin', '/mi-solicitud']) {
  const response = await fetch(base + path, { redirect: 'manual' });
  assert.equal(response.status, 303, path);
  assert.ok(response.headers.get('location').startsWith('/login?next='), path);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  checks++;
}
for (const path of ['/vista-previa', '/vista-previa/aula']) {
  const response = await fetch(base + path);
  assert.equal(response.status, 404, path);
  checks++;
}
for (const path of ['/images/brand-logo.png', '/fonts/dm-sans-latin.woff2', '/fonts/dm-serif-latin.woff2', '/og-image.png']) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  checks++;
}
const home = await fetch(base);
assert.equal(home.status, 200);
assert.match(home.headers.get('x-robots-tag'), /noindex/);
assert.ok(home.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
checks++;
const navigation = await auditNavigation(base);
console.log(`${checks} read-only Worker checks passed; ${navigation.links} links/anchors across ${navigation.pages} pages/states. No forms sent, no real accounts and no payments.`);

import test from 'node:test';
import assert from 'node:assert/strict';
import { objectKey, encodedObjectKey, privateFileRedirect, signedMaterial, SIGNED_URL_SECONDS } from '../src/lib/server/materials';
import type { SupabaseClient } from '@supabase/supabase-js';

test('object keys preserve legitimate names and encode each path segment', () => {
  assert.equal(objectKey('cohorte-01/módulo 1/clase.mp4'), 'cohorte-01/módulo 1/clase.mp4');
  assert.equal(encodedObjectKey('cohorte-01/módulo 1/clase.mp4'), 'cohorte-01/m%C3%B3dulo%201/clase.mp4');
});

test('object keys reject traversal, encoded input, query injection and control characters', () => {
  for (const key of ['', '/curso/video.mp4', 'curso//video.mp4', 'curso/', '../video.mp4', 'curso/../video.mp4', 'curso/./video.mp4', 'curso\\video.mp4', 'curso/%2e%2e/video.mp4', 'curso/video.mp4?x=1', 'curso/video.mp4#x', 'curso/\nvideo.mp4', ' curso/video.mp4', 'curso/video.mp4 ']) {
    assert.throws(() => objectKey(key), { status: 400 }, key);
  }
});

test('private material redirects never cache links or propagate a referrer', () => {
  const response = privateFileRedirect('https://example.invalid/file?signature=sample');
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(SIGNED_URL_SECONDS, 300);
});

test('R2 GET signing is local, temporary and cannot change the configured host', async () => {
  const values: Record<string, string> = { R2_ACCOUNT_ID: 'a'.repeat(32), R2_BUCKET_NAME: 'course-materials', R2_ACCESS_KEY_ID: 'test-access-key', R2_SECRET_ACCESS_KEY: 'test-secret-key' };
  const previous = Object.fromEntries(Object.keys(values).map(name => [name, process.env[name]]));
  Object.assign(process.env, values);
  try {
    const value = await signedMaterial({storage_provider: 'r2', storage_path: 'cohorte-01/módulo 1/clase.mp4', title: 'Clase'}, {} as SupabaseClient);
    const url = new URL(value);
    assert.equal(url.hostname, `${'a'.repeat(32)}.r2.cloudflarestorage.com`);
    assert.equal(url.pathname, '/course-materials/cohorte-01/m%C3%B3dulo%201/clase.mp4');
    assert.equal(url.searchParams.get('X-Amz-Expires'), '300');
    assert.equal(url.searchParams.get('X-Amz-Algorithm'), 'AWS4-HMAC-SHA256');
    assert.ok(url.searchParams.get('X-Amz-Signature'));
    assert.ok(!value.includes('test-secret-key'));
  } finally {
    for (const name of Object.keys(values)) previous[name] === undefined ? delete process.env[name] : process.env[name] = previous[name];
  }
});

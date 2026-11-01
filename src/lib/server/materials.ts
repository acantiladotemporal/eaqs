import { AwsClient } from 'aws4fetch';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from './config';
import { HttpError } from './security';

export const SIGNED_URL_SECONDS = 300;
export interface MaterialLocation {
  storage_provider?: string;
  storage_path: string;
  title: string;
}

/** Treat storage keys as object names, never as URLs or filesystem paths. */
export function objectKey(value: string): string {
  if (!value || value !== value.trim() || value.length > 1024 || /[\\%?#\u0000-\u001f\u007f]/.test(value)) {
    throw new HttpError(400, 'La ruta del archivo no es válida.');
  }
  const segments = value.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new HttpError(400, 'La ruta del archivo no es válida.');
  }
  return value;
}

export function encodedObjectKey(value: string): string {
  return objectKey(value).split('/').map(segment => encodeURIComponent(segment)).join('/');
}

export async function signedMaterial(resource: MaterialLocation, db: SupabaseClient): Promise<string> {
  const key = objectKey(resource.storage_path);
  const provider = resource.storage_provider || 'supabase';
  if (provider === 'supabase') {
    const { data, error } = await db.storage.from('course-materials').createSignedUrl(key, SIGNED_URL_SECONDS);
    if (error || !data?.signedUrl) throw new HttpError(503, 'No se ha podido abrir el material.');
    const signed = new URL(data.signedUrl);
    if (signed.protocol !== 'https:' && !(import.meta.env?.DEV && ['localhost', '127.0.0.1'].includes(signed.hostname))) {
      throw new HttpError(503, 'No se ha podido abrir el material.');
    }
    return signed.toString();
  }
  if (provider !== 'r2') throw new HttpError(400, 'Proveedor de archivos no válido.');

  const accountId = env('R2_ACCOUNT_ID');
  const bucket = env('R2_BUCKET_NAME');
  const accessKeyId = env('R2_ACCESS_KEY_ID');
  const secretAccessKey = env('R2_SECRET_ACCESS_KEY');
  if (!/^[a-f0-9]{32}$/i.test(accountId) || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || !accessKeyId || !secretAccessKey) {
    throw new HttpError(503, 'El servicio de materiales no está disponible.');
  }
  const url = new URL(`https://${accountId.toLowerCase()}.r2.cloudflarestorage.com/${bucket}/${encodedObjectKey(key)}`);
  url.searchParams.set('X-Amz-Expires', String(SIGNED_URL_SECONDS));
  const client = new AwsClient({ service: 's3', region: 'auto', accessKeyId, secretAccessKey });
  const signed = await client.sign(new Request(url, { method: 'GET' }), { aws: { signQuery: true } });
  return signed.url;
}

export function privateFileRedirect(url: string): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: url,
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

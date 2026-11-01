import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/server/auth';
import { objectKey, privateFileRedirect, SIGNED_URL_SECONDS } from '../../../lib/server/materials';
import { errorResponse, HttpError, uuid } from '../../../lib/server/security';

export const GET: APIRoute = async context => {
  try {
    const { db, user } = requireUser(context);
    const id = uuid(context.params.id || '');
    const { data, error } = await db.from('submissions').select('user_id,storage_path').eq('id', id).maybeSingle();
    if (error) throw new HttpError(503, 'No se ha podido abrir la entrega.');
    if (!data?.storage_path || (!context.locals.isAdmin && data.user_id !== user.id)) {
      throw new HttpError(404, 'Este documento no está disponible.');
    }
    const key = objectKey(data.storage_path);
    if (!key.startsWith(`${data.user_id}/`)) throw new HttpError(404, 'Este documento no está disponible.');
    const { data: file, error: fileError } = await db.storage.from('assignments').createSignedUrl(key, SIGNED_URL_SECONDS, { download: 'trabajo-final.pdf' });
    if (fileError || !file?.signedUrl) throw new HttpError(503, 'No se ha podido abrir la entrega.');
    return privateFileRedirect(file.signedUrl);
  } catch (error) { return errorResponse(error); }
};

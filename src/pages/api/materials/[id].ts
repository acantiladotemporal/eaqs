import type { APIRoute } from 'astro';
import { requireEnrollment, requireUser } from '../../../lib/server/auth';
import { signedMaterial, privateFileRedirect } from '../../../lib/server/materials';
import { errorResponse, HttpError, uuid } from '../../../lib/server/security';

export const GET: APIRoute = async context => {
  try {
    const { db } = requireUser(context);
    if (!context.locals.isAdmin) requireEnrollment(context);
    const id = uuid(context.params.id || '');
    // The request-scoped client applies module/cohort/date/participation RLS before signing.
    const { data, error } = await db.from('resources').select('storage_provider,storage_path,title').eq('id', id).maybeSingle();
    if (error) throw new HttpError(503, 'No se ha podido abrir el material.');
    if (!data) throw new HttpError(404, 'Este material no está disponible.');
    return privateFileRedirect(await signedMaterial(data, db));
  } catch (error) { return errorResponse(error); }
};

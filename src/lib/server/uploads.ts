import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from './security';

export async function uploadPdf(db:SupabaseClient,bucket:'assignments'|'course-materials',prefix:string,file:File):Promise<string> {
  if (file.size === 0 || file.size > 10 * 1024 * 1024 || file.type !== 'application/pdf') throw new HttpError(400,'Selecciona un PDF de hasta 10 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') throw new HttpError(400,'El documento no es un PDF válido.');
  const path = `${prefix}/${crypto.randomUUID()}.pdf`;
  const {error} = await db.storage.from(bucket).upload(path,bytes,{contentType:'application/pdf',upsert:false});
  if (error) throw new HttpError(503,'No se pudo guardar el archivo.');
  return path;
}

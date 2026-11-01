import { randomBytes, createHash } from 'node:crypto';
import { adminClient } from './auth';
import { env } from './config';
import { escapeHtml, HttpError } from './security';
import { rateLimit } from './limits';

export const token = () => randomBytes(32).toString('base64url');
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');
export function mailTemplate(title: string, message: string, link?: {label:string;url:string}) {
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#3f3832;max-width:600px"><p>El Árbol Que Suena</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>${link ? `<p><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></p>` : ''}<p>Escuela Internacional de Neuroeducación Musical</p></div>`;
  return {subject:title,html,text:`${message}${link ? `\n${link.label}: ${link.url}` : ''}`};
}
export async function sendQueuedMail(id: string) {
  const service = adminClient();
  const {data:mail,error} = await service.from('email_outbox').select('*').eq('id',id).single();
  if (error || !mail) throw new HttpError(404,'Mensaje no encontrado.');
  if (mail.status === 'sent') return true;
  const apiKey = env('RESEND_API_KEY');
  const from = env('RESEND_FROM_EMAIL');
  if (!apiKey || !from) return false;
  try {
    await rateLimit('email:daily',90,86400);
    const response = await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':mail.dedupe_key},
      body:JSON.stringify({from,to:[mail.recipient],subject:mail.subject,html:mail.html,text:mail.body_text}),
      signal:AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Proveedor de correo: HTTP ${response.status}`);
    const result = await response.json() as {id?:string};
    const saved = await service.from('email_outbox').update({status:'sent',sent_at:new Date().toISOString(),attempts:mail.attempts+1,provider_id:result.id || null,last_error:null}).eq('id',id);
    if (saved.error) throw new Error('No se pudo registrar la entrega.');
    return true;
  } catch(error) {
    await service.from('email_outbox').update({status:'failed',attempts:mail.attempts+1,last_error:error instanceof Error ? error.message : 'Error de entrega'}).eq('id',id).neq('status','sent');
    return false;
  }
}
export async function queueMail(recipient:string,dedupeKey:string,template:ReturnType<typeof mailTemplate>) {
  const service = adminClient();
  const inserted = await service.from('email_outbox').upsert({dedupe_key:dedupeKey,recipient,subject:template.subject,html:template.html,body_text:template.text},{onConflict:'dedupe_key',ignoreDuplicates:true}).select('id').maybeSingle();
  if (inserted.error) throw new HttpError(503,'No se pudo preparar el correo.');
  let id = inserted.data?.id;
  if (!id) {
    const found = await service.from('email_outbox').select('id').eq('dedupe_key',dedupeKey).single();
    if (found.error) throw new HttpError(503,'No se pudo recuperar el correo.');
    id = found.data.id;
  }
  return sendQueuedMail(id);
}

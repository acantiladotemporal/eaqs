import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/server/auth';
import { formData,text,optionalText,uuid,safeNext,redirectTo,HttpError } from '../../../lib/server/security';
import { siteUrl } from '../../../lib/server/config';
import { mailTemplate,queueMail,sendQueuedMail } from '../../../lib/server/email';
import { uploadPdf } from '../../../lib/server/uploads';
import { syncNewsletterSubscriber } from '../../../lib/server/newsletter-provider';

function dateOrNull(value:string):string|null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value) || Number.isNaN(Date.parse(value))) throw new HttpError(400,'Incluye fecha, hora y zona horaria.');
  return new Date(value).toISOString();
}
function checked(result:{error:unknown}) { if (result.error) throw new HttpError(400,'No se ha podido guardar el cambio. Revisa los datos y los requisitos.'); }
function required(data:FormData,key:string,max:number,min=1) { const value=text(data,key,max); if(value.length<min) throw new HttpError(400,'Completa los campos obligatorios.'); return value; }

export const POST:APIRoute = async context => {
  let returnTo = '/admin';
  let emailPending = false;
  try {
    const {db,user} = requireAdmin(context);
    const data = await formData(context);
    returnTo = safeNext(optionalText(data,'return_to',1000),'/admin');
    if (!returnTo.startsWith('/admin')) returnTo='/admin';
    const action=text(data,'action',80);
    let targetId:string|null=null;
    if(action==='review_application') {
      const id=uuid(text(data,'application_id',36));targetId=id;
      const status=text(data,'status',30);
      if (!['submitted','accepted','rejected','waitlisted'].includes(status)) throw new HttpError(400,'Estado no válido.');
      checked(await db.rpc('review_application',{p_application_id:id,p_status:status}));
      const {data:application,error}=await db.from('applications').select('email,full_name').eq('id',id).single(); checked({error});
      if(application) {
        const messages:Record<string,string>={accepted:'Tu solicitud ha sido aceptada. Tu matrícula queda pendiente de pago. La escuela te comunicará los siguientes pasos; todavía no hay ningún cobro ni acceso al curso.',rejected:'Gracias por tu interés. La escuela ha revisado tu solicitud y no podrá ofrecerte plaza en esta edición.',waitlisted:'Tu solicitud está en la lista de espera. La escuela se pondrá en contacto contigo si hay una plaza disponible.',submitted:'Tu solicitud vuelve a estar en revisión.'};
        try {
          emailPending = !await queueMail(application.email,`application-review:${id}:${status}`,mailTemplate('Novedades sobre tu solicitud',`Hola, ${application.full_name}. ${messages[status]}`,{label:'Consultar mi solicitud',url:new URL('/mi-solicitud',siteUrl()).href}));
        } catch { emailPending = true; }
      }
    } else if(action==='save_cohort') {
      targetId=uuid(text(data,'cohort_id',36));
      checked(await db.from('cohorts').update({title:required(data,'title',180),start_at:dateOrNull(optionalText(data,'start_at',60)),applications_open:data.has('applications_open')}).eq('id',targetId).select('id').single());
    } else if(action==='save_module') {
      targetId=uuid(text(data,'module_id',36));
      checked(await db.from('modules').update({title:required(data,'title',180),summary:optionalText(data,'summary',1000),body:optionalText(data,'body',50000),unlock_at:dateOrNull(optionalText(data,'unlock_at',60)),published:data.has('published')}).eq('id',targetId).select('id').single());
    } else if(action==='save_resource') {
      const moduleId=uuid(text(data,'module_id',36));targetId=moduleId;
      const title=required(data,'title',180);
      const kind=text(data,'kind',20);
      if(!['document','video'].includes(kind)) throw new HttpError(400,'Tipo no válido.');
      const provider=optionalText(data,'storage_provider',20)||'supabase';
      let path='';
      if(provider==='r2') {
        path=required(data,'storage_path',500);
        if(!/^[\w\-/\.]+$/.test(path)||path.split('/').some(part=>!part||part==='.'||part==='..')||!path.startsWith(`${moduleId}/`)) throw new HttpError(400,'La ruta debe pertenecer a la carpeta del módulo.');
      } else if(provider==='supabase' && kind==='document') {
        const file=data.get('file');
        if(!(file instanceof File)) throw new HttpError(400,'Selecciona un archivo PDF.');
        path=await uploadPdf(db,'course-materials',moduleId,file);
      } else throw new HttpError(400,'Utiliza almacenamiento R2 para el vídeo preparado.');
      const result=await db.from('resources').insert({module_id:moduleId,title,kind,storage_path:path,storage_provider:provider});
      if(result.error && provider==='supabase') await db.storage.from('course-materials').remove([path]);
      checked(result);
    } else if(action==='save_quiz') {
      const moduleId=uuid(text(data,'module_id',36));targetId=moduleId;
      const options=optionalText(data,'options',10000).split(/\r?\n/).map(option=>option.trim()).filter(Boolean);
      if(options.length>10 || options.some(option=>option.length>1000) || new Set(options).size!==options.length) throw new HttpError(400,'Revisa las opciones de respuesta.');
      const record={module_id:moduleId,prompt:required(data,'prompt',2000),options};
      const id=optionalText(data,'question_id',36);
      checked(id ? await db.from('quiz_questions').update(record).eq('id',uuid(id)).eq('module_id',moduleId).select('id').single() : await db.from('quiz_questions').insert(record));
    } else if(action==='save_assignment') {
      const cohortId=uuid(text(data,'cohort_id',36));targetId=cohortId;
      const record={cohort_id:cohortId,title:required(data,'title',180),instructions:required(data,'instructions',20000),published:data.has('published')};
      const id=optionalText(data,'assignment_id',36);
      checked(id ? await db.from('assignments').update(record).eq('id',uuid(id)).eq('cohort_id',cohortId).select('id').single() : await db.from('assignments').insert(record));
    } else if(action==='review_submission') {
      targetId=uuid(text(data,'submission_id',36));
      const status=text(data,'status',30);
      if(!['submitted','revision_requested','approved'].includes(status))throw new HttpError(400,'Estado no válido.');
      checked(await db.from('submissions').update({status,feedback:optionalText(data,'feedback',10000),reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq('id',targetId).select('id').single());
    } else if(action==='issue_certificate') {
      targetId=uuid(text(data,'user_id',36));
      checked(await db.rpc('issue_certificate',{p_user_id:targetId,p_cohort_id:uuid(text(data,'cohort_id',36))}));
    } else if(action==='moderate_topic'||action==='moderate_reply') {
      const topic=action==='moderate_topic';
      targetId=uuid(text(data,topic?'topic_id':'reply_id',36));
      checked(await db.from(topic?'forum_topics':'forum_replies').update({hidden:optionalText(data,'hidden',10)==='true'}).eq('id',targetId).select('id').single());
    } else if(action==='save_tutoring') {
      targetId=uuid(text(data,'cohort_id',36));
      const startsAt=dateOrNull(required(data,'starts_at',60));
      let meetingUrl=optionalText(data,'meeting_url',1000);
      if(meetingUrl && new URL(meetingUrl).protocol!=='https:')throw new HttpError(400,'El enlace debe utilizar HTTPS.');
      checked(await db.from('tutoring_sessions').insert({cohort_id:targetId,title:required(data,'title',180),starts_at:startsAt,meeting_url:meetingUrl||null,notes:optionalText(data,'notes',5000)}));
    } else if(action==='retry_email') {
      targetId=uuid(text(data,'email_id',36));
      if(!await sendQueuedMail(targetId))throw new HttpError(503,'El correo sigue pendiente de entrega.');
    } else if(action==='retry_newsletter_sync') {
      targetId=uuid(text(data,'subscriber_id',36));
      if(!await syncNewsletterSubscriber(targetId))throw new HttpError(503,'La sincronización sigue pendiente.');
    } else throw new HttpError(400,'Operación no válida.');
    if(!['review_application','issue_certificate'].includes(action)) checked(await db.from('admin_audit').insert({actor_id:user.id,action,target_id:targetId,details:{}}));
    return redirectTo(returnTo,'success',emailPending ? 'email_pending' : 'saved');
  } catch(error) {
    return redirectTo(returnTo,'error',error instanceof HttpError && error.status===400?'validation':'unavailable');
  }
};

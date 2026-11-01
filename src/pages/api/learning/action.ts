import type { APIRoute } from 'astro';
import { requireEnrollment } from '../../../lib/server/auth';
import { formData,text,optionalText,uuid,safeNext,redirectTo,HttpError } from '../../../lib/server/security';
import { uploadPdf } from '../../../lib/server/uploads';
import { rateLimit } from '../../../lib/server/limits';

export const POST:APIRoute = async context => {
  let returnTo='/dashboard';
  try {
    const {user,db,enrollment}=requireEnrollment(context);
    const data=await formData(context);
    returnTo=safeNext(optionalText(data,'return_to',1000),'/dashboard');
    const action=text(data,'action',50);
    await rateLimit(`learning:${user.id}`,100,3600);
    let result:{error:unknown};
    if(action==='complete_quiz') {
      const moduleId=uuid(text(data,'module_id',36));
      const questions=await db.from('quiz_questions').select('id,options').eq('module_id',moduleId);
      if(questions.error || !questions.data?.length)throw new HttpError(400,'Cuestionario no disponible.');
      const answers:Record<string,string>={};
      for(const question of questions.data) {
        const answer=text(data,`q_${question.id}`,5000);
        if(!answer || !Array.isArray(question.options) || question.options.length && !question.options.includes(answer)) throw new HttpError(400,'Responde a todas las preguntas.');
        answers[question.id]=answer;
      }
      result=await db.from('quiz_participations').upsert({user_id:user.id,module_id:moduleId,answers,completed_at:new Date().toISOString()},{onConflict:'user_id,module_id'});
    } else if(action==='submit_assignment') {
      const assignmentId=uuid(text(data,'assignment_id',36));
      const content=text(data,'content',20000);
      if(content.length<20)throw new HttpError(400,'Desarrolla tu trabajo antes de enviarlo.');
      const old=await db.from('submissions').select('id,status,storage_path').eq('user_id',user.id).eq('assignment_id',assignmentId).maybeSingle();
      if(old.error || old.data?.status==='approved')throw new HttpError(400,'El trabajo aprobado ya no se puede modificar.');
      const file=data.get('file');
      let path=old.data?.storage_path||null;
      const newFile=file instanceof File && file.size>0;
      if(newFile) path=await uploadPdf(db,'assignments',user.id,file as File);
      const record={user_id:user.id,assignment_id:assignmentId,content,storage_path:path,status:'submitted',feedback:null,reviewed_by:null,reviewed_at:null};
      result=old.data ? await db.from('submissions').update(record).eq('id',old.data.id).select('id').single() : await db.from('submissions').insert(record).select('id').single();
      if(result.error && newFile && path)await db.storage.from('assignments').remove([path]);
      if(!result.error && newFile && old.data?.storage_path)await db.storage.from('assignments').remove([old.data.storage_path]);
    } else if(action==='create_topic') {
      const title=text(data,'title',180),body=text(data,'body',10000);
      if(title.length<3||body.length<5)throw new HttpError(400,'Escribe un título y un mensaje.');
      result=await db.from('forum_topics').insert({cohort_id:enrollment.cohort_id,author_id:user.id,title,body});
    } else if(action==='reply_topic') {
      const body=text(data,'body',10000);
      if(body.length<3)throw new HttpError(400,'Escribe una respuesta de al menos tres caracteres.');
      result=await db.from('forum_replies').insert({topic_id:uuid(text(data,'topic_id',36)),author_id:user.id,body});
    } else throw new HttpError(400,'Operación no válida.');
    if(result.error)throw new HttpError(400,'No se pudo guardar. Revisa la disponibilidad y los campos.');
    return redirectTo(returnTo,'success','saved');
  } catch(error) {
    return redirectTo(returnTo,'error',error instanceof HttpError && error.status===400?'validation':'unavailable');
  }
};

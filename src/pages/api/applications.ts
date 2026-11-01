import type { APIRoute } from 'astro';
import { adminClient, requestClient } from '../../lib/server/auth';
import { DEFAULT_COHORT_ID, env } from '../../lib/server/config';
import { formData, text, optionalText, emailAddress, redirectTo, HttpError } from '../../lib/server/security';
import { limitPublicRequest } from '../../lib/server/limits';
import { mailTemplate, queueMail } from '../../lib/server/email';
import { subscribeNewsletter } from '../../lib/server/newsletter';

export const POST: APIRoute = async context => {
  try {
    const data = await formData(context);
    if (optionalText(data,'website',200)) return redirectTo('/registro','sent','1');
    if (env('LEGAL_READY') !== 'true') throw new HttpError(503,'Admisiones aún no disponibles.');
    const email = emailAddress(text(data,'email',254));
    const fullName = text(data,'full_name',160);
    const country = text(data,'country',100);
    const role = text(data,'role',160);
    const ageRange = text(data,'age_range',10);
    const motivation = text(data,'motivation',3000);
    if (fullName.length<2 || country.length<2 || role.length<2 || motivation.length<20 || !['0-3','3-6','0-6','other'].includes(ageRange) || !data.has('privacy')) throw new HttpError(400,'Revisa el formulario y acepta la política de privacidad.');
    await limitPublicRequest(context,'application',email);
    const service = adminClient();
    const {data:cohort,error:cohortError} = await service.from('cohorts').select('id,applications_open,published').eq('id',DEFAULT_COHORT_ID).single();
    if (cohortError || !cohort?.published || !cohort.applications_open) return redirectTo('/registro','error','closed');
    let userId:string|null=null;
    if(context.request.headers.has('cookie')) {
      const session=requestClient(context);
      const verified=session ? await session.auth.getUser() : null;
      if(!verified?.error && verified?.data.user?.email_confirmed_at && verified.data.user.email?.toLowerCase()===email) userId=verified.data.user.id;
    }
    const saved = await service.from('applications').upsert({cohort_id:cohort.id,user_id:userId,email,full_name:fullName,country,role,age_range:ageRange,motivation,privacy_version:'2026-11',consented_at:new Date().toISOString()},{onConflict:'cohort_id,email',ignoreDuplicates:true}).select('id').maybeSingle();
    if (saved.error) throw new HttpError(503,'No se pudo guardar la solicitud.');
    if(userId) {
      const linked=await service.rpc('claim_application',{p_user_id:userId,p_email:email});
      if(linked.error)throw new HttpError(503,'La solicitud se ha guardado pero no se pudo vincular.');
    }
    if (saved.data) await queueMail(email,`application-received:${saved.data.id}`,mailTemplate('Hemos recibido tu solicitud',`Gracias, ${fullName}. La escuela revisará tu solicitud para la próxima edición. Solicitar y aceptar una plaza no implica haber realizado el pago ni disponer todavía de acceso al curso.`));
    if (data.has('newsletter')) {
      try { await subscribeNewsletter(email,'application'); } catch { /* Application remains valid; newsletter still requires confirmation. */ }
    }
    return redirectTo('/registro','sent','1');
  } catch(error) {
    return redirectTo('/registro','error',error instanceof HttpError && error.status === 400 ? 'validation' : error instanceof HttpError && error.status === 429 ? 'rate' : 'unavailable');
  }
};

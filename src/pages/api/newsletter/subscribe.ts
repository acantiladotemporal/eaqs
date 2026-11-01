import type { APIRoute } from 'astro';
import { formData,text,optionalText,emailAddress,redirectTo,HttpError } from '../../../lib/server/security';
import { env } from '../../../lib/server/config';
import { limitPublicRequest } from '../../../lib/server/limits';
import { subscribeNewsletter } from '../../../lib/server/newsletter';
export const POST:APIRoute=async context=>{
  let source: 'home' | 'footer' = 'home';
  const response = (state: string) => redirectTo(`/?newsletter_source=${source}#${source === 'footer' ? 'newsletter-footer' : 'newsletter'}`, 'newsletter', state);
  try {
    const data=await formData(context);
    source = optionalText(data,'source',100) === 'footer' ? 'footer' : 'home';
    if(optionalText(data,'website',200))return response('pending');
    if(env('LEGAL_READY')!=='true')throw new HttpError(503,'Suscripciones aún no disponibles.');
    const email=emailAddress(text(data,'email',254));
    if(!data.has('consent'))throw new HttpError(400,'Necesitamos tu consentimiento.');
    await limitPublicRequest(context,'newsletter',email);
    await subscribeNewsletter(email,source);
    return response('pending');
  } catch { return response('error'); }
};

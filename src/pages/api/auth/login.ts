import type { APIRoute } from 'astro';
import { requestClient } from '../../../lib/server/auth';
import { siteUrl } from '../../../lib/server/config';
import { formData, emailAddress, text, optionalText, safeNext, redirectTo } from '../../../lib/server/security';
import { limitPublicRequest, rateLimit } from '../../../lib/server/limits';

export const POST: APIRoute = async context => {
  try {
    const data = await formData(context);
    if (optionalText(data,'website',200)) return redirectTo('/login','sent','1');
    const email = emailAddress(text(data,'email',254));
    const next = safeNext(optionalText(data,'next',1000));
    await limitPublicRequest(context,'login',email);
    const db = requestClient(context);
    if (!db) return redirectTo('/login','error','unavailable');
    const callback = new URL('/auth/confirm',siteUrl());
    callback.searchParams.set('next', next);
    await rateLimit('email:daily',90,86400);
    const { error } = await db.auth.signInWithOtp({email,options:{emailRedirectTo:callback.href, shouldCreateUser:true}});
    if (error) return redirectTo('/login','error','unavailable');
    return redirectTo('/login','sent','1');
  } catch { return redirectTo('/login','error','unavailable'); }
};

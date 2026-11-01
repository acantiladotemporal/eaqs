import type { APIRoute } from 'astro';
import { adminClient, requestClient } from '../../lib/server/auth';
import { safeNext, redirectTo } from '../../lib/server/security';

export const GET: APIRoute = async context => {
  try {
    const db = requestClient(context);
    if (!db) return redirectTo('/login','error','unavailable');
    const code = context.url.searchParams.get('code');
    const tokenHash = context.url.searchParams.get('token_hash');
    const type = context.url.searchParams.get('type');
    if (code) {
      const {error} = await db.auth.exchangeCodeForSession(code);
      if (error) return redirectTo('/login','error','expired');
    } else if (tokenHash && ['email','magiclink','signup','invite'].includes(type || '')) {
      const {error} = await db.auth.verifyOtp({token_hash:tokenHash,type:type as 'email'});
      if (error) return redirectTo('/login','error','expired');
    } else return redirectTo('/login','error','expired');
    const {data:{user},error} = await db.auth.getUser();
    if (error || !user?.email_confirmed_at || !user.email) return redirectTo('/login','error','expired');
    const claim = await adminClient().rpc('claim_application',{p_user_id:user.id,p_email:user.email.toLowerCase()});
    if (claim.error) return redirectTo('/login','error','unavailable');
    return context.redirect(safeNext(context.url.searchParams.get('next')),303);
  } catch { return redirectTo('/login','error','unavailable'); }
};

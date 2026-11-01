import type { APIRoute } from 'astro';
import { adminClient } from '../../../lib/server/auth';
import { DEFAULT_COHORT_ID, env, PAYMENTS_ENABLED } from '../../../lib/server/config';
export const GET:APIRoute=async()=>{
  let applicationsOpen=false;
  try {
    const {data,error}=await adminClient().from('cohorts').select('applications_open,published').eq('id',DEFAULT_COHORT_ID).single();
    applicationsOpen=Boolean(!error && data?.published && data.applications_open && env('LEGAL_READY')==='true');
  } catch { /* Fail closed if the service is unavailable. */ }
  return Response.json({applicationsOpen,paymentsEnabled:PAYMENTS_ENABLED,seatLimit:20,priceNow:390,priceAfter:490,datesConfirmed:false},{headers:{'Cache-Control':'no-store'}});
};

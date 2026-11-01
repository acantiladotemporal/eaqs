import type { APIRoute } from 'astro';
import { formData, errorResponse } from '../../../lib/server/security';
export const POST: APIRoute = async context => {
  try {
    await formData(context);
    await context.locals.db?.auth.signOut();
    return context.redirect('/login',303);
  } catch(error) { return errorResponse(error); }
};

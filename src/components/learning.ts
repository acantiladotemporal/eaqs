export const INITIAL_COHORT_ID = '11111111-1111-4111-8111-111111111111';
export function madridDate(value: string | null | undefined, includeTime = false) {
  if (!value) return 'Fecha por confirmar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', ...(includeTime ? { timeStyle: 'short' as const } : {}), timeZone: 'Europe/Madrid' }).format(date);
}
export function formNotice(url: URL) {
  if (url.searchParams.get('success') === 'email_pending') return {kind:'notice',message:'La decisión se ha guardado. El correo sigue pendiente: consulta la pestaña Correo para revisar su entrega.'};
  if (url.searchParams.has('saved') || url.searchParams.get('success') === 'saved') return { kind: 'success', message: 'Los cambios se han guardado.' };
  if (url.searchParams.has('sent')) return { kind: 'success', message: 'Tu participación se ha registrado.' };
  if (url.searchParams.has('error')) return { kind: 'error', message: 'No hemos podido completar la operación. Revisa los datos y vuelve a intentarlo.' };
  return null;
}
export const applicationLabels: Record<string, string> = { submitted: 'En revisión', accepted: 'Aceptada · pendiente de pago', rejected: 'No aceptada', waitlisted: 'Lista de espera' };
export const submissionLabels: Record<string, string> = { submitted: 'Pendiente de revisión', revision_requested: 'Revisión solicitada', approved: 'Aprobado' };

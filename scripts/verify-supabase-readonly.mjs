// Explicit remote verification: only GET requests with the public client key.
// Run separately from the local suite; never send email, create users or enroll.
const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (url !== 'https://bgmkkvgcaygtcfphkvlv.supabase.co' || !key?.startsWith('sb_publishable_')) {
  throw new Error('Configura la URL de EAQS y su clave publicable moderna antes de verificar.');
}
const cases = [
  ['cohorts', [200]],
  ['profiles', [401, 403]],
  ['applications', [401, 403]],
  ['enrollments', [401, 403]],
  ['modules', [401, 403]],
  ['newsletter_subscribers', [401, 403]],
  ['email_outbox', [401, 403]],
  ['admin_audit', [401, 403]],
];
const results = await Promise.allSettled(cases.map(async ([table, allowed]) => {
  const select = table === 'cohorts' ? 'id,seat_limit' : '*';
  const response = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=1`, {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  });
  if (!allowed.includes(response.status)) throw new Error(`${table}: estado inesperado ${response.status}`);
  if (table === 'cohorts') {
    const rows = await response.json();
    if (rows.length !== 1 || rows[0].id !== '11111111-1111-4111-8111-111111111111' || rows[0].seat_limit !== 20) {
      throw new Error('La cohorte pública no coincide con la configuración aprobada.');
    }
  }
  return { table, status: response.status };
}));
let failed = false;
for (let i = 0; i < results.length; i++) {
  const result = results[i];
  if (result.status === 'fulfilled') console.log(`${result.value.table}: ${result.value.status} correcto`);
  else { failed = true; console.error(`${cases[i][0]}: verificación fallida (${result.reason.message})`); }
}
if (failed) process.exitCode = 1;
else console.log('8 comprobaciones remotas de solo lectura superadas.');

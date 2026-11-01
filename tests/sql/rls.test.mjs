import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const cohort = '11111111-1111-4111-8111-111111111111';
const otherCohort = '11111111-1111-4111-8111-111111111112';
const student = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const otherStudent = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const pending = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const applicant = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const admin = '99999999-9999-4999-8999-999999999999';
const moduleId = (n) => `22222222-2222-4222-8222-${String(n).padStart(12, '0')}`;
const questionId = (n) => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`;
const appId = (n) => `44444444-4444-4444-8444-${String(n).padStart(12, '0')}`;
const topic = '55555555-5555-4555-8555-555555555555';
const assignment = '66666666-6666-4666-8666-666666666666';

async function identify(db, id, role = 'authenticated', appRole = null) {
  await db.exec('reset role');
  const claims = { role, ...(id ? { sub: id, email: `${id}@example.test`, app_metadata: { role: appRole } } : {}) };
  await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify(claims)]);
  await db.exec(`set role ${role}`);
}
async function count(db, table) {
  return Number((await db.query(`select count(*) n from public.${table}`)).rows[0].n);
}

async function migrate(db) {
  const directory = new URL('../../supabase/migrations/', import.meta.url);
  const files = (await readdir(directory)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  for (const file of files) await db.exec(await readFile(new URL(file, directory), 'utf8'));
}

test('EAQS schema enforces admission, cohort isolation and participation in PostgreSQL', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role;
    grant all on storage.objects to anon,authenticated,service_role;
    grant all on storage.buckets to service_role;
  `);
  await migrate(db);
  for (const id of [student, otherStudent, pending, applicant, admin]) {
    await db.query('insert into auth.users values($1,$2,now())', [id, `${id}@example.test`]);
    await db.query('insert into public.profiles(id,full_name) values($1,$2)', [id, `Docente ${id[0]}`]);
  }
  await db.query('insert into public.cohorts(id,slug,title,published,applications_open) values($1,$2,$3,true,true)', [otherCohort, 'segunda', 'Segunda cohorte']);
  for (const [n, user, cohortId, status] of [[1, student, cohort, 'accepted'], [2, otherStudent, otherCohort, 'accepted'], [3, pending, cohort, 'accepted'], [4, applicant, cohort, 'submitted']]) {
    await db.query(`insert into public.applications(id,cohort_id,user_id,email,full_name,country,role,age_range,motivation,status,privacy_version,consented_at)
      values($1,$2,$3,$4,'Docente de prueba','España','Docente','3-6','Una motivación suficientemente extensa para la prueba.',$5,'2026-11',now())`, [appId(n), cohortId, user, `${user}@example.test`, status]);
    if (status === 'accepted') await db.query("insert into public.enrollments(cohort_id,user_id,application_id,status,paid_at) values($1,$2,$3,$4,$5)", [cohortId,user,appId(n),n === 3 ? 'pending_payment' : 'active',n === 3 ? null : new Date().toISOString()]);
  }
  await db.query("update public.modules set published=true,unlock_at=now()-interval '1 day' where position<=2");
  await db.query("update public.modules set published=true,unlock_at=now()+interval '1 day' where position=3");
  await db.query("insert into public.quiz_questions(id,module_id,prompt,options) values($1,$2,'¿Qué has observado?', '[\"Pulso\",\"Escucha\"]')", [questionId(1), moduleId(1)]);
  await db.query("insert into public.quiz_questions(id,module_id,prompt,options) values($1,$2,'Comparte tu reflexión.','[]')", [questionId(2),moduleId(2)]);
  await db.query("insert into public.resources(module_id,title,kind,storage_path) values($1,'Material privado','document','cohorte/modulo-1.pdf'),($2,'Material posterior','document','cohorte/modulo-2.pdf')", [moduleId(1),moduleId(2)]);
  await db.query("insert into storage.objects(bucket_id,name) values('course-materials','cohorte/modulo-1.pdf'),('course-materials','cohorte/modulo-2.pdf')");
  await db.query("insert into public.forum_topics(id,cohort_id,author_id,title,body) values($1,$2,$3,'Tema de prueba','Una conversación privada de la cohorte.')", [topic,cohort,student]);
  await db.query("insert into public.assignments(id,cohort_id,title,instructions,published) values($1,$2,'Trabajo final','Instrucciones verificadas por la escuela.',true)", [assignment,cohort]);

  await t.test('visitor can read cohort but cannot read applications or private files', async () => {
    await identify(db, null, 'anon');
    assert.equal(await count(db,'cohorts'),2);
    await assert.rejects(count(db,'applications'), /permission denied/);
    assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  });
  await t.test('submitted and accepted unpaid users cannot read course or forge enrollment', async () => {
    for (const user of [applicant,pending]) {
      await identify(db,user);
      assert.equal(await count(db,'applications'),1);
      assert.equal(await count(db,'modules'),0);
      assert.equal(await count(db,'resources'),0);
      assert.equal(await count(db,'forum_topics'),0);
      assert.equal((await db.query('select * from storage.objects')).rows.length,0);
      await assert.rejects(db.query("update public.enrollments set status='active',paid_at=now() where user_id=$1 returning id",[user]).then(r => { if(!r.rows.length) throw new Error('denied'); }), /denied/);
    }
  });
  await t.test('active student sees only unlocked module and own cohort', async () => {
    await identify(db,student);
    assert.deepEqual((await db.query('select id from public.modules')).rows.map(r=>r.id),[moduleId(1)]);
    assert.equal(await count(db,'resources'),1);
    assert.equal(await count(db,'forum_topics'),1);
    assert.equal((await db.query('select * from storage.objects')).rows.length,1);
    await identify(db,otherStudent);
    assert.equal(await count(db,'forum_topics'),0);
    assert.equal(await count(db,'resources'),0);
    await assert.rejects(db.query('select public.review_application($1,$2)',[appId(4),'accepted']),/Administrator required/);
  });
  await t.test('an email address alone cannot take over records already bound to another identity', async () => {
    await identify(db,otherStudent);
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated',sub:otherStudent,email:`${student}@example.test`,app_metadata:{}})]);
    assert.equal((await db.query('select id from public.applications where id=$1',[appId(1)])).rows.length,0);
    assert.equal((await db.query('select id from public.enrollments where application_id=$1',[appId(1)])).rows.length,0);
  });
  await t.test('participation requires every answer, not a particular correct answer', async () => {
    await identify(db,student);
    await assert.rejects(db.query('insert into public.quiz_participations(user_id,module_id,answers) values($1,$2,$3)',[student,moduleId(1),{}]), /row-level security/);
    await db.query('insert into public.quiz_participations(user_id,module_id,answers) values($1,$2,$3)',[student,moduleId(1),{[questionId(1)]:'Escucha'}]);
    assert.equal(await count(db,'modules'),2);
    assert.equal(await count(db,'resources'),2);
    await assert.rejects(db.query('update public.quiz_participations set module_id=$1,answers=$2 where user_id=$3',[moduleId(2),{[questionId(2)]:'Reflexión de prueba'},student]),/immutable/);
    await db.query('insert into public.quiz_participations(user_id,module_id,answers) values($1,$2,$3)',[student,moduleId(2),{[questionId(2)]:'He observado el valor de escuchar con atención.'}]);
    assert.equal(await count(db,'modules'),2,'a future date still blocks the next module');
    await db.query('delete from public.quiz_participations where user_id=$1',[student]);
    assert.equal(await count(db,'quiz_participations'),2,'student cannot erase progress directly');
  });
  await t.test('forum moderation and private file ownership are enforced', async () => {
    await identify(db,pending);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('assignments',$1)",[`${pending}/work.pdf`]),/row-level security/);
    await identify(db,student);
    await db.query("insert into storage.objects(bucket_id,name) values('assignments',$1)",[`${student}/work.pdf`]);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('assignments',$1)",[`${otherStudent}/work.pdf`]),/row-level security/);
    await assert.rejects(db.query("insert into public.forum_topics(cohort_id,author_id,title,body) values($1,$2,'Tema ajeno','Intento de escribir en otra cohorte.')",[otherCohort,student]),/row-level security/);
    await identify(db,admin,'authenticated','admin');
    await db.query('update public.forum_topics set hidden=true where id=$1',[topic]);
    await identify(db,student);
    assert.equal(await count(db,'forum_topics'),0);
    await assert.rejects(db.query('insert into public.forum_replies(topic_id,author_id,body) values($1,$2,$3)',[topic,student,'Respuesta a tema moderado']),/row-level security/);
    await identify(db,otherStudent);
    assert.equal((await db.query("select * from storage.objects where bucket_id='assignments'")).rows.length,0);
  });
  await t.test('student cannot approve work or issue certificates', async () => {
    await identify(db,student);
    await db.query('insert into public.submissions(assignment_id,user_id,content) values($1,$2,$3)',[assignment,student,'Una propuesta docente suficientemente detallada.']);
    await assert.rejects(db.query("update public.submissions set status='approved' where user_id=$1",[student]),/row-level security/);
    await assert.rejects(db.query('select public.issue_certificate($1,$2)',[student,cohort]),/Administrator required/);
    await assert.rejects(db.query('insert into public.certificates(user_id,cohort_id) values($1,$2)',[student,cohort]),/Administrator required|row-level security/);
  });
  await t.test('teacher feedback permits a revised submission only after review fields are cleared', async () => {
    await identify(db,admin,'authenticated','admin');
    await db.query("update public.submissions set status='revision_requested',feedback='Desarrolla la reflexión.',reviewed_by=$1,reviewed_at=now() where user_id=$2",[admin,student]);
    await identify(db,student);
    await assert.rejects(db.query("update public.submissions set status='submitted',content='Una revisión suficientemente amplia del trabajo.' where user_id=$1",[student]),/row-level security/);
    const revised = await db.query("update public.submissions set status='submitted',content='Una revisión suficientemente amplia del trabajo.',feedback=null,reviewed_by=null,reviewed_at=null where user_id=$1 returning id",[student]);
    assert.equal(revised.rows.length,1);
  });
  await t.test('app metadata grants admin access, user metadata does not', async () => {
    await identify(db,student);
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role:'authenticated',sub:student,email:`${student}@example.test`,app_metadata:{},user_metadata:{role:'admin'}})]);
    assert.equal(await count(db,'applications'),1);
    await identify(db,admin,'authenticated','admin');
    assert.equal(await count(db,'applications'),4);
    const first = await db.query('select public.review_application($1,$2) id',[appId(4),'accepted']);
    const again = await db.query('select public.review_application($1,$2) id',[appId(4),'accepted']);
    assert.equal(first.rows[0].id,again.rows[0].id);
    assert.equal((await db.query('select status from public.enrollments where application_id=$1',[appId(4)])).rows[0].status,'pending_payment');
    await db.query('select public.review_application($1,$2)',[appId(4),'rejected']);
    assert.equal((await db.query('select status from public.enrollments where application_id=$1',[appId(4)])).rows[0].status,'cancelled');
    await db.query('select public.review_application($1,$2)',[appId(4),'accepted']);
    assert.equal((await db.query('select status from public.enrollments where application_id=$1',[appId(4)])).rows[0].status,'pending_payment');
    await assert.rejects(db.query('select public.issue_certificate($1,$2)',[student,cohort]),/Complete every module/);
    await assert.rejects(db.query('insert into public.certificates(user_id,cohort_id) values($1,$2)',[student,cohort]),/Complete every module/);
  });
  await t.test('service rate limiter is atomic and unavailable to users', async () => {
    await identify(db,student);
    await assert.rejects(db.query("select public.rate_limit('key',2,60)"),/permission denied/);
    await identify(db,null,'service_role');
    assert.equal((await db.query("select public.rate_limit('key',2,60) allowed")).rows[0].allowed,true);
    assert.equal((await db.query("select public.rate_limit('key',2,60) allowed")).rows[0].allowed,true);
    assert.equal((await db.query("select public.rate_limit('key',2,60) allowed")).rows[0].allowed,false);
    await assert.rejects(db.query('select public.claim_application($1,$2)',[student,'wrong@example.test']),/Verified identity/);
  });
  await t.test('newsletter confirmation cannot be downgraded by a stale subscription write', async () => {
    await identify(db,null,'service_role');
    await db.query("insert into public.newsletter_subscribers(email,status,confirmation_token_hash) values('subscriber@example.test','pending','token-1')");
    // Simulate the confirm request winning the race with a delayed form request.
    await db.query("update public.newsletter_subscribers set status='confirmed',confirmed_at=now(),confirmation_token_hash=null where email='subscriber@example.test' and status='pending'");
    await assert.rejects(db.query("insert into public.newsletter_subscribers(email,status,confirmation_token_hash) values('subscriber@example.test','pending','stale-token') on conflict(email) do update set status=excluded.status,confirmation_token_hash=excluded.confirmation_token_hash"),/already confirmed/);
    assert.equal((await db.query("select status from public.newsletter_subscribers where email='subscriber@example.test'")).rows[0].status,'confirmed');
    await db.query("update public.newsletter_subscribers set status='unsubscribed',unsubscribed_at=now() where email='subscriber@example.test'");
    await db.query("update public.newsletter_subscribers set status='pending',consented_at=now(),confirmation_token_hash='new-token',token_expires_at=now()+interval '24 hours' where email='subscriber@example.test'");
    assert.equal((await db.query("select status from public.newsletter_subscribers where email='subscriber@example.test'")).rows[0].status,'pending');
    await identify(db,student);
    await assert.rejects(db.query("select * from public.newsletter_subscribers"),/permission denied/);
  });
  await t.test('verified application claim is idempotent and creates one profile without activating admission', async () => {
    const identity='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    await db.exec('reset role');
    await db.query('insert into auth.users(id,email) values($1,$2)',[identity,`${identity}@example.test`]);
    await db.query(`insert into public.applications(id,cohort_id,email,full_name,country,role,age_range,motivation,privacy_version,consented_at)
      values($1,$2,$3,'Docente nueva','España','Docente','3-6','Quiero comprender mejor la música y el aula.','2026-11',now())`,[appId(5),cohort,`${identity}@example.test`]);
    await identify(db,null,'service_role');
    await db.query('select public.review_application($1,$2)',[appId(5),'accepted']);
    await assert.rejects(db.query('select public.claim_application($1,$2)',[identity,`${identity}@example.test`]),/Verified identity/);
    await db.exec('reset role');
    await db.query('update auth.users set email_confirmed_at=now() where id=$1',[identity]);
    await identify(db,null,'service_role');
    await db.query('select public.claim_application($1,$2)',[identity,`${identity}@example.test`]);
    await db.query('select public.claim_application($1,$2)',[identity,`${identity}@example.test`]);
    await identify(db,identity);
    assert.deepEqual((await db.query('select full_name from public.profiles')).rows,[{full_name:'Docente nueva'}]);
    assert.equal((await db.query('select user_id from public.applications')).rows[0].user_id,identity);
    assert.equal((await db.query('select status from public.enrollments')).rows[0].status,'pending_payment');
    assert.equal(await count(db,'modules'),0);
  });
  await t.test('provider unsubscribe events are server-only, monotonic and cannot undo a later consent', async () => {
    await identify(db,student);
    await assert.rejects(db.query("select public.apply_newsletter_provider_event('marketing@example.test','contact-1',now())"),/permission denied/);
    await identify(db,null,'service_role');
    await db.query("insert into public.newsletter_subscribers(email,status,confirmed_at,consented_at,provider_contact_id,provider_sync_status) values('marketing@example.test','confirmed',now()-interval '1 day',now()-interval '1 day','contact-1','synced')");
    const before=(await db.query("select subscription_version from public.newsletter_subscribers where email='marketing@example.test'")).rows[0].subscription_version;
    assert.equal((await db.query("select public.apply_newsletter_provider_event('marketing@example.test','wrong-contact',now()) applied")).rows[0].applied,false);
    const eventTime=new Date(Date.now()-60_000).toISOString();
    assert.equal((await db.query("select public.apply_newsletter_provider_event('marketing@example.test','contact-1',$1) applied",[eventTime])).rows[0].applied,true);
    const after=(await db.query("select status,subscription_version,provider_sync_status from public.newsletter_subscribers where email='marketing@example.test'")).rows[0];
    assert.equal(after.status,'unsubscribed');
    assert.equal(after.provider_sync_status,'pending');
    assert.notEqual(after.subscription_version,before);
    assert.equal((await db.query("select public.apply_newsletter_provider_event('marketing@example.test','contact-1',$1) applied",[eventTime])).rows[0].applied,false);
    assert.equal((await db.query("select public.apply_newsletter_provider_event('marketing@example.test','contact-1',now()-interval '2 days') applied")).rows[0].applied,false);
    await db.query("update public.newsletter_subscribers set status='pending',confirmed_at=null,consented_at=now(),confirmation_token_hash='new-consent' where email='marketing@example.test'");
    assert.equal((await db.query("select public.apply_newsletter_provider_event('marketing@example.test','contact-1',$1) applied",[new Date(Date.now()-30_000).toISOString()])).rows[0].applied,false,'old event cannot override a new pending subscription');
    assert.equal((await db.query("select status from public.newsletter_subscribers where email='marketing@example.test'")).rows[0].status,'pending');
  });
  await t.test('certificate requires full participation plus approved final work; issue is idempotent', async () => {
    await db.exec('reset role');
    await db.query("update public.modules set published=true,unlock_at=now()-interval '1 day' where cohort_id=$1",[cohort]);
    for(let n=3;n<=10;n++) {
      await db.query("insert into public.quiz_questions(id,module_id,prompt,options) values($1,$2,'Reflexión','[]')",[questionId(n),moduleId(n)]);
    }
    await identify(db,student);
    for(let n=3;n<=10;n++) await db.query('insert into public.quiz_participations(user_id,module_id,answers) values($1,$2,$3)',[student,moduleId(n),{[questionId(n)]:'Mi reflexión sobre el aprendizaje.'}]);
    await identify(db,admin,'authenticated','admin');
    await assert.rejects(db.query('select public.issue_certificate($1,$2)',[student,cohort]),/Approved final/);
    await db.query("update public.submissions set status='approved',reviewed_by=$1,reviewed_at=now() where user_id=$2",[admin,student]);
    const first=await db.query('select public.issue_certificate($1,$2) id',[student,cohort]);
    const second=await db.query('select public.issue_certificate($1,$2) id',[student,cohort]);
    assert.equal(first.rows[0].id,second.rows[0].id);
    await identify(db,otherStudent);
    assert.equal(await count(db,'certificates'),0);
    await identify(db,student);
    assert.equal(await count(db,'certificates'),1);
  });
  await t.test('capacity is enforced in the database and pending admission consumes no paid seat', async () => {
    await identify(db,admin,'authenticated','admin');
    await db.query('update public.cohorts set seat_limit=1 where id=$1',[cohort]);
    await assert.rejects(db.query("update public.enrollments set status='active',paid_at=now() where user_id=$1",[pending]),/capacity reached/);
    assert.equal((await db.query('select status from public.enrollments where user_id=$1',[pending])).rows[0].status,'pending_payment');
  });
  await t.test('revoking enrollment immediately removes course and resource access', async () => {
    await identify(db,admin,'authenticated','admin');
    await db.query("update public.enrollments set status='refunded' where user_id=$1",[student]);
    await identify(db,student);
    assert.equal(await count(db,'modules'),0);
    assert.equal(await count(db,'resources'),0);
    assert.equal((await db.query("select * from storage.objects where bucket_id='course-materials'")).rows.length,0);
    await assert.rejects(db.query('insert into public.forum_topics(cohort_id,author_id,title,body) values($1,$2,$3,$4)',[cohort,student,'Sin matrícula','Esto no debe guardarse.']),/row-level security/);
  });
  await t.test('local database backup restores records and row policies together', async () => {
    await db.exec('reset role');
    const backup = await db.dumpDataDir();
    const restored = new PGlite({ loadDataDir: backup });
    try {
      await identify(restored,student);
      assert.equal(await count(restored,'certificates'),1);
      assert.equal(await count(restored,'modules'),0,'refunded enrollment remains revoked after restore');
      await identify(restored,otherStudent);
      assert.equal(await count(restored,'certificates'),0,'a restored database preserves user isolation');
      await identify(restored,null,'anon');
      await assert.rejects(count(restored,'applications'),/permission denied/);
    } finally { await restored.close(); }
  });
});

test('migration preserves legacy commercial records without exposing them or assuming consent', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create table public.enrollments(id uuid primary key,email text,status text,stripe_session_id text);
    insert into public.enrollments values(gen_random_uuid(),'old@example.test','paid','old-session');
    create table public.email_events(id uuid primary key,email text);
    insert into public.email_events values(gen_random_uuid(),'old@example.test');
    create table public.newsletter_subscribers(id uuid primary key default gen_random_uuid(),email text unique,source text,created_at timestamptz default now());
    insert into public.newsletter_subscribers(email) values('old@example.test');
    create table public.profiles(id uuid primary key,full_name text);
    alter table public.profiles enable row level security;
    create policy old_public_profiles on public.profiles for select using(true);
  `);
  await migrate(db);
  assert.equal(Number((await db.query('select count(*) n from private.legacy_enrollments')).rows[0].n),1);
  assert.equal(Number((await db.query('select count(*) n from private.legacy_email_events')).rows[0].n),1);
  assert.equal((await db.query('select status from public.newsletter_subscribers')).rows[0].status,'pending');
  assert.equal((await db.query("select count(*) n from pg_policies where policyname='old_public_profiles'")).rows[0].n,0);
  await identify(db,student);
  await assert.rejects(db.query('select * from private.legacy_enrollments'),/permission denied/);
  await assert.rejects(db.query('select * from public.newsletter_subscribers'),/permission denied/);
});

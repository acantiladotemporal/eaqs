-- Canonical schema for a new EAQS deployment. Never run against an unreviewed
-- production database. The generated migration preserves the old launch tables.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- Retain previous commercial records outside the exposed API; no data is erased.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='enrollments' and column_name='stripe_session_id') then
    if to_regclass('private.legacy_enrollments') is not null then
      raise exception 'Legacy enrollments already archived; inspect the database before migrating';
    end if;
    alter table public.enrollments set schema private;
    alter table private.enrollments rename to legacy_enrollments;
    alter table private.legacy_enrollments enable row level security;
    revoke all on private.legacy_enrollments from anon, authenticated;
  end if;
  if to_regclass('public.email_events') is not null then
    if to_regclass('private.legacy_email_events') is not null then
      raise exception 'Legacy email events already archived; inspect the database before migrating';
    end if;
    alter table public.email_events set schema private;
    alter table private.email_events rename to legacy_email_events;
    alter table private.legacy_email_events enable row level security;
    revoke all on private.legacy_email_events from anon, authenticated;
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 160),
  created_at timestamptz not null default now()
);
create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  applications_open boolean not null default false,
  published boolean not null default false,
  start_at timestamptz,
  seat_limit integer not null default 20 check (seat_limit between 1 and 1000),
  created_at timestamptz not null default now()
);
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id),
  user_id uuid references auth.users(id) on delete set null,
  email text not null check (email=lower(trim(email)) and length(email) <= 254),
  full_name text not null check (length(full_name) between 2 and 160),
  country text not null check (length(country) between 2 and 100),
  role text not null check (length(role) between 2 and 160),
  age_range text not null check (age_range in ('0-3','3-6','0-6','other')),
  motivation text not null check (length(motivation) between 20 and 3000),
  status text not null default 'submitted' check (status in ('submitted','accepted','rejected','waitlisted')),
  privacy_version text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cohort_id,email)
);
create index applications_user_idx on public.applications(user_id);
create index applications_status_idx on public.applications(cohort_id,status,created_at);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id),
  user_id uuid references auth.users(id) on delete set null,
  application_id uuid not null unique references public.applications(id),
  status text not null default 'pending_payment' check (status in ('pending_payment','active','cancelled','refunded')),
  reference text not null unique default ('EAQS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(cohort_id,user_id),
  check (status <> 'active' or (user_id is not null and paid_at is not null))
);
create index enrollments_active_idx on public.enrollments(user_id,cohort_id) where status='active';
create index enrollments_cohort_status_idx on public.enrollments(cohort_id,status);
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id),
  position integer not null check (position between 1 and 100),
  title text not null,
  summary text not null default '',
  body text not null default '',
  unlock_at timestamptz,
  published boolean not null default false,
  unique(cohort_id,position)
);
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('video','document')),
  storage_provider text not null default 'supabase' check(storage_provider in ('supabase','r2')),
  storage_path text not null check (storage_path !~ '(^/|\.\.)'),
  created_at timestamptz not null default now(),
  unique(storage_provider,storage_path)
);
create index resources_module_idx on public.resources(module_id);
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  prompt text not null,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options)='array' and jsonb_array_length(options) between 0 and 10),
  position integer not null default 1,
  unique(module_id,position)
);
create table public.quiz_participations (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers)='object'),
  completed_at timestamptz not null default now(),
  primary key(user_id,module_id)
);
create index quiz_participations_module_idx on public.quiz_participations(module_id);
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null unique references public.cohorts(id),
  title text not null,
  instructions text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) between 20 and 20000),
  storage_path text check (storage_path !~ '(^/|\.\.)'),
  status text not null default 'submitted' check (status in ('submitted','revision_requested','approved')),
  feedback text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assignment_id,user_id)
);
create index submissions_user_idx on public.submissions(user_id);
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  cohort_id uuid not null references public.cohorts(id),
  issued_at timestamptz not null default now(),
  certificate_number text not null unique default ('EAQS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
  unique(user_id,cohort_id)
);
create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id),
  author_id uuid not null references auth.users(id),
  title text not null check (length(title) between 3 and 180),
  body text not null check (length(body) between 3 and 10000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index forum_topics_cohort_idx on public.forum_topics(cohort_id,created_at desc);
create index forum_topics_author_idx on public.forum_topics(author_id);
create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null check (length(body) between 3 and 10000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index forum_replies_topic_idx on public.forum_replies(topic_id,created_at);
create index forum_replies_author_idx on public.forum_replies(author_id);
create table public.tutoring_sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id),
  title text not null,
  starts_at timestamptz not null,
  meeting_url text check (meeting_url ~ '^https://'),
  notes text not null default ''
);
create index tutoring_cohort_idx on public.tutoring_sessions(cohort_id,starts_at);

-- Existing newsletter addresses are not assumed to have confirmed consent.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(), email text not null unique,
  source text, created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers add column if not exists status text not null default 'pending' check(status in ('pending','confirmed','unsubscribed'));
alter table public.newsletter_subscribers add column if not exists confirmation_token_hash text;
alter table public.newsletter_subscribers add column if not exists unsubscribe_token_hash text;
alter table public.newsletter_subscribers add column if not exists token_expires_at timestamptz;
alter table public.newsletter_subscribers add column if not exists consented_at timestamptz;
alter table public.newsletter_subscribers add column if not exists confirmed_at timestamptz;
alter table public.newsletter_subscribers add column if not exists unsubscribed_at timestamptz;
alter table public.newsletter_subscribers add column if not exists privacy_version text;
alter table public.newsletter_subscribers add column if not exists provider_contact_id text;
alter table public.newsletter_subscribers add column if not exists provider_sync_status text not null default 'pending' check(provider_sync_status in ('pending','synced','failed'));
alter table public.newsletter_subscribers add column if not exists provider_synced_at timestamptz;
alter table public.newsletter_subscribers add column if not exists provider_sync_error text;
alter table public.newsletter_subscribers add column if not exists subscription_version uuid not null default gen_random_uuid();
alter table public.newsletter_subscribers add column if not exists provider_last_event_at timestamptz;
create index newsletter_confirmation_idx on public.newsletter_subscribers(confirmation_token_hash) where confirmation_token_hash is not null;
create index newsletter_unsubscribe_idx on public.newsletter_subscribers(unsubscribe_token_hash) where unsubscribe_token_hash is not null;
create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  event_type text not null,
  template text not null,
  provider text not null default 'resend',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index email_events_email_idx on public.email_events(email,created_at desc);
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  recipient text not null,
  subject text not null,
  html text not null,
  body_text text not null,
  status text not null default 'pending' check(status in ('pending','sent','failed')),
  attempts integer not null default 0 check(attempts>=0),
  last_error text,
  provider_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create table public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

create function private.is_admin() returns boolean language sql stable security invoker set search_path='' as $$
  select coalesce((auth.jwt()->'app_metadata'->>'role')='admin',false)
$$;
create function private.is_service() returns boolean language sql stable security invoker set search_path='' as $$
  select coalesce((auth.jwt()->>'role')='service_role',false)
$$;
-- These fixed-identity boolean helpers avoid recursive RLS lookups. They are in
-- an unexposed schema and never accept a caller-supplied user id.
create function private.has_active_enrollment(p_cohort uuid) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from public.enrollments e where e.user_id=auth.uid() and e.cohort_id=p_cohort and e.status='active')
$$;
create function private.can_access_module(p_module uuid) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(
    select 1 from public.modules m
    where m.id=p_module and m.published and m.unlock_at is not null and m.unlock_at<=now()
      and exists(select 1 from public.enrollments e where e.cohort_id=m.cohort_id and e.user_id=auth.uid() and e.status='active')
      and not exists(select 1 from public.modules previous where previous.cohort_id=m.cohort_id and previous.position<m.position
        and not exists(select 1 from public.quiz_participations q where q.module_id=previous.id and q.user_id=auth.uid()))
  )
$$;
create function private.valid_quiz_answers(p_module uuid,p_answers jsonb) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and jsonb_typeof(p_answers)='object'
    and exists(select 1 from public.quiz_questions q where q.module_id=p_module)
    and not exists(select 1 from public.quiz_questions q where q.module_id=p_module and
      (not (p_answers ? q.id::text) or jsonb_typeof(p_answers->q.id::text)<>'string'
       or length(trim(p_answers->>q.id::text)) not between 1 and 5000
       or (jsonb_array_length(q.options)>0 and not (q.options ? (p_answers->>q.id::text)))))
    and (select count(*) from jsonb_object_keys(p_answers))=(select count(*) from public.quiz_questions q where q.module_id=p_module)
$$;
create function private.can_read_topic(p_topic uuid) returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from public.forum_topics t where t.id=p_topic and not t.hidden and private.has_active_enrollment(t.cohort_id))
$$;
-- This server-only lookup verifies the identity even where the service SQL role
-- has no direct grants on auth.users. It never accepts an end-user call.
create function private.verified_identity(p_user uuid,p_email text) returns boolean language sql stable security definer set search_path='' as $$
  select private.is_service() and exists(select 1 from auth.users where id=p_user and lower(email)=lower(p_email) and email_confirmed_at is not null)
$$;
revoke all on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated,service_role;
revoke execute on function private.verified_identity(uuid,text) from authenticated;

do $$ declare t text; old_policy record; begin
  foreach t in array array['profiles','cohorts','applications','enrollments','modules','resources','quiz_questions','quiz_participations','assignments','submissions','certificates','forum_topics','forum_replies','tutoring_sessions','newsletter_subscribers','email_events','email_outbox','admin_audit','rate_limits'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    for old_policy in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I',old_policy.policyname,t);
    end loop;
    execute format('create policy admin_access on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',t);
  end loop;
end $$;
grant select on public.cohorts to anon,authenticated;
grant select,insert,update,delete on public.profiles,public.applications,public.enrollments,public.modules,public.resources,public.quiz_questions,public.quiz_participations,public.assignments,public.submissions,public.certificates,public.forum_topics,public.forum_replies,public.tutoring_sessions,public.cohorts to authenticated;
grant select,insert on public.admin_audit to authenticated;
-- Marketing and rate-limit records remain server-only, even for UI admins.

create policy published_cohorts on public.cohorts for select to anon,authenticated using (published);
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy own_profile_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_applications on public.applications for select to authenticated using(user_id=(select auth.uid()) or (user_id is null and email=lower((select auth.jwt()->>'email'))));
create policy own_enrollments on public.enrollments for select to authenticated using(user_id=(select auth.uid()) or (user_id is null and exists(select 1 from public.applications a where a.id=application_id and a.user_id is null and a.email=lower((select auth.jwt()->>'email')))));
create policy available_modules on public.modules for select to authenticated using(private.can_access_module(id));
create policy available_resources on public.resources for select to authenticated using(private.can_access_module(module_id));
create policy available_questions on public.quiz_questions for select to authenticated using(private.can_access_module(module_id));
create policy own_quiz on public.quiz_participations for select to authenticated using(user_id=(select auth.uid()));
create policy complete_quiz on public.quiz_participations for insert to authenticated with check(user_id=(select auth.uid()) and private.can_access_module(module_id) and private.valid_quiz_answers(module_id,answers));
create policy update_quiz on public.quiz_participations for update to authenticated using(user_id=(select auth.uid()) and private.can_access_module(module_id)) with check(user_id=(select auth.uid()) and private.can_access_module(module_id) and private.valid_quiz_answers(module_id,answers));
create policy available_assignments on public.assignments for select to authenticated using(published and private.has_active_enrollment(cohort_id));
create policy own_submissions on public.submissions for select to authenticated using(user_id=(select auth.uid()));
create policy submit_work on public.submissions for insert to authenticated with check(user_id=(select auth.uid()) and status='submitted' and feedback is null and reviewed_by is null and reviewed_at is null and (storage_path is null or split_part(storage_path,'/',1)=(select auth.uid())::text) and exists(select 1 from public.assignments a where a.id=assignment_id and a.published and private.has_active_enrollment(a.cohort_id)));
create policy revise_work on public.submissions for update to authenticated using(user_id=(select auth.uid()) and status<>'approved') with check(user_id=(select auth.uid()) and status='submitted' and reviewed_by is null and reviewed_at is null and feedback is null and (storage_path is null or split_part(storage_path,'/',1)=(select auth.uid())::text) and exists(select 1 from public.assignments a where a.id=assignment_id and a.published and private.has_active_enrollment(a.cohort_id)));
create policy own_certificates on public.certificates for select to authenticated using(user_id=(select auth.uid()));
create policy cohort_topics on public.forum_topics for select to authenticated using(not hidden and private.has_active_enrollment(cohort_id));
create policy create_topic on public.forum_topics for insert to authenticated with check(author_id=(select auth.uid()) and not hidden and private.has_active_enrollment(cohort_id));
create policy cohort_replies on public.forum_replies for select to authenticated using(not hidden and private.can_read_topic(topic_id));
create policy create_reply on public.forum_replies for insert to authenticated with check(author_id=(select auth.uid()) and not hidden and private.can_read_topic(topic_id));
create policy cohort_tutoring on public.tutoring_sessions for select to authenticated using(private.has_active_enrollment(cohort_id));

create function private.guard_enrollment() returns trigger language plpgsql security invoker set search_path='' as $$
declare cap integer; begin
  if not exists(select 1 from public.applications a where a.id=new.application_id and a.cohort_id=new.cohort_id and (new.user_id is null or a.user_id=new.user_id) and a.status='accepted') then
    raise exception 'An accepted application belonging to this cohort/user is required';
  end if;
  if new.status='active' then
    select seat_limit into cap from public.cohorts where id=new.cohort_id for update;
    if (select count(*) from public.enrollments where cohort_id=new.cohort_id and status='active' and id<>new.id)>=cap then
      raise exception 'Cohort capacity reached';
    end if;
  end if;
  return new;
end $$;
create trigger guard_enrollment before insert or update on public.enrollments for each row execute function private.guard_enrollment();
create function private.guard_participation() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='UPDATE' and (new.user_id<>old.user_id or new.module_id<>old.module_id) then raise exception 'Participation identity is immutable'; end if;
  new.completed_at=now();
  return new;
end $$;
create trigger guard_participation before insert or update on public.quiz_participations for each row execute function private.guard_participation();

create function public.review_application(p_application_id uuid,p_status text) returns uuid language plpgsql security invoker set search_path='' as $$
declare a public.applications; result_id uuid; begin
  if not (private.is_admin() or private.is_service()) then raise exception 'Administrator required'; end if;
  if p_status not in ('submitted','accepted','rejected','waitlisted') then raise exception 'Invalid application status'; end if;
  select * into strict a from public.applications where id=p_application_id for update;
  if p_status<>'accepted' and exists(select 1 from public.enrollments where application_id=a.id and status='active') then raise exception 'Cancel the active enrollment before changing admission'; end if;
  if p_status<>'accepted' then
    update public.enrollments set status='cancelled' where application_id=a.id and status='pending_payment';
  end if;
  update public.applications set status=p_status,updated_at=now() where id=a.id;
  if p_status='accepted' then
    insert into public.enrollments(cohort_id,user_id,application_id) values(a.cohort_id,a.user_id,a.id)
      on conflict(application_id) do update set user_id=coalesce(public.enrollments.user_id,excluded.user_id),
        status=case when public.enrollments.status='active' then 'active' else 'pending_payment' end
      returning id into result_id;
  end if;
  insert into public.admin_audit(actor_id,action,target_id,details) values(auth.uid(),'review_application',a.id,jsonb_build_object('status',p_status));
  return result_id;
end $$;
create function public.claim_application(p_user_id uuid,p_email text) returns void language plpgsql security invoker set search_path='' as $$
begin
  if not private.is_service() then raise exception 'Server-only operation'; end if;
  if not private.verified_identity(p_user_id,p_email) then raise exception 'Verified identity required'; end if;
  update public.applications set user_id=p_user_id where email=lower(p_email) and user_id is null;
  update public.enrollments e set user_id=p_user_id from public.applications a where e.application_id=a.id and a.user_id=p_user_id and e.user_id is null;
  insert into public.profiles(id,full_name)
    values(p_user_id,coalesce((select full_name from public.applications where user_id=p_user_id order by created_at desc limit 1),''))
    on conflict(id) do update set full_name=case when public.profiles.full_name='' then excluded.full_name else public.profiles.full_name end;
end $$;
create function public.issue_certificate(p_user_id uuid,p_cohort_id uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare result_id uuid; begin
  if not (private.is_admin() or private.is_service()) then raise exception 'Administrator required'; end if;
  perform 1 from public.cohorts where id=p_cohort_id for update;
  if not exists(select 1 from public.enrollments where user_id=p_user_id and cohort_id=p_cohort_id and status='active') then raise exception 'Active enrollment required'; end if;
  if (select count(*) from public.modules where cohort_id=p_cohort_id and published)<>10 or exists(select 1 from public.modules m where m.cohort_id=p_cohort_id and (not m.published or not exists(select 1 from public.quiz_participations q where q.module_id=m.id and q.user_id=p_user_id))) then raise exception 'Complete every module first'; end if;
  if not exists(select 1 from public.assignments a join public.submissions s on s.assignment_id=a.id where a.cohort_id=p_cohort_id and a.published and s.user_id=p_user_id and s.status='approved') then raise exception 'Approved final assignment required'; end if;
  insert into public.certificates(user_id,cohort_id) values(p_user_id,p_cohort_id) on conflict(user_id,cohort_id) do update set user_id=excluded.user_id returning id into result_id;
  insert into public.admin_audit(actor_id,action,target_id) values(auth.uid(),'issue_certificate',result_id);
  return result_id;
end $$;
revoke all on function public.review_application(uuid,text),public.claim_application(uuid,text),public.issue_certificate(uuid,uuid) from public,anon;
grant execute on function public.review_application(uuid,text),public.issue_certificate(uuid,uuid) to authenticated,service_role;
revoke all on function public.claim_application(uuid,text) from authenticated;
grant execute on function public.claim_application(uuid,text) to service_role;
create function public.rate_limit(p_key text,p_limit integer,p_window_seconds integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare hits integer; begin
  if not private.is_service() then raise exception 'Server-only operation'; end if;
  if length(p_key) not between 1 and 200 or p_limit not between 1 and 10000 or p_window_seconds not between 1 and 604800 then raise exception 'Invalid rate limit'; end if;
  insert into public.rate_limits(key,count,window_start) values(p_key,1,now())
  on conflict(key) do update set
    count=case when public.rate_limits.window_start<=now()-make_interval(secs=>p_window_seconds) then 1 else public.rate_limits.count+1 end,
    window_start=case when public.rate_limits.window_start<=now()-make_interval(secs=>p_window_seconds) then now() else public.rate_limits.window_start end
  returning count into hits;
  return hits<=p_limit;
end $$;
revoke all on function public.rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.rate_limit(text,integer,integer) to service_role;

-- A delayed re-subscription request cannot overwrite a confirmation that has
-- already committed. Explicit re-subscription after a real unsubscribe is valid.
create function private.guard_newsletter_confirmation() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if old.status='confirmed' and new.status='pending' then
    raise exception 'Subscription is already confirmed';
  end if;
  if new.status is distinct from old.status or new.confirmation_token_hash is distinct from old.confirmation_token_hash then
    new.subscription_version=gen_random_uuid();
    new.provider_sync_status='pending';
    new.provider_sync_error=null;
    new.provider_synced_at=null;
  end if;
  return new;
end $$;
create trigger guard_newsletter_confirmation before update on public.newsletter_subscribers for each row execute function private.guard_newsletter_confirmation();
create function public.apply_newsletter_provider_event(p_email text,p_contact_id text,p_created_at timestamptz) returns boolean language plpgsql security invoker set search_path='' as $$
declare applied_id uuid; begin
  if not private.is_service() then raise exception 'Server-only operation'; end if;
  if p_created_at is null or p_created_at>now()+interval '5 minutes' or p_contact_id is null or length(p_contact_id) not between 1 and 255 then return false; end if;
  update public.newsletter_subscribers set
    status='unsubscribed',unsubscribed_at=p_created_at,
    confirmation_token_hash=null,token_expires_at=null,
    provider_contact_id=coalesce(provider_contact_id,p_contact_id),provider_last_event_at=p_created_at
  where email=lower(trim(p_email))
    and (provider_contact_id is null or provider_contact_id=p_contact_id)
    and (provider_last_event_at is null or provider_last_event_at<p_created_at)
    and p_created_at>=coalesce(confirmed_at,consented_at,created_at)
  returning id into applied_id;
  return applied_id is not null;
end $$;
revoke all on function public.apply_newsletter_provider_event(text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_newsletter_provider_event(text,text,timestamptz) to service_role;

-- Keep the same certificate requirements even if a future administrative path
-- writes directly rather than invoking issue_certificate.
create function private.guard_certificate() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if not (private.is_admin() or private.is_service()) then raise exception 'Administrator required'; end if;
  if tg_op='UPDATE' and (new.user_id<>old.user_id or new.cohort_id<>old.cohort_id) then raise exception 'Certificate identity is immutable'; end if;
  if not exists(select 1 from public.enrollments where user_id=new.user_id and cohort_id=new.cohort_id and status='active') then raise exception 'Active enrollment required'; end if;
  if (select count(*) from public.modules where cohort_id=new.cohort_id and published)<>10 or exists(select 1 from public.modules m where m.cohort_id=new.cohort_id and (not m.published or not exists(select 1 from public.quiz_participations q where q.module_id=m.id and q.user_id=new.user_id))) then raise exception 'Complete every module first'; end if;
  if not exists(select 1 from public.assignments a join public.submissions s on s.assignment_id=a.id where a.cohort_id=new.cohort_id and a.published and s.user_id=new.user_id and s.status='approved') then raise exception 'Approved final assignment required'; end if;
  return new;
end $$;
create trigger guard_certificate before insert or update on public.certificates for each row execute function private.guard_certificate();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('course-materials','course-materials',false,104857600,array['application/pdf','video/mp4','audio/mpeg','image/png','image/jpeg','text/vtt']),
 ('assignments','assignments',false,10485760,array['application/pdf','image/png','image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy course_files_read on storage.objects for select to authenticated using(bucket_id='course-materials' and ((select private.is_admin()) or exists(select 1 from public.resources r where r.storage_provider='supabase' and r.storage_path=name and private.can_access_module(r.module_id))));
create policy course_files_admin on storage.objects for all to authenticated using(bucket_id='course-materials' and (select private.is_admin())) with check(bucket_id='course-materials' and (select private.is_admin()));
create policy assignment_files_read on storage.objects for select to authenticated using(bucket_id='assignments' and ((select private.is_admin()) or split_part(name,'/',1)=(select auth.uid())::text));
create policy assignment_files_insert on storage.objects for insert to authenticated with check(bucket_id='assignments' and split_part(name,'/',1)=(select auth.uid())::text and exists(select 1 from public.enrollments e where e.user_id=(select auth.uid()) and e.status='active'));
create policy assignment_files_delete on storage.objects for delete to authenticated using(bucket_id='assignments' and ((select private.is_admin()) or (split_part(name,'/',1)=(select auth.uid())::text and not exists(select 1 from public.submissions s where s.storage_path=name))));

insert into public.cohorts(id,slug,title,published,applications_open) values('11111111-1111-4111-8111-111111111111','primera-edicion','Primera edición · Neuroeducación Musical',true,true);
insert into public.modules(id,cohort_id,position,title,summary)
select ('22222222-2222-4222-8222-'||lpad(n::text,12,'0'))::uuid,'11111111-1111-4111-8111-111111111111',n,
  (array['Arquitectura Cerebral','Sincronía Rítmica','Neurofonía','Sistema Límbico','Laboratorio de Aula','Diseño Multisensorial','Evaluación Sensible','Mentoría de Casos','Integración Transversal','Certificación Final'])[n],
  (array[
    'Bases biológicas del procesamiento sonoro y la atención infantil.',
    'Pulso, movimiento y coordinación para regular la energía grupal.',
    'Voz, escucha y lenguaje musical para una comunicación expresiva.',
    'Emoción, memoria y anclajes sonoros con enfoque vincular.',
    'Secuencias prácticas para docentes de la etapa de 0 a 6 años.',
    'Integración de ritmo, juego y narrativa corporal en sesiones.',
    'Indicadores observables para acompañar el progreso sin rigidez.',
    'Análisis de situaciones reales y ajustes metodológicos.',
    'Conexión con lenguaje, psicomotricidad y convivencia escolar.',
    'Cierre de cohorte, trabajo final y certificado propio de la escuela.'
  ])[n]
from generate_series(1,10) n;

-- Cover foreign-key lookups used by cohort administration and assignment review.
create index certificates_cohort_idx on public.certificates(cohort_id);
create index submissions_reviewer_idx on public.submissions(reviewed_by);

-- Cache the complete JWT once per statement before extracting its email claim.
alter policy own_applications on public.applications using (
  user_id=(select auth.uid())
  or (user_id is null and email=lower((select auth.jwt())->>'email'))
);
alter policy own_enrollments on public.enrollments using (
  user_id=(select auth.uid())
  or (user_id is null and exists(
    select 1 from public.applications a
    where a.id=application_id and a.user_id is null
      and a.email=lower((select auth.jwt())->>'email')
  ))
);

-- Keep public cohort discovery separate from the signed-in administrator branch.
alter policy published_cohorts on public.cohorts to anon;
create policy authenticated_cohorts on public.cohorts for select to authenticated using (published);

-- Fold the previous administrator OR branch into the policy for each operation.
-- This preserves every student predicate and all grants; it avoids evaluating
-- overlapping permissive policies for the same role and operation.
do $$
declare t text; p record; operation text; using_expression text; check_expression text;
begin
  foreach t in array array[
    'profiles','cohorts','applications','enrollments','modules','resources',
    'quiz_questions','quiz_participations','assignments','submissions',
    'certificates','forum_topics','forum_replies','tutoring_sessions',
    'newsletter_subscribers','email_events','email_outbox','admin_audit','rate_limits'
  ] loop
    execute format('drop policy admin_access on public.%I',t);
    for p in select policyname,cmd,qual,with_check,roles,permissive
      from pg_policies where schemaname='public' and tablename=t
        and 'authenticated'=any(roles)
    loop
      if cardinality(p.roles)<>1 or p.permissive<>'PERMISSIVE' or p.cmd='ALL' then
        raise exception 'Unexpected policy shape on public.%: inspect before merging',t;
      end if;
      using_expression := format('((select private.is_admin()) or (%s))',coalesce(p.qual,'true'));
      check_expression := format('((select private.is_admin()) or (%s))',coalesce(p.with_check,p.qual,'true'));
      if p.cmd in ('SELECT','DELETE') then
        execute format('alter policy %I on public.%I using (%s)',p.policyname,t,using_expression);
      elsif p.cmd='INSERT' then
        execute format('alter policy %I on public.%I with check (%s)',p.policyname,t,check_expression);
      elsif p.cmd='UPDATE' then
        execute format('alter policy %I on public.%I using (%s) with check (%s)',p.policyname,t,using_expression,check_expression);
      end if;
    end loop;
    foreach operation in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      if not exists(select 1 from pg_policies where schemaname='public'
        and tablename=t and cmd=operation and 'authenticated'=any(roles)) then
        if operation='INSERT' then
          execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))','school_admin_insert',t);
        elsif operation='UPDATE' then
          execute format('create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))','school_admin_update',t);
        else
          execute format('create policy %I on public.%I for %s to authenticated using ((select private.is_admin()))','school_admin_'||lower(operation),t,operation);
        end if;
      end if;
    end loop;
  end loop;
end $$;

-- The school uses the REST Data API. Disable the unused GraphQL API rather than
-- removing the SELECT grants required by the application and its RLS policies.
-- No CASCADE: unexpected dependencies must stop the migration for inspection.
drop extension if exists pg_graphql;

-- Launch Cohorte 01 schema updates
-- Run in Supabase SQL editor before enabling production checkout/emails.

create extension if not exists "pgcrypto";

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  source text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  amount_eur numeric(10, 2),
  currency text default 'EUR',
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_enrollments_email on public.enrollments(email);
create index if not exists idx_enrollments_status on public.enrollments(status);
create index if not exists idx_enrollments_created_at on public.enrollments(created_at);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  event_type text not null check (event_type in ('newsletter_sent', 'transactional_sent', 'opened', 'clicked')),
  template text,
  provider text default 'resend',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_events_email on public.email_events(email);
create index if not exists idx_email_events_event_type on public.email_events(event_type);
create index if not exists idx_email_events_created_at on public.email_events(created_at);

-- Optional trigger for updated_at in enrollments
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_enrollments_updated_at on public.enrollments;
create trigger trg_enrollments_updated_at
before update on public.enrollments
for each row execute function public.touch_updated_at();


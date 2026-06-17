create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

create type public.assignment_source as enum (
  'manual',
  'google_classroom',
  'moodle'
);

create type public.plan_generator as enum (
  'planner',
  'openai',
  'hybrid'
);

create type public.session_status as enum (
  'scheduled',
  'completed',
  'skipped'
);

create type public.integration_provider as enum (
  'google_classroom',
  'moodle'
);

create type public.notification_channel as enum (
  'email',
  'push',
  'in_app'
);

create type public.notification_status as enum (
  'pending',
  'sent',
  'failed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  timezone text not null default 'UTC',
  weekly_capacity_hours integer not null default 10,
  preferred_study_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_weekly_capacity_hours_check
    check (weekly_capacity_hours between 0 and 168),
  constraint profiles_timezone_not_blank_check
    check (length(btrim(timezone)) > 0),
  constraint profiles_preferred_study_time_check
    check (
      preferred_study_time is null
      or preferred_study_time in ('morning', 'afternoon', 'evening', 'night', 'flexible')
    )
);

create table public.courses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text,
  name text not null,
  term text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_name_not_blank_check
    check (length(btrim(name)) > 0),
  constraint courses_code_not_blank_check
    check (code is null or length(btrim(code)) > 0),
  constraint courses_color_format_check
    check (color is null or color ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  estimated_hours numeric(6,2),
  difficulty integer,
  priority integer,
  source public.assignment_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_title_not_blank_check
    check (length(btrim(title)) > 0),
  constraint assignments_estimated_hours_check
    check (estimated_hours is null or estimated_hours >= 0),
  constraint assignments_difficulty_check
    check (difficulty is null or difficulty between 1 and 5),
  constraint assignments_priority_check
    check (priority is null or priority between 1 and 5)
);

create table public.study_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_by public.plan_generator not null default 'planner',
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_plans_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create table public.study_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.session_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sessions_time_range_check
    check (ends_at > starts_at)
);

create table public.integrations (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.integration_provider not null,
  external_user_id text,
  encrypted_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integrations_external_user_id_not_blank_check
    check (external_user_id is null or length(btrim(external_user_id)) > 0),
  constraint integrations_encrypted_token_not_blank_check
    check (length(btrim(encrypted_token)) > 0),
  constraint integrations_user_provider_unique
    unique (user_id, provider)
);

comment on column public.integrations.encrypted_token is
  'Application-level encrypted access token. Before broad production rollout, migrate token material into Supabase Vault, a cloud KMS, or a dedicated secrets service and retain only a stable secret reference in this table.';

comment on column public.integrations.refresh_token is
  'Application-level encrypted refresh token. Treat as highly sensitive; migrate to Vault/KMS with envelope encryption and rotate stored token references during the migration.';

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete cascade,
  session_id uuid references public.study_sessions(id) on delete cascade,
  channel public.notification_channel not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status public.notification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_sent_at_check
    check (
      (status = 'sent' and sent_at is not null)
      or (status in ('pending', 'failed'))
    )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create trigger set_assignments_updated_at
  before update on public.assignments
  for each row execute function public.set_updated_at();

create trigger set_study_plans_updated_at
  before update on public.study_plans
  for each row execute function public.set_updated_at();

create trigger set_study_sessions_updated_at
  before update on public.study_sessions
  for each row execute function public.set_updated_at();

create trigger set_integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

create trigger set_notifications_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_auth_user_insert
  after insert on auth.users
  for each row execute function private.create_profile_for_new_user();

create or replace function private.validate_assignment_course_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owning_user_id uuid;
begin
  select courses.user_id
    into owning_user_id
  from public.courses
  where courses.id = new.course_id;

  if owning_user_id is null then
    raise exception 'assignment course does not exist';
  end if;

  if owning_user_id <> new.user_id then
    raise exception 'assignment course must belong to the same user';
  end if;

  return new;
end;
$$;

create trigger validate_assignment_course_ownership
  before insert or update of user_id, course_id on public.assignments
  for each row execute function private.validate_assignment_course_ownership();

create or replace function private.validate_study_session_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_user_id uuid;
  assignment_user_id uuid;
begin
  select study_plans.user_id
    into plan_user_id
  from public.study_plans
  where study_plans.id = new.plan_id;

  if plan_user_id is null then
    raise exception 'study session plan does not exist';
  end if;

  if new.assignment_id is not null then
    select assignments.user_id
      into assignment_user_id
    from public.assignments
    where assignments.id = new.assignment_id;

    if assignment_user_id is null then
      raise exception 'study session assignment does not exist';
    end if;

    if assignment_user_id <> plan_user_id then
      raise exception 'study session assignment must belong to the same user as the plan';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_study_session_ownership
  before insert or update of plan_id, assignment_id on public.study_sessions
  for each row execute function private.validate_study_session_ownership();

create or replace function private.validate_notification_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_user_id uuid;
  session_user_id uuid;
begin
  if new.assignment_id is not null then
    select assignments.user_id
      into assignment_user_id
    from public.assignments
    where assignments.id = new.assignment_id;

    if assignment_user_id is null then
      raise exception 'notification assignment does not exist';
    end if;

    if assignment_user_id <> new.user_id then
      raise exception 'notification assignment must belong to the same user';
    end if;
  end if;

  if new.session_id is not null then
    select study_plans.user_id
      into session_user_id
    from public.study_sessions
    join public.study_plans on study_plans.id = study_sessions.plan_id
    where study_sessions.id = new.session_id;

    if session_user_id is null then
      raise exception 'notification study session does not exist';
    end if;

    if session_user_id <> new.user_id then
      raise exception 'notification study session must belong to the same user';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_notification_ownership
  before insert or update of user_id, assignment_id, session_id on public.notifications
  for each row execute function private.validate_notification_ownership();

create index courses_user_id_idx
  on public.courses (user_id);

create index courses_user_id_term_idx
  on public.courses (user_id, term);

create index assignments_user_id_idx
  on public.assignments (user_id);

create index assignments_user_id_due_at_idx
  on public.assignments (user_id, due_at);

create index assignments_course_id_idx
  on public.assignments (course_id);

create index assignments_user_id_source_idx
  on public.assignments (user_id, source);

create index assignments_user_id_priority_due_at_idx
  on public.assignments (user_id, priority, due_at);

create index assignments_due_at_active_idx
  on public.assignments (due_at)
  where due_at >= '2000-01-01 00:00:00+00'::timestamptz;

create index study_plans_user_id_idx
  on public.study_plans (user_id);

create index study_plans_user_id_created_at_idx
  on public.study_plans (user_id, created_at desc);

create index study_plans_metadata_gin_idx
  on public.study_plans using gin (metadata);

create index study_sessions_plan_id_idx
  on public.study_sessions (plan_id);

create index study_sessions_starts_at_idx
  on public.study_sessions (starts_at);

create index study_sessions_plan_id_starts_at_idx
  on public.study_sessions (plan_id, starts_at);

create index study_sessions_assignment_id_idx
  on public.study_sessions (assignment_id);

create index study_sessions_status_starts_at_idx
  on public.study_sessions (status, starts_at);

create index integrations_user_id_idx
  on public.integrations (user_id);

create index integrations_user_id_provider_idx
  on public.integrations (user_id, provider);

create index integrations_expires_at_idx
  on public.integrations (expires_at)
  where expires_at is not null;

create index notifications_user_id_idx
  on public.notifications (user_id);

create index notifications_scheduled_at_idx
  on public.notifications (scheduled_at);

create index notifications_status_idx
  on public.notifications (status);

create index notifications_status_scheduled_at_idx
  on public.notifications (status, scheduled_at);

create index notifications_user_id_status_scheduled_at_idx
  on public.notifications (user_id, status, scheduled_at);

create index notifications_assignment_id_idx
  on public.notifications (assignment_id);

create index notifications_session_id_idx
  on public.notifications (session_id);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.assignments enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_sessions enable row level security;
alter table public.integrations enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (id = (select auth.uid()));

create policy "courses_select_own"
  on public.courses for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "courses_insert_own"
  on public.courses for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "courses_update_own"
  on public.courses for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "courses_delete_own"
  on public.courses for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "assignments_select_own"
  on public.assignments for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "assignments_insert_own"
  on public.assignments for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.courses
      where courses.id = assignments.course_id
        and courses.user_id = (select auth.uid())
    )
  );

create policy "assignments_update_own"
  on public.assignments for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.courses
      where courses.id = assignments.course_id
        and courses.user_id = (select auth.uid())
    )
  );

create policy "assignments_delete_own"
  on public.assignments for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "study_plans_select_own"
  on public.study_plans for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "study_plans_insert_own"
  on public.study_plans for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "study_plans_update_own"
  on public.study_plans for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "study_plans_delete_own"
  on public.study_plans for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "study_sessions_select_own"
  on public.study_sessions for select
  to authenticated
  using (
    exists (
      select 1
      from public.study_plans
      where study_plans.id = study_sessions.plan_id
        and study_plans.user_id = (select auth.uid())
    )
  );

create policy "study_sessions_insert_own"
  on public.study_sessions for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.study_plans
      where study_plans.id = study_sessions.plan_id
        and study_plans.user_id = (select auth.uid())
    )
    and (
      assignment_id is null
      or exists (
        select 1
        from public.assignments
        where assignments.id = study_sessions.assignment_id
          and assignments.user_id = (select auth.uid())
      )
    )
  );

create policy "study_sessions_update_own"
  on public.study_sessions for update
  to authenticated
  using (
    exists (
      select 1
      from public.study_plans
      where study_plans.id = study_sessions.plan_id
        and study_plans.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.study_plans
      where study_plans.id = study_sessions.plan_id
        and study_plans.user_id = (select auth.uid())
    )
    and (
      assignment_id is null
      or exists (
        select 1
        from public.assignments
        where assignments.id = study_sessions.assignment_id
          and assignments.user_id = (select auth.uid())
      )
    )
  );

create policy "study_sessions_delete_own"
  on public.study_sessions for delete
  to authenticated
  using (
    exists (
      select 1
      from public.study_plans
      where study_plans.id = study_sessions.plan_id
        and study_plans.user_id = (select auth.uid())
    )
  );

create policy "integrations_select_own"
  on public.integrations for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "integrations_insert_own"
  on public.integrations for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "integrations_update_own"
  on public.integrations for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "integrations_delete_own"
  on public.integrations for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications_insert_own"
  on public.notifications for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      assignment_id is null
      or exists (
        select 1
        from public.assignments
        where assignments.id = notifications.assignment_id
          and assignments.user_id = (select auth.uid())
      )
    )
    and (
      session_id is null
      or exists (
        select 1
        from public.study_sessions
        join public.study_plans on study_plans.id = study_sessions.plan_id
        where study_sessions.id = notifications.session_id
          and study_plans.user_id = (select auth.uid())
      )
    )
  );

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      assignment_id is null
      or exists (
        select 1
        from public.assignments
        where assignments.id = notifications.assignment_id
          and assignments.user_id = (select auth.uid())
      )
    )
    and (
      session_id is null
      or exists (
        select 1
        from public.study_sessions
        join public.study_plans on study_plans.id = study_sessions.plan_id
        where study_sessions.id = notifications.session_id
          and study_plans.user_id = (select auth.uid())
      )
    )
  );

create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

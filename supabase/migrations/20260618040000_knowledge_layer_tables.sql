-- Enable vector extension if not already present
create extension if not exists vector with schema extensions;

-- 1. Calendar Events Table
create table public.calendar_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  event_type text not null default 'personal', -- 'class', 'exam', 'personal', 'commitment'
  source text not null default 'manual', -- 'google_calendar', 'manual'
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_time_range_check check (ends_at > starts_at),
  constraint calendar_events_title_not_blank check (length(btrim(title)) > 0)
);

comment on table public.calendar_events is 'Stores aggregated calendar events, classes, and personal commitments.';

-- 2. Exam Schedule Table
create table public.exam_schedule (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  exam_date timestamptz not null,
  duration_minutes integer not null default 120,
  location text,
  weight numeric(5,2), -- e.g., 25.00 for 25% of final grade
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_schedule_title_not_blank check (length(btrim(title)) > 0),
  constraint exam_schedule_duration_check check (duration_minutes > 0)
);

comment on table public.exam_schedule is 'Stores schedule information for courses examinations.';

-- 3. AI Memories Table (for RAG & personalized profile context)
create table public.ai_memories (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null default 'preference', -- 'preference', 'habit', 'performance', 'profile'
  content text not null,
  embedding extensions.vector(768), -- Dimension 768 matches Google Gen AI text-embedding-004
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_memories_content_not_blank check (length(btrim(content)) > 0)
);

comment on table public.ai_memories is 'Stores persistent AI-extracted learning preferences, study habits, strengths, and weaknesses.';

-- 4. Productivity Metrics Table
create table public.productivity_metrics (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_date date not null default current_date,
  completion_rate numeric(5,2) not null default 0.00, -- e.g. 85.50 for 85.5%
  focus_duration_minutes integer not null default 0,
  missed_deadlines integer not null default 0,
  study_consistency_score numeric(5,2) not null default 0.00,
  strongest_subjects text[] not null default '{}',
  weakest_subjects text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint productivity_metrics_user_date_unique unique (user_id, metric_date)
);

comment on table public.productivity_metrics is 'Stores daily/historical summaries of study achievements for analytics and trend forecasting.';

-- Triggers for automatic updated_at
create trigger set_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

create trigger set_exam_schedule_updated_at
  before update on public.exam_schedule
  for each row execute function public.set_updated_at();

create trigger set_ai_memories_updated_at
  before update on public.ai_memories
  for each row execute function public.set_updated_at();

create trigger set_productivity_metrics_updated_at
  before update on public.productivity_metrics
  for each row execute function public.set_updated_at();

-- Indexes for performance
create index calendar_events_user_id_idx on public.calendar_events (user_id);
create index calendar_events_starts_at_idx on public.calendar_events (starts_at);
create index exam_schedule_user_id_idx on public.exam_schedule (user_id);
create index exam_schedule_exam_date_idx on public.exam_schedule (exam_date);
create index ai_memories_user_id_idx on public.ai_memories (user_id);
create index productivity_metrics_user_id_idx on public.productivity_metrics (user_id);

-- Enable Row Level Security
alter table public.calendar_events enable row level security;
alter table public.exam_schedule enable row level security;
alter table public.ai_memories enable row level security;
alter table public.productivity_metrics enable row level security;

-- RLS Policies
create policy "calendar_events_select_own"
  on public.calendar_events for select to authenticated
  using (user_id = auth.uid());

create policy "calendar_events_insert_own"
  on public.calendar_events for insert to authenticated
  with check (user_id = auth.uid());

create policy "calendar_events_update_own"
  on public.calendar_events for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "calendar_events_delete_own"
  on public.calendar_events for delete to authenticated
  using (user_id = auth.uid());

create policy "exam_schedule_select_own"
  on public.exam_schedule for select to authenticated
  using (user_id = auth.uid());

create policy "exam_schedule_insert_own"
  on public.exam_schedule for insert to authenticated
  with check (user_id = auth.uid());

create policy "exam_schedule_update_own"
  on public.exam_schedule for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "exam_schedule_delete_own"
  on public.exam_schedule for delete to authenticated
  using (user_id = auth.uid());

create policy "ai_memories_select_own"
  on public.ai_memories for select to authenticated
  using (user_id = auth.uid());

create policy "ai_memories_insert_own"
  on public.ai_memories for insert to authenticated
  with check (user_id = auth.uid());

create policy "ai_memories_update_own"
  on public.ai_memories for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "ai_memories_delete_own"
  on public.ai_memories for delete to authenticated
  using (user_id = auth.uid());

create policy "productivity_metrics_select_own"
  on public.productivity_metrics for select to authenticated
  using (user_id = auth.uid());

create policy "productivity_metrics_insert_own"
  on public.productivity_metrics for insert to authenticated
  with check (user_id = auth.uid());

create policy "productivity_metrics_update_own"
  on public.productivity_metrics for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "productivity_metrics_delete_own"
  on public.productivity_metrics for delete to authenticated
  using (user_id = auth.uid());

-- Grants
grant select, insert, update, delete on public.calendar_events to authenticated;
grant select, insert, update, delete on public.exam_schedule to authenticated;
grant select, insert, update, delete on public.ai_memories to authenticated;
grant select, insert, update, delete on public.productivity_metrics to authenticated;

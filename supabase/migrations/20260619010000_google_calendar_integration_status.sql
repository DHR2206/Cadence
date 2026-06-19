alter type public.integration_provider add value if not exists 'google_calendar';

alter table public.integrations
  add column if not exists status text not null default 'connected';

alter table public.integrations
  add column if not exists last_synced_at timestamptz;

alter table public.integrations
  add constraint integrations_status_check
  check (status in ('connected', 'disconnected')) not valid;

comment on column public.integrations.status is
  'Connection lifecycle state for the integration. Disconnected rows retain metadata but must not be used for sync.';

comment on column public.integrations.last_synced_at is
  'Most recent successful server-side sync completion time.';

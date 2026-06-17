-- Add type column to study_sessions table
alter table public.study_sessions
add column type text;

comment on column public.study_sessions.type is 'The type of the study session (e.g., deep-work or study).';

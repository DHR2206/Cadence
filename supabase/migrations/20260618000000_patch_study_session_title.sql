-- Add title column to study_sessions table
alter table public.study_sessions
add column title text;

comment on column public.study_sessions.title is 'Optional custom title for study sessions. Defaults to associated assignment or course title.';

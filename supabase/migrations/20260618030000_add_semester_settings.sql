-- Add semester settings to profiles table
alter table public.profiles
add column semester_start date,
add column semester_weeks integer;

comment on column public.profiles.semester_start is 'The start date of the academic semester.';
comment on column public.profiles.semester_weeks is 'The number of weeks in the academic semester.';

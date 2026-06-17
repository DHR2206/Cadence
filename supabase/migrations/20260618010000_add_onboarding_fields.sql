-- Add onboarding fields to profiles table
alter table public.profiles
add column university_name text,
add column semester text,
add column onboarding_completed boolean not null default false;

comment on column public.profiles.university_name is 'The university name collected during onboarding.';
comment on column public.profiles.semester is 'The current semester tag collected during onboarding.';
comment on column public.profiles.onboarding_completed is 'Flag indicating if the student has completed the onboarding flow.';

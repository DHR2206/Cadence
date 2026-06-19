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
    nullif(
      btrim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          new.raw_user_meta_data ->> 'display_name',
          split_part(new.email, '@', 1)
        )
      ),
      ''
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_after_auth_user_insert on auth.users;

create trigger create_profile_after_auth_user_insert
  after insert on auth.users
  for each row execute function private.create_profile_for_new_user();

insert into public.profiles (id, full_name)
select
  users.id,
  nullif(
    btrim(
      coalesce(
        users.raw_user_meta_data ->> 'full_name',
        users.raw_user_meta_data ->> 'name',
        users.raw_user_meta_data ->> 'display_name',
        split_part(users.email, '@', 1)
      )
    ),
    ''
  )
from auth.users
where not exists (
  select 1
  from public.profiles
  where profiles.id = users.id
)
on conflict (id) do nothing;

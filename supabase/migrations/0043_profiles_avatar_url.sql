-- Re-introduce profiles.avatar_url and capture it from Google OAuth metadata.
-- Previously dropped in 0005 because client/owner profiles wouldn't populate
-- it; reps signing in with Google do, and the sidebar now renders it.

alter table public.profiles
  add column if not exists avatar_url text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$;

-- Keep avatar_url fresh whenever Google refreshes the user's metadata
-- (e.g. user changes their Google profile photo and re-signs in).
create or replace function public.handle_auth_user_metadata_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data is distinct from old.raw_user_meta_data then
    update public.profiles
       set avatar_url = coalesce(
             new.raw_user_meta_data->>'avatar_url',
             new.raw_user_meta_data->>'picture',
             avatar_url
           )
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_metadata_sync on auth.users;
create trigger on_auth_user_metadata_sync
  after update on auth.users
  for each row execute function public.handle_auth_user_metadata_sync();

-- Backfill from existing auth.users metadata.
update public.profiles p
   set avatar_url = coalesce(
         u.raw_user_meta_data->>'avatar_url',
         u.raw_user_meta_data->>'picture'
       )
  from auth.users u
 where u.id = p.id
   and p.avatar_url is null
   and (
     u.raw_user_meta_data ? 'avatar_url'
     or u.raw_user_meta_data ? 'picture'
   );

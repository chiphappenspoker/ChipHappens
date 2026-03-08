-- Phase 3: invite_code on groups, role on group_members

-- 1. Add groups.invite_code (nullable first for backfill)
alter table public.groups
  add column if not exists invite_code text;

-- 2. Unique index: only on non-null invite_code so multiple nulls are allowed until backfill
create unique index if not exists groups_invite_code_key
  on public.groups (invite_code)
  where invite_code is not null and invite_code <> '';

-- 3. Trigger: set invite_code on insert/update when null or empty
create or replace function public.set_group_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null or trim(new.invite_code) = '' then
    new.invite_code := lower(substring(md5(gen_random_uuid()::text) from 1 for 8));
  end if;
  return new;
end;
$$;

drop trigger if exists set_group_invite_code on public.groups;
create trigger set_group_invite_code
  before insert or update on public.groups
  for each row execute function public.set_group_invite_code();

-- 4. Backfill: deterministic per row from id to avoid collisions and to avoid trigger overwriting
update public.groups
set invite_code = lower(substring(md5(id::text) from 1 for 8))
where invite_code is null or trim(invite_code) = '';

-- 5. Enforce not null
alter table public.groups
  alter column invite_code set not null;

-- 6. group_members.role
alter table public.group_members
  add column if not exists role text not null default 'member'
  check (role in ('admin', 'member'));

-- Allow anyone (including anon) to look up a group by invite_code for the join flow.
-- RLS on groups blocks direct SELECT for non-members; this SECURITY DEFINER function bypasses RLS
-- and returns only the row matching the invite code.

create or replace function public.get_group_by_invite_code(p_invite_code text)
returns setof public.groups
language sql
security definer
stable
set search_path = public
as $$
  select * from public.groups
  where invite_code = nullif(trim(p_invite_code), '')
  limit 1;
$$;

grant execute on function public.get_group_by_invite_code(text) to anon;
grant execute on function public.get_group_by_invite_code(text) to authenticated;

-- Reload PostgREST schema cache so the new function is exposed.
notify pgrst, 'reload schema';

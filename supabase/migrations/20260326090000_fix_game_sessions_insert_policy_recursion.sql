-- Fix game_sessions insert policy recursion:
-- the prior policy queried public.game_sessions inside its own WITH CHECK,
-- which can recurse through RLS evaluation and raise Internal Server Error.

create or replace function public.can_insert_game_session(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    uid is not null
    and (
      public.user_has_pro(uid)
      or (select count(*)::int from public.game_sessions gs where gs.created_by = uid) < 10
    );
$$;

grant execute on function public.can_insert_game_session(uuid) to authenticated;

drop policy if exists "game_sessions_insert_creator" on public.game_sessions;

create policy "game_sessions_insert_creator" on public.game_sessions
  for insert with check (
    auth.uid() = created_by
    and public.can_insert_game_session(auth.uid())
    and (
      group_id is null
      or public.user_has_pro(auth.uid())
    )
  );

notify pgrst, 'reload schema';

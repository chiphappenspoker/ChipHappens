-- Group members can SELECT game_sessions for groups they belong to.
create policy "game_sessions_select_group_member" on public.game_sessions
  for select
  using (
    group_id is not null
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = game_sessions.group_id
        and gm.user_id = auth.uid()
    )
  );

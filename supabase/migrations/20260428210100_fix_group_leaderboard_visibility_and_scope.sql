-- Make leaderboard consistent across all group members by bypassing per-row
-- game_players RLS in the aggregate function while enforcing membership/pro checks.
-- Also ensure aggregates are scoped to the selected group/date window only.

drop function if exists public.get_group_leaderboard(date, uuid, date);

create or replace function public.get_group_leaderboard(
  p_from_date date default null,
  p_group_id uuid default null,
  p_to_date date default null
)
returns table (
  user_id uuid,
  display_name text,
  total_profit numeric,
  total_sessions bigint,
  win_count bigint,
  loss_count bigint,
  avg_profit numeric,
  max_session_profit numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    gm.user_id,
    p.display_name,
    coalesce(sum(case when gs.id is not null then gp.net_result else 0 end), 0)::numeric as total_profit,
    count(distinct gs.id)::bigint as total_sessions,
    count(*) filter (where gs.id is not null and gp.net_result > 0)::bigint as win_count,
    count(*) filter (where gs.id is not null and gp.net_result < 0)::bigint as loss_count,
    coalesce(avg(case when gs.id is not null then gp.net_result end), 0)::numeric as avg_profit,
    coalesce(max(case when gs.id is not null then gp.net_result end), 0)::numeric as max_session_profit
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  left join public.game_players gp on gp.user_id = gm.user_id
  left join public.game_sessions gs on gs.id = gp.session_id
    and gs.group_id = p_group_id
    and (p_from_date is null or gs.session_date >= p_from_date)
    and (p_to_date is null or gs.session_date <= p_to_date)
  where gm.group_id = p_group_id
    and p_group_id is not null
    and public.user_has_pro(auth.uid())
    and coalesce(p.leaderboard_opt_out, false) = false
    and exists (
      select 1 from public.group_members gx
      where gx.group_id = p_group_id
        and gx.user_id = auth.uid()
    )
  group by gm.user_id, p.display_name;
$$;

grant execute on function public.get_group_leaderboard(date, uuid, date) to authenticated;

notify pgrst, 'reload schema';

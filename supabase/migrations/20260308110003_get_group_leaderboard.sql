-- Leaderboard for a group: one row per member with aggregates (optional date range)
create or replace function public.get_group_leaderboard(
  p_group_id uuid,
  p_from_date date default null,
  p_to_date date default null
)
returns table (
  user_id uuid,
  display_name text,
  total_profit numeric,
  total_sessions bigint,
  win_count bigint,
  loss_count bigint
)
language sql
stable
security invoker
as $$
  select
    gm.user_id,
    p.display_name,
    coalesce(sum(gp.net_result), 0)::numeric as total_profit,
    count(distinct gs.id)::bigint as total_sessions,
    count(*) filter (where gp.net_result > 0)::bigint as win_count,
    count(*) filter (where gp.net_result < 0)::bigint as loss_count
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  left join public.game_players gp on gp.user_id = gm.user_id
  left join public.game_sessions gs on gs.id = gp.session_id
    and gs.group_id = p_group_id
    and (p_from_date is null or gs.session_date >= p_from_date)
    and (p_to_date is null or gs.session_date <= p_to_date)
  where gm.group_id = p_group_id
  group by gm.user_id, p.display_name;
$$;

grant execute on function public.get_group_leaderboard(uuid, date, date) to authenticated;

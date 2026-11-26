-- 006_tally_excludes_left: tally 가 게임 중 나간 사람(players.left_at)의 표를 세지 않게 한다
-- 나간 사람은 기권 (BR-011, AC-BR-011). 나가기 전에 이미 낸 표도 뺀다 `제안` (#46), PO 확인 중.
-- 다시 들어오면 join_room 이 left_at 을 비우므로 그 사람의 표는 다시 센다.
-- 시그니처, 권한(service role 만)은 003 과 같다.
create or replace function public.tally(p_game_id uuid, p_round int)
returns table (target_player_id uuid, vote_count int)
language sql
stable
security definer
set search_path = ''
as $$
  with counts as (
    select v.target_player_id, count(*)::int as vote_count
    from public.votes v
    join public.players p on p.id = v.voter_player_id
    where v.game_id = p_game_id
      and v.round = p_round
      and p.left_at is null
    group by v.target_player_id
  )
  select c.target_player_id, c.vote_count
  from counts c
  where c.vote_count = (select max(vote_count) from counts)
  order by c.target_player_id
$$;

revoke execute on function public.tally(uuid, int) from public, anon, authenticated;
grant execute on function public.tally(uuid, int) to service_role;

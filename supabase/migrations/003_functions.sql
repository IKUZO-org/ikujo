-- 003_functions: 서버 함수 (docs/data.md §7)
-- 코드로 방에 들어가는 join_room 은 단계 4에서 joinRoom 과 같이 만든다.

-- tally: 이 판, 이 라운드의 최다 득표자 목록 (spec S-11, AC-060, AC-060-2)
--   1명이면 판정, 2명 이상이면 동점(재투표 후보), 0명이면 아무도 안 찍음.
--   동점과 무투표를 어떻게 끝낼지(OQ-008)는 부르는 쪽(서버)이 정한다.
-- security definer: votes 는 본인 것만 읽히므로 전체 집계는 이 함수로만 한다.
-- 집계 결과는 해설 전까지 비밀이라 서버(service role)만 부를 수 있게 한다 (BR-001).
create function public.tally(p_game_id uuid, p_round int)
returns table (target_player_id uuid, vote_count int)
language sql
stable
security definer
set search_path = ''
as $$
  with counts as (
    select v.target_player_id, count(*)::int as vote_count
    from public.votes v
    where v.game_id = p_game_id
      and v.round = p_round
    group by v.target_player_id
  )
  select c.target_player_id, c.vote_count
  from counts c
  where c.vote_count = (select max(vote_count) from counts)
  order by c.target_player_id
$$;

revoke execute on function public.tally(uuid, int) from public, anon, authenticated;
grant execute on function public.tally(uuid, int) to service_role;

-- 009_cleanup: 하루 한 번 정리 작업 (data §6, D-019, D-026, D-027, #74)
-- pg_cron 이 postgres 로 함수를 부른다. 앱에서 부르지 않으므로 어떤 앱 역할에도 실행 권한을 주지 않는다.
create extension if not exists pg_cron;

create or replace function public.cleanup_stale_and_old()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_room record;
begin
  -- (1) 24시간 활동 없는 방을 끝낸다 (D-027).
  -- `제안` (#74): 방의 마지막 활동은 greatest(방 created_at, 그 방 판들의 phase_started_at 최댓값).
  -- data §6 은 대기 중인 방을 created_at 기준이라 적었지만, 판 취소 뒤 대기실로 돌아온 방이
  -- 바로 끝나거나 진행 중 판 없이 playing 인 방이 남지 않도록 방 단위로 본다.
  -- 잠그고 다시 본다: READ COMMITTED 는 문장마다 새 스냅샷이라, 한 문장으로 고르고 끝내면
  -- 그 사이 판이 다음 단계로 넘어가도(games 줄 잠금을 기다렸다 커밋) 처음 본 값으로 방과 판을 끝낸다.
  -- 그래서 방과 그 방의 판을 잠근 뒤 같은 조건을 다시 계산해 맞을 때만 둘을 같이 끝낸다.
  -- 다른 요청이 잡고 있는 방은 skip locked 로 건너뛰고 다음 날 다시 본다 (#74)
  -- 받아들인 한계: 게임 시작이 방을 playing 으로 바꾼 뒤 AI 배정 중이라 games 를 넣기 전에 정리가 돌면
  -- 끝난 방에 판이 남을 수 있다. 두 일이 한 트랜잭션이 아니라 잠금으로 막지 못한다 (#74)
  for v_room in
    -- 후보 거르기용. 끝낼지는 잠근 뒤 다시 본다
    select r.id
    from public.rooms r
    where r.status <> 'ended'
      and greatest(
        r.created_at,
        (select max(g.phase_started_at) from public.games g where g.room_id = r.id)
      ) < v_now - interval '24 hours'
    for update of r skip locked
  loop
    perform 1 from public.games g
    where g.room_id = v_room.id and g.phase <> 'ended'
    for update;

    if greatest(
      (select r.created_at from public.rooms r where r.id = v_room.id),
      (select max(g.phase_started_at) from public.games g where g.room_id = v_room.id)
    ) < v_now - interval '24 hours' then
      update public.games g
      set phase = 'ended', ended_reason = 'stale', ended_at = v_now
      where g.room_id = v_room.id and g.phase <> 'ended';

      update public.rooms r
      set status = 'ended', ended_at = v_now
      where r.id = v_room.id;
    end if;
  end loop;

  -- (2) 끝난 지 30일 지난 방을 지운다 (D-019). 판, 참가자와 딸린 표는 cascade.
  -- ghost_actions.body 를 판이 끝날 때 지우는 것(data §2 `제안`)은 하지 않고 여기서 같이 지운다 (#74)
  delete from public.rooms r
  where r.status = 'ended' and r.ended_at < v_now - interval '30 days';

  -- (3) 30일 지났고 남은 방이 없는 익명 사용자를 지운다 (D-026). 다른 방에 남아 있으면 둔다
  delete from auth.users u
  where u.is_anonymous
    and u.created_at < v_now - interval '30 days'
    and not exists (select 1 from public.players p where p.user_id = u.id);
end;
$$;

revoke execute on function public.cleanup_stale_and_old() from public, anon, authenticated, service_role;

-- 매일 18:00 UTC (한국 03:00)
select cron.schedule('ikujo-cleanup', '0 18 * * *', 'select public.cleanup_stale_and_old()');

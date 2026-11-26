-- 008_ended_reason: games.ended_reason 에 cancelled, stale 을 더한다 (data §2 4판, D-025, D-027, #72)
-- cancelled: 추리 전(intro, secret) 범인이 나가 판을 취소. stale: 24시간 활동 없는 판 (단계 11 정리 작업)
-- 001 의 열 check 제약(이름은 Postgres 가 붙인 games_ended_reason_check)을 바꾼다.
alter table public.games drop constraint games_ended_reason_check;
alter table public.games
  add constraint games_ended_reason_check
  check (ended_reason in ('normal', 'culprit_left', 'cancelled', 'stale'));

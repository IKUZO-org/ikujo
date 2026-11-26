-- 005_ghost: 유령 속삭임은 라운드당 1번 (docs/data.md §2 ghost_actions, spec S-10, #48)
-- OQ-005 임시 결정(spec §9). 서버(whisper)가 먼저 보지만, 동시에 두 번 눌러도 한 줄만 들어가게 DB 가 마지막으로 막는다.
-- 출몰 1번은 001_core.sql 의 ghost_actions_one_haunt_key 가 막는다 (AC-053).
create unique index ghost_actions_one_whisper_per_round_key
  on public.ghost_actions (game_id, from_player_id, round)
  where kind = 'whisper';

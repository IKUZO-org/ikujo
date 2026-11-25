-- 001_core: 표와 인덱스 (docs/data.md §2, §7)
-- 쓰기는 전부 서버(service role)가 한다. 권한은 002_rls 에서 건다.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 10),
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[0-9]{6}$'),
  scenario_id text not null default 'live-death',
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'ended')),
  host_player_id uuid, -- players 를 만든 뒤 아래에서 외래 키를 건다
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
-- 진행 중인 방끼리만 코드가 겹치지 않게 (FR-010)
create unique index rooms_code_active_key on public.rooms (code) where status <> 'ended';

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  is_guest boolean not null default true,
  nickname text not null check (char_length(nickname) between 1 and 12),
  seat int not null check (seat between 1 and 6),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (room_id, user_id),
  unique (room_id, seat)
);
create index players_user_id_idx on public.players (user_id);

alter table public.rooms
  add constraint rooms_host_player_id_fkey
  foreign key (host_player_id) references public.players (id) on delete set null;

create table public.games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_count int not null check (player_count between 4 and 6),
  phase text not null default 'intro'
    check (phase in ('intro', 'secret', 'r1', 'r2', 'r3', 'vote', 'revote', 'reveal', 'ended')),
  phase_started_at timestamptz not null default now(),
  phase_ends_at timestamptz,
  revote_candidates uuid[],
  outcome text check (outcome in ('caught', 'aired_off')),
  ended_reason text check (ended_reason in ('normal', 'culprit_left')),
  assignment_source text not null check (assignment_source in ('ai', 'rule')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index games_room_id_idx on public.games (room_id);

-- 범인, 희생자는 games 에 두지 않는다 (읽기 권한이 넓어서). 서버만 읽는다
create table public.game_secrets (
  game_id uuid primary key references public.games (id) on delete cascade,
  culprit_player_id uuid not null references public.players (id) on delete cascade,
  victim_player_id uuid not null references public.players (id) on delete cascade,
  culprit_character text not null,
  ghost_trait text not null,
  llm_raw jsonb
);

create table public.assignments (
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  character_id text not null
    check (character_id in ('fav', 'villain', 'athlete', 'writer', 'influencer', 'medic')),
  secret_id text not null,
  alibi_id text not null,
  is_culprit boolean not null default false,
  clue_ids jsonb not null default '{}'::jsonb,
  is_ghost boolean not null default false,
  primary key (game_id, player_id)
);
create index assignments_player_id_idx on public.assignments (player_id);

create table public.revealed_clues (
  game_id uuid not null references public.games (id) on delete cascade,
  clue_id text not null,
  round int not null check (round between 1 and 3),
  revealed_at timestamptz not null default now(),
  primary key (game_id, clue_id)
);

create table public.readies (
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  phase text not null,
  at timestamptz not null default now(),
  primary key (game_id, player_id, phase)
);

create table public.votes (
  game_id uuid not null references public.games (id) on delete cascade,
  round int not null check (round in (1, 2)), -- 1 투표, 2 재투표
  voter_player_id uuid not null references public.players (id) on delete cascade,
  target_player_id uuid not null references public.players (id) on delete cascade,
  at timestamptz not null default now(),
  primary key (game_id, round, voter_player_id)
);

create table public.ghost_actions (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games (id) on delete cascade,
  kind text not null check (kind in ('whisper', 'haunt')),
  from_player_id uuid not null references public.players (id) on delete cascade,
  to_player_id uuid references public.players (id) on delete cascade,
  round int not null check (round between 1 and 3),
  body text check (char_length(body) between 1 and 80), -- 판이 끝나면 지운다 (data §6 제안)
  at timestamptz not null default now(),
  check ((kind = 'whisper') = (to_player_id is not null))
);
create index ghost_actions_game_id_idx on public.ghost_actions (game_id);
-- 출몰은 판에 1번 (AC-053)
create unique index ghost_actions_one_haunt_key on public.ghost_actions (game_id) where kind = 'haunt';

create table public.reveals (
  game_id uuid primary key references public.games (id) on delete cascade,
  body jsonb not null,
  personal text,
  created_at timestamptz not null default now()
);

create table public.completions (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  scenario_id text not null,
  game_id uuid not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, scenario_id, game_id)
);

create table public.events (
  id bigint generated always as identity primary key,
  name text not null,
  room_id uuid,
  game_id uuid,
  props jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

-- 002_rls: 모든 표 RLS + 읽기 정책 (docs/data.md §3)
-- 쓰기 정책은 두지 않는다. 쓰기는 Server Action 이 service role 로 한다 (ARCHITECTURE.md §2).
-- 익명 손님도 authenticated 역할을 받는다. 그래서 "로그인했으면 읽기" 정책은 쓰지 않고,
-- 모든 정책을 auth.uid() 와 참가 여부로 건다.

-- 도우미 함수 -----------------------------------------------------------------
-- security definer: players 를 읽는 정책 안에서 players 를 다시 읽을 때 RLS 가 되풀이되지 않게 한다.

-- 이 방에서 내 players.id (data §3)
create function public.my_player(p_room_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.players p
  where p.room_id = p_room_id
    and p.user_id = auth.uid()
$$;

-- 나는 이 방 참가자인가
create function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players p
    where p.room_id = p_room_id
      and p.user_id = auth.uid()
  )
$$;

-- 나는 이 판(의 방) 참가자인가
create function public.is_game_member(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.games g
    join public.players p on p.room_id = g.room_id
    where g.id = p_game_id
      and p.user_id = auth.uid()
  )
$$;

-- 이 players.id 가 나인가
create function public.is_me(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.players p
    where p.id = p_player_id
      and p.user_id = auth.uid()
  )
$$;

revoke execute on function public.my_player(uuid), public.is_room_member(uuid),
  public.is_game_member(uuid), public.is_me(uuid) from public, anon;
grant execute on function public.my_player(uuid), public.is_room_member(uuid),
  public.is_game_member(uuid), public.is_me(uuid) to authenticated;

-- RLS 켜기 (모든 표) ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.game_secrets enable row level security;
alter table public.assignments enable row level security;
alter table public.revealed_clues enable row level security;
alter table public.readies enable row level security;
alter table public.votes enable row level security;
alter table public.ghost_actions enable row level security;
alter table public.reveals enable row level security;
alter table public.completions enable row level security;
alter table public.events enable row level security;

-- 읽기 정책 --------------------------------------------------------------------

create policy "본인 프로필" on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

-- 코드로 방 찾기는 단계 4 join_room 에서 한다. 참가자가 아니면 0줄
create policy "그 방 참가자" on public.rooms
  for select to authenticated
  using (public.is_room_member(id));

create policy "같은 방 참가자" on public.players
  for select to authenticated
  using (public.is_room_member(room_id));

create policy "그 방 참가자" on public.games
  for select to authenticated
  using (public.is_room_member(room_id));

-- game_secrets: 정책 없음. 서버만 읽는다 (NFR-004)

create policy "본인 배정만" on public.assignments
  for select to authenticated
  using (public.is_me(player_id));

create policy "그 판 참가자" on public.revealed_clues
  for select to authenticated
  using (public.is_game_member(game_id));

create policy "그 판 참가자" on public.readies
  for select to authenticated
  using (public.is_game_member(game_id));

-- 공용에는 완료 인원만. 개별 선택은 본인 것만 (AC-060, BR-001)
create policy "본인 투표만" on public.votes
  for select to authenticated
  using (public.is_me(voter_player_id));

-- 속삭임: 보낸 사람, 받은 사람 / 출몰: 그 판 참가자
create policy "속삭임은 당사자, 출몰은 참가자" on public.ghost_actions
  for select to authenticated
  using (
    case kind
      when 'whisper' then public.is_me(from_player_id) or public.is_me(to_player_id)
      when 'haunt' then public.is_game_member(game_id)
      else false
    end
  );

-- 해설: 참가자이고 reveal 단계 이후
create policy "참가자, reveal 이후" on public.reveals
  for select to authenticated
  using (
    public.is_game_member(game_id)
    and exists (
      select 1 from public.games g
      where g.id = reveals.game_id
        and g.phase in ('reveal', 'ended')
    )
  );

create policy "본인 완료 기록" on public.completions
  for select to authenticated
  using (user_id = auth.uid());

-- events: 정책 없음. 서버만

-- 쓰기 권한 회수 -----------------------------------------------------------------
-- Supabase 는 public 표에 anon, authenticated 쓰기 권한을 기본으로 준다.
-- 쓰기는 서버(service role)만 하므로 RLS 와 별도로 권한도 회수해 두 겹으로 막는다.
-- TRUNCATE 는 RLS 가 적용되지 않아서 권한으로만 막을 수 있다.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon, authenticated;
-- 다음 마이그레이션에서 만드는 표에도 같은 기본값을 적용한다
alter default privileges in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from anon, authenticated;

-- players: 같은 방 참가자는 닉네임, seat, left_at 만 (data §3)
-- RLS 는 줄만 거르므로 칸은 열 단위 권한으로 제한한다. user_id, is_guest, joined_at 은 서버만.
-- id, room_id 는 투표 대상 지정과 방 단위 조회에 필요해서 같이 연다.
-- 클라이언트는 select("*") 대신 칸 이름을 적어서 읽는다.
revoke select on public.players from anon, authenticated;
grant select (id, room_id, nickname, seat, left_at) on public.players to authenticated;

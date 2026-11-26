-- 007_rejoined_at: 게임 중 나갔다 돌아온 시각을 남긴다 (D-022, #63)
-- 투표한 뒤 나갔다가 판정 전에 돌아온 사람은 표를 바꿀 수 있다. 서버는 "표를 낸 시각 < 돌아온 시각" 으로 이것을 안다.
-- left_at 을 지우는 곳은 join_room 하나뿐이라, join_room 을 다시 정의해 그 자리에서 rejoined_at 도 쓴다.
-- 본문은 004 와 같고, rejoined 경우의 update 한 줄만 다르다.
alter table public.players add column rejoined_at timestamptz;

-- p_nickname 이 null 이면 들어갈 수 있는지만 본다 (넣지 않음).
-- 돌려주는 result:
--   member        이미 참가자 (그대로 그 방으로)
--   rejoined      게임 중 나갔다 다시 옴 (left_at 지우고 rejoined_at 남김)
--   need_nickname 들어갈 수 있음, 닉네임이 필요 (p_nickname null)
--   joined        새로 들어감
--   not_found     없는 방 (끝난 방 포함)
--   started       이미 시작한 방
--   full          꽉 참 (6명)
-- 오류 문구(S-02)는 부르는 쪽(core.ts MSG)이 정한다.
create or replace function public.join_room(
  p_code text,
  p_user_id uuid,
  p_is_guest boolean,
  p_nickname text
)
returns table (result text, room_id uuid, room_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_me public.players%rowtype;
  v_count int;
  v_seat int;
  v_name text;
  v_i int;
begin
  select * into v_room
  from public.rooms r
  where r.code = p_code and r.status <> 'ended'
  for update;
  if not found then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  -- 내가 이미 들어간 방: 오류 없이 그 방으로 (S-02, NFR-002). 게임 중 나갔다 오면 이어서 (spec §6)
  select * into v_me
  from public.players p
  where p.room_id = v_room.id and p.user_id = p_user_id;
  if found then
    if v_me.left_at is not null then
      update public.players set left_at = null, rejoined_at = now() where id = v_me.id;
      return query select 'rejoined'::text, v_room.id, v_room.code;
    else
      return query select 'member'::text, v_room.id, v_room.code;
    end if;
    return;
  end if;

  if v_room.status <> 'lobby' then
    return query select 'started'::text, v_room.id, v_room.code;
    return;
  end if;

  select count(*) into v_count from public.players p where p.room_id = v_room.id;
  if v_count >= 6 then
    return query select 'full'::text, v_room.id, v_room.code;
    return;
  end if;

  if p_nickname is null then
    return query select 'need_nickname'::text, v_room.id, v_room.code;
    return;
  end if;

  -- 비어 있는 가장 작은 seat. 대기실에서 나간 자리를 채운다
  select min(s) into v_seat
  from generate_series(1, 6) s
  where not exists (
    select 1 from public.players p where p.room_id = v_room.id and p.seat = s
  );

  -- 같은 방에 같은 이름이 있으면 "이름2", "이름3" (S-03 `제안`)
  v_name := p_nickname;
  v_i := 2;
  while exists (
    select 1 from public.players p where p.room_id = v_room.id and p.nickname = v_name
  ) loop
    v_name := p_nickname || v_i;
    v_i := v_i + 1;
  end loop;

  insert into public.players (room_id, user_id, is_guest, nickname, seat)
  values (v_room.id, p_user_id, p_is_guest, v_name, v_seat);

  return query select 'joined'::text, v_room.id, v_room.code;
end;
$$;

-- 입장은 서버(Server Action)를 거쳐서만 (SECURITY.md, tally 와 같게)
revoke execute on function public.join_room(text, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.join_room(text, uuid, boolean, text) to service_role;

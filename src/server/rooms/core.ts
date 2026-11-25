// 방 동작 (spec §4): createRoom, joinRoom, leaveRoom, startGame, getRoomState.
// Server Action(src/server/actions/)이 세션과 실제 DB를 넣어 부른다. 테스트는 가짜 저장소를 넣는다.
// 입력은 여기서 zod 로 다시 검사하고, 누가 부르는지는 세션의 userId 로만 판단한다 (SECURITY.md §3).
import type { RoomSignal } from "@/lib/realtime";
import { nicknameSchema, roomCodeSchema, roomIdSchema } from "@/lib/schemas";
import type { Scenario } from "@/lib/scenario/schema";
import { chooseAssignment, type AssignModel } from "../assign-ai";
import { UniqueViolation, type PlayerRow, type RoomRow, type RoomStore } from "./store";

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 6;
// intro 길이 3분 `제안` (spec §1.1). 단계 표는 단계 6 phase.ts 로 옮긴다
const INTRO_MS = 3 * 60 * 1000;

// 안내 문구. 입장 오류는 spec S-02 표 그대로 (AC-011)
export const MSG = {
  notFound: "없는 방이에요",
  full: `방이 꽉 찼어요 (${MAX_PLAYERS}명)`,
  started: "이미 시작한 방이에요",
  notMember: "이 방 참가자가 아니에요",
  notHost: "방장만 시작할 수 있어요",
  tooFew: `${MIN_PLAYERS}명부터 시작해요`,
  retry: "잠시 뒤 다시 시도해 주세요",
} as const;

export type Deps = {
  store: RoomStore;
  user: { id: string; isGuest: boolean };
  broadcast: (roomId: string, signal: RoomSignal) => Promise<void>;
  scenario: Scenario;
  random: () => number;
  now: () => Date;
  /** AI 배정 모델. 없으면(OQ-003 미정, 키 없음) 규칙 배정 */
  assignModel: AssignModel | null;
  /** AI 배정 제한 시간. 기본 15초 (NFR-003) */
  assignTimeoutMs?: number;
};

export type Fail = { error: string };
export type Result<T> = ({ ok: true } & T) | Fail;

const fail = (error: string): Fail => ({ error });

// createRoom ------------------------------------------------------------------

export async function createRoom(
  deps: Deps,
  input: { nickname: string },
): Promise<Result<{ code: string; roomId: string }>> {
  const nickname = nicknameSchema.safeParse(input.nickname);
  if (!nickname.success) return fail(nickname.error.issues[0].message);
  const { store, user } = deps;

  // 진행 중 방 코드와 겹치면 다시 뽑는다 (spec §4)
  let room: RoomRow | null = null;
  for (let i = 0; i < 10 && !room; i++) {
    try {
      room = await store.insertRoom(randomCode(deps.random));
    } catch (e) {
      if (!(e instanceof UniqueViolation && e.target === "code")) throw e;
    }
  }
  if (!room) return fail(MSG.retry);

  const player = await store.insertPlayer({
    roomId: room.id,
    userId: user.id,
    isGuest: user.isGuest,
    nickname: nickname.data,
    seat: 1,
  });
  await store.setHost(room.id, player.id);
  await store.logEvent("room_created", { roomId: room.id, guest: user.isGuest });
  return { ok: true, code: room.code, roomId: room.id };
}

// joinRoom --------------------------------------------------------------------

/**
 * nickname 없이 부르면 들어갈 수 있는지만 본다: 이미 참가자면 그대로 입장,
 * 들어갈 수 있으면 needNickname 을 돌려줘서 화면이 S-03 으로 간다.
 */
export async function joinRoom(
  deps: Deps,
  input: { code: string; nickname?: string },
): Promise<Result<{ code: string; roomId: string; needNickname?: true }>> {
  const code = roomCodeSchema.safeParse(input.code);
  if (!code.success) return fail(code.error.issues[0].message);
  const { store, user } = deps;

  const room = await store.findActiveRoomByCode(code.data);
  if (!room) return fail(MSG.notFound);

  const players = await store.listPlayers(room.id);
  const me = players.find((p) => p.userId === user.id);
  // 내가 이미 들어간 방: 오류 없이 그 방으로 (S-02, NFR-002). 게임 중 나갔다 오면 이어서 (spec §6)
  if (me) {
    if (me.leftAt) {
      await store.setPlayerLeftAt(me.id, null);
      await deps.broadcast(room.id, { type: "players" });
    }
    return { ok: true, code: room.code, roomId: room.id };
  }

  if (room.status !== "lobby") return fail(MSG.started);
  if (players.length >= MAX_PLAYERS) return fail(MSG.full);
  if (input.nickname === undefined) {
    return { ok: true, code: room.code, roomId: room.id, needNickname: true };
  }

  const nickname = nicknameSchema.safeParse(input.nickname);
  if (!nickname.success) return fail(nickname.error.issues[0].message);

  // 동시에 들어오면 seat 가 겹칠 수 있다. 제약에 걸리면 목록을 다시 읽고 다시 시도
  let current = players;
  for (let i = 0; i < MAX_PLAYERS + 1; i++) {
    const seat = freeSeat(current);
    if (seat === null) return fail(MSG.full);
    try {
      await store.insertPlayer({
        roomId: room.id,
        userId: user.id,
        isGuest: user.isGuest,
        nickname: uniqueNickname(nickname.data, current),
        seat,
      });
      await store.logEvent("room_joined", { roomId: room.id, guest: user.isGuest });
      await deps.broadcast(room.id, { type: "players" });
      return { ok: true, code: room.code, roomId: room.id };
    } catch (e) {
      if (!(e instanceof UniqueViolation)) throw e;
      // 같은 사람이 두 번 눌렀다: 이미 들어갔다
      if (e.target === "user") return { ok: true, code: room.code, roomId: room.id };
      current = await store.listPlayers(room.id);
      const fresh = await store.getRoom(room.id);
      if (!fresh || fresh.status !== "lobby") return fail(MSG.started);
    }
  }
  return fail(MSG.retry);
}

// leaveRoom -------------------------------------------------------------------

export async function leaveRoom(deps: Deps, input: { roomId: string }): Promise<Result<object>> {
  const roomId = roomIdSchema.safeParse(input.roomId);
  if (!roomId.success) return fail(MSG.notFound);
  const { store, user } = deps;

  const room = await store.getRoom(roomId.data);
  if (!room || room.status === "ended") return fail(MSG.notFound);
  const players = await store.listPlayers(room.id);
  const me = players.find((p) => p.userId === user.id);
  if (!me) return fail(MSG.notMember);
  // 플레이어를 지우면 DB가 host_player_id 를 null 로 바꾸므로 먼저 기억해 둔다
  const wasHost = room.hostPlayerId === me.id;

  if (room.status === "lobby") {
    // 대기실: 플레이어 삭제 (spec §4, S-05)
    await store.deletePlayer(me.id);
  } else {
    // 게임 중: left_at 기록. 단계는 계속된다 (BR-011)
    // TODO(단계 10): 범인이 나가면 판 종료 → 해설 (OQ-006, spec §9 임시 결정)
    if (me.leftAt) return { ok: true };
    await store.setPlayerLeftAt(me.id, deps.now().toISOString());
  }

  const remaining = players.filter((p) => p.id !== me.id && !p.leftAt);
  if (room.status === "lobby" && remaining.length === 0) {
    // 아무도 없으면 방을 닫아 코드를 풀어 준다
    await store.updateRoomStatus(room.id, "lobby", "ended");
  } else if (wasHost) {
    // 방장이 나가면 seat 다음 사람이 방장 (BR-012)
    await store.setHost(room.id, nextHost(me.seat, remaining)?.id ?? null);
  }

  await store.logEvent("player_left", { roomId: room.id, status: room.status });
  await deps.broadcast(room.id, { type: "players" });
  return { ok: true };
}

// startGame -------------------------------------------------------------------

export async function startGame(
  deps: Deps,
  input: { roomId: string },
): Promise<Result<{ gameId: string }>> {
  const roomId = roomIdSchema.safeParse(input.roomId);
  if (!roomId.success) return fail(MSG.notFound);
  const { store, user } = deps;

  const room = await store.getRoom(roomId.data);
  if (!room || room.status === "ended") return fail(MSG.notFound);
  const players = await store.listPlayers(room.id);
  const me = players.find((p) => p.userId === user.id);
  if (!me) return fail(MSG.notMember);
  if (room.hostPlayerId !== me.id) return fail(MSG.notHost);
  if (room.status !== "lobby") return fail(MSG.started);
  // 4~6명 (AC-012)
  if (players.length < MIN_PLAYERS) return fail(MSG.tooFew);
  if (players.length > MAX_PLAYERS) return fail(MSG.full);

  // lobby → playing 을 먼저 바꿔 두 번 눌러도 한 번만 시작한다
  if (!(await store.updateRoomStatus(room.id, "lobby", "playing"))) return fail(MSG.started);

  try {
    // 배정 (spec §5): AI 1번 → 검사 실패면 1번 더 → 실패 또는 15초 초과면 규칙 배정 (NFR-003)
    const { assignment, source } = await chooseAssignment({
      scenario: deps.scenario,
      players: players.map((p) => ({ id: p.id, seat: p.seat })),
      model: deps.assignModel,
      random: deps.random,
      timeoutMs: deps.assignTimeoutMs,
    });
    // 타이머는 배정이 끝난 뒤부터 (AI 가 오래 걸려도 intro 3분을 다 쓴다)
    const endsAt = new Date(deps.now().getTime() + INTRO_MS).toISOString();
    const game = await store.createGame({
      roomId: room.id,
      playerCount: players.length,
      phase: "intro",
      phaseEndsAt: endsAt,
      assignmentSource: source,
      ...assignment,
    });
    await store.logEvent("game_started", {
      roomId: room.id,
      gameId: game.id,
      players: players.length,
      assignmentSource: source,
    });
    // 신호에는 단계만. 범인, 배정은 넣지 않는다 (data §5)
    await deps.broadcast(room.id, { type: "phase", phase: game.phase, endsAt: game.phaseEndsAt });
    return { ok: true, gameId: game.id };
  } catch (e) {
    // 판을 못 만들었으면 대기실로 되돌려 다시 시작할 수 있게
    await store.updateRoomStatus(room.id, "playing", "lobby");
    throw e;
  }
}

// getRoomState (공용 읽기) ---------------------------------------------------------

export type RoomState = {
  roomId: string;
  code: string;
  status: RoomRow["status"];
  me: { playerId: string; isHost: boolean };
  players: { id: string; nickname: string; seat: number; isHost: boolean; left: boolean }[];
  game: { id: string; phase: string; phaseEndsAt: string | null } | null;
};

/**
 * 공용 정보만 돌려준다: 방, 참가자 닉네임과 seat, 단계. user_id, 배정, 범인은 넣지 않는다 (spec §4, AC-030).
 * 화면 주소가 방 코드라 코드로 찾는다 (진행 중 방끼리 코드는 겹치지 않는다).
 */
export async function getRoomState(
  deps: Deps,
  input: { code: string },
): Promise<Result<{ state: RoomState }>> {
  const code = roomCodeSchema.safeParse(input.code);
  if (!code.success) return fail(MSG.notFound);
  const { store, user } = deps;

  const room = await store.findActiveRoomByCode(code.data);
  if (!room) return fail(MSG.notFound);
  const players = await store.listPlayers(room.id);
  const me = players.find((p) => p.userId === user.id);
  if (!me) return fail(MSG.notMember);

  const game = room.status === "lobby" ? null : await store.latestGame(room.id);
  return {
    ok: true,
    state: {
      roomId: room.id,
      code: room.code,
      status: room.status,
      me: { playerId: me.id, isHost: room.hostPlayerId === me.id },
      players: players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        seat: p.seat,
        isHost: room.hostPlayerId === p.id,
        left: p.leftAt !== null,
      })),
      game,
    },
  };
}

// 도우미 ------------------------------------------------------------------------

export function randomCode(random: () => number): string {
  return String(Math.floor(random() * 1_000_000)).padStart(6, "0");
}

/** 비어 있는 가장 작은 seat. 대기실에서 나간 자리를 채운다 */
export function freeSeat(players: Pick<PlayerRow, "seat">[]): number | null {
  const taken = new Set(players.map((p) => p.seat));
  for (let s = 1; s <= MAX_PLAYERS; s++) if (!taken.has(s)) return s;
  return null;
}

/** 같은 방에 같은 이름이 있으면 "이름2", "이름3" (S-03 `제안`) */
export function uniqueNickname(name: string, players: Pick<PlayerRow, "nickname">[]): string {
  const taken = new Set(players.map((p) => p.nickname));
  if (!taken.has(name)) return name;
  for (let i = 2; ; i++) if (!taken.has(`${name}${i}`)) return `${name}${i}`;
}

/** 나간 방장의 seat 다음 사람. 뒤에 없으면 맨 앞 사람 (BR-012) */
export function nextHost<T extends Pick<PlayerRow, "seat">>(
  leavingSeat: number,
  remaining: T[],
): T | null {
  const sorted = [...remaining].sort((a, b) => a.seat - b.seat);
  return sorted.find((p) => p.seat > leavingSeat) ?? sorted[0] ?? null;
}

// 방 동작 (spec §4): createRoom, joinRoom, leaveRoom, startGame, getRoomState.
// Server Action(src/server/actions/)이 세션과 실제 DB를 넣어 부른다. 테스트는 가짜 저장소를 넣는다.
// 입력은 여기서 zod 로 다시 검사하고, 누가 부르는지는 세션의 userId 로만 판단한다 (SECURITY.md §3).
import type { RoomSignal } from "@/lib/realtime";
import { nicknameSchema, roomCodeSchema, roomIdSchema } from "@/lib/schemas";
import type { Scenario } from "@/lib/scenario/schema";
import { chooseAssignment, type AssignModel } from "../assign-ai";
import {
  UniqueViolation,
  type GameRow,
  type PlayerRow,
  type RoomRow,
  type RoomStore,
} from "./store";

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
  hostOnly: "방장만 할 수 있어요",
  notReveal: "해설 화면에서 할 수 있어요",
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

  // 닉네임이 틀려도 먼저 들어갈 수 있는지부터 본다 (없는 방, 시작, 꽉 참 안내가 먼저)
  const nickname = input.nickname === undefined ? null : nicknameSchema.safeParse(input.nickname);
  // 방 잠금, lobby 확인, 이미 참가자, 빈 자리, 닉네임 숫자 붙이기, 넣기를 DB 함수가 한 번에 (#36)
  const r = await store.joinRoom({
    code: code.data,
    userId: user.id,
    isGuest: user.isGuest,
    nickname: nickname?.success ? nickname.data : null,
  });
  switch (r.result) {
    case "not_found":
      return fail(MSG.notFound);
    case "started":
      return fail(MSG.started);
    case "full":
      return fail(MSG.full);
    case "member":
      return { ok: true, code: r.code, roomId: r.roomId };
    case "rejoined":
      // 게임 중 나갔다 오면 이어서 (spec §6)
      await deps.broadcast(r.roomId, { type: "players" });
      return { ok: true, code: r.code, roomId: r.roomId };
    case "need_nickname":
      if (nickname && !nickname.success) return fail(nickname.error.issues[0].message);
      return { ok: true, code: r.code, roomId: r.roomId, needNickname: true };
    case "joined":
      await store.logEvent("room_joined", { roomId: r.roomId, guest: user.isGuest });
      await deps.broadcast(r.roomId, { type: "players" });
      return { ok: true, code: r.code, roomId: r.roomId };
  }
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

  let phase: string | null = null;
  if (room.status === "lobby") {
    // 대기실: 플레이어 삭제 (spec §4, S-05)
    await store.deletePlayer(me.id);
  } else {
    // 게임 중: left_at 기록. 범인이 아니면 단계는 계속된다 (BR-011)
    if (me.leftAt) return { ok: true };
    await store.setPlayerLeftAt(me.id, deps.now().toISOString());
    phase = (await culpritLeft(deps, room.id, me.id)) ?? null;
  }

  const remaining = players.filter((p) => p.id !== me.id && !p.leftAt);
  if (room.status === "lobby" && remaining.length === 0) {
    // 아무도 없으면 방을 닫아 코드를 풀어 준다
    await store.updateRoomStatus(room.id, "lobby", "ended");
  } else if (wasHost) {
    // 방장이 나가면 seat 다음 사람이 방장 (BR-012)
    await store.setHost(room.id, nextHost(me.seat, remaining)?.id ?? null);
  }

  // 단계는 나간 순간의 판 단계. 대기실이면 null (spec §7 player_left(단계))
  await store.logEvent("player_left", { roomId: room.id, status: room.status, phase });
  await deps.broadcast(room.id, { type: "players" });
  return { ok: true };
}

const BEFORE_DEDUCTION = new Set(["intro", "secret"]);
const DEDUCTION = new Set(["r1", "r2", "r3", "vote", "revote"]);

/**
 * 게임 중 나간 사람이 이번 판 범인이면 판을 끝낸다 (D-025, spec §1.1, §6). 나간 순간의 단계를 돌려준다.
 * - intro, secret: 판 취소(ended, cancelled), 방은 lobby. 4명 이상이면 방장이 다시 시작한다
 * - r1~revote: 바로 reveal(aired_off, culprit_left). 해설은 첫 getReveal 이 만든다 (readReveal)
 * reveal 이후(해설의 "홈으로" 포함)는 판이 이미 끝나 아무것도 하지 않는다.
 * 다시 들어와도 되돌리지 않는다: join_room 은 left_at 만 지운다
 */
async function culpritLeft(deps: Deps, roomId: string, playerId: string) {
  const { store } = deps;
  // 단계를 넘기는 advance 와 겹치면 조건부 update 가 실패한다. 다시 읽고 바뀐 단계로 한 번 더
  for (let i = 0; i < 3; i++) {
    const game = await store.latestGame(roomId);
    if (!game) return null;
    if (!BEFORE_DEDUCTION.has(game.phase) && !DEDUCTION.has(game.phase)) return game.phase;
    if ((await store.getCulpritPlayerId(game.id)) !== playerId) return game.phase;
    const cancel = BEFORE_DEDUCTION.has(game.phase);
    const changed = cancel
      ? await store.updateGamePhase(game.id, game.phase, "ended", { endedReason: "cancelled" })
      : await store.updateGamePhase(game.id, game.phase, "reveal", {
          outcome: "aired_off",
          endedReason: "culprit_left",
        });
    if (!changed) continue;
    if (cancel) await store.updateRoomStatus(roomId, "playing", "lobby");
    await deps.broadcast(roomId, {
      type: "phase",
      phase: cancel ? "ended" : "reveal",
      endsAt: null,
    });
    return game.phase;
  }
  return null;
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
  // 판 취소(D-025)로 돌아온 대기실에서 나간 사람은 인원과 배정에서 뺀다 (#72 `제안`)
  const lobbyPlayers = (await store.listPlayers(room.id)).filter((p) => !p.leftAt);
  const me = lobbyPlayers.find((p) => p.userId === user.id);
  if (!me) return fail(MSG.notMember);
  if (room.hostPlayerId !== me.id) return fail(MSG.notHost);
  if (room.status !== "lobby") return fail(MSG.started);
  // 4~6명 (AC-012). 화면 안내를 빨리 주려고 먼저 한 번 보고, 확정은 상태를 바꾼 뒤 다시 본다
  if (lobbyPlayers.length < MIN_PLAYERS) return fail(MSG.tooFew);
  if (lobbyPlayers.length > MAX_PLAYERS) return fail(MSG.full);

  // lobby → playing 을 먼저 바꿔 두 번 눌러도 한 번만 시작한다.
  // 이 update 가 방 줄을 잠그므로 join_room 과 차례로 실행된다 (#36)
  if (!(await store.updateRoomStatus(room.id, "lobby", "playing"))) return fail(MSG.started);
  // 바꾼 뒤의 참가자로 인원 확인과 배정을 한다. 그 사이 들어온 사람도 배정을 받는다 (#36)
  const players = (await store.listPlayers(room.id)).filter((p) => !p.leftAt);
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    await store.updateRoomStatus(room.id, "playing", "lobby");
    return fail(players.length < MIN_PLAYERS ? MSG.tooFew : MSG.full);
  }

  try {
    return await beginGame(deps, room.id, players, null);
  } catch (e) {
    // 판을 못 만들었으면 대기실로 되돌려 다시 시작할 수 있게
    await store.updateRoomStatus(room.id, "playing", "lobby");
    throw e;
  }
}

// 배정하고 판을 intro 로 만든다. startGame, replay 가 같이 쓴다
async function beginGame(
  deps: Deps,
  roomId: string,
  players: PlayerRow[],
  previousCulprit: string | null,
): Promise<Result<{ gameId: string }>> {
  const { store } = deps;
  // 배정 (spec §5): AI 1번 → 검사 실패면 1번 더 → 실패 또는 15초 초과면 규칙 배정 (NFR-003)
  const { assignment, source } = await chooseAssignment({
    scenario: deps.scenario,
    players: players.map((p) => ({ id: p.id, seat: p.seat })),
    model: deps.assignModel,
    random: deps.random,
    timeoutMs: deps.assignTimeoutMs,
    previousCulprit,
  });
  // 타이머는 배정이 끝난 뒤부터 (AI 가 오래 걸려도 intro 3분을 다 쓴다)
  const endsAt = new Date(deps.now().getTime() + INTRO_MS).toISOString();
  const game = await store.createGame({
    roomId,
    playerCount: players.length,
    phase: "intro",
    phaseEndsAt: endsAt,
    assignmentSource: source,
    ...assignment,
  });
  await store.logEvent("game_started", {
    roomId,
    gameId: game.id,
    players: players.length,
    assignmentSource: source,
  });
  // 신호에는 단계만. 범인, 배정은 넣지 않는다 (data §5)
  await deps.broadcast(roomId, { type: "phase", phase: game.phase, endsAt: game.phaseEndsAt });
  return { ok: true, gameId: game.id };
}

// replay, endRoom (S-12 카드 10) -----------------------------------------------------

/** 방장 확인과 해설 중인 판. 다시 하기, endRoom 이 같이 쓴다 */
async function hostAtReveal(deps: Deps, input: { roomId: string }) {
  const roomId = roomIdSchema.safeParse(input.roomId);
  if (!roomId.success) return fail(MSG.notFound);
  const room = await deps.store.getRoom(roomId.data);
  if (!room || room.status !== "playing") return fail(MSG.notFound);
  const players = await deps.store.listPlayers(room.id);
  const me = players.find((p) => p.userId === deps.user.id && !p.leftAt);
  if (!me) return fail(MSG.notMember);
  if (room.hostPlayerId !== me.id) return fail(MSG.hostOnly);
  const game = await deps.store.latestGame(room.id);
  if (!game || game.phase !== "reveal") return fail(MSG.notReveal);
  return { room, players, game };
}

/**
 * spec §4 replay: 방장만, reveal 에서. 같은 방, 새 판, 새 배정 (FR-070).
 * 들어갈 사람은 누른 순간 접속한 사람 (D-023, PRD 5판). 4명 미만이면 막는다 (AC-070-2).
 * 지난 판 범인은 배정 입력으로 넘겨 연속으로 고르지 않는다 (spec §5-2 `제안`).
 * FR-090 완료 기록은 하지 않는다 (D-018)
 */
export async function replay(
  deps: Deps,
  input: { roomId: string },
): Promise<Result<{ gameId: string }>> {
  const found = await hostAtReveal(deps, input);
  if ("error" in found) return found;
  const { room, players, game } = found;
  const staying = players.filter((p) => !p.leftAt);
  if (staying.length < MIN_PLAYERS) return fail(MSG.tooFew);

  const previousCulprit = await deps.store.getCulpritCharacter(game.id);
  // reveal → ended 를 먼저 바꿔 두 번 눌러도 새 판은 하나만
  if (!(await deps.store.updateGamePhase(game.id, "reveal", "ended"))) return fail(MSG.notReveal);
  // 나간 사람은 방에 남겨 두고(지난 판 기록 보관, D-019) 새 판 배정만 받지 않는다.
  // 그 판의 참가자는 assignments 로 센다 (assignedPlayerIds)

  try {
    const r = await beginGame(deps, room.id, staying, previousCulprit);
    await deps.store.logEvent("replay", {
      roomId: room.id,
      gameId: game.id,
      players: staying.length,
    });
    return r;
  } catch (e) {
    // 새 판을 못 만들었으면 해설로 되돌려 다시 누를 수 있게
    await deps.store.updateGamePhase(game.id, "ended", "reveal");
    throw e;
  }
}

/**
 * spec §4 endRoom: 방장의 "홈으로" (S-12 10번, 4판). 방장만, reveal 에서. 판을 ended, 방을 ended 로.
 * 다른 폰은 phase 신호를 받고 "방송이 끝났어요" 를 본다. 참가자의 "홈으로" 는 leaveRoom (판에 영향 없음).
 * spec §7 에 기록 이벤트가 없어 기록하지 않는다
 */
export async function endRoom(deps: Deps, input: { roomId: string }): Promise<Result<object>> {
  const found = await hostAtReveal(deps, input);
  if ("error" in found) return found;
  const { room, game } = found;
  if (!(await deps.store.updateGamePhase(game.id, "reveal", "ended"))) return fail(MSG.notReveal);
  await deps.store.updateRoomStatus(room.id, "playing", "ended");
  await deps.broadcast(room.id, { type: "phase", phase: "ended", endsAt: null });
  return { ok: true };
}

// getRoomState (공용 읽기) ---------------------------------------------------------

export type RoomState = {
  roomId: string;
  code: string;
  status: RoomRow["status"];
  me: { playerId: string; isHost: boolean };
  players: { id: string; nickname: string; seat: number; isHost: boolean; left: boolean }[];
  game: GameState | null;
};

/** 판의 공용 정보 (spec §4 getRoomState, PRD §13 공용 화면). 비밀, 개인 단서는 넣지 않는다 */
export type GameState = {
  id: string;
  phase: string;
  phaseEndsAt: string | null;
  /** 내가 이 판에 배정을 받았는지. 다시 하기 전에 나갔다 돌아온 사람은 false: 이 판이 끝날 때까지 기다린다 */
  inGame: boolean;
  /** 라운드(r1~r3)일 때만: 라운드 번호, 장소, 시점 (data §4 rounds) */
  round: { n: 1 | 2 | 3; place: string; time: string } | null;
  /** 이 단계에서 다음/확인/준비를 누른 인원 수와 남아 있는 인원 수, 내가 눌렀는지 */
  ready: { count: number; total: number; mine: boolean };
  /** 지금까지 공용으로 열린 단서 (FR-041). 열린 순서 */
  publicClues: { id: string; round: number; text: string }[];
  /**
   * r2 부터: 유령이 된 희생자 (FR-050). 속보 "○○, 거실에서 갑자기 쓰러져 의식 없음" (D-029) 에 인물 이름을 쓰고,
   * 투표(단계 9)에서 고르는 사람과 대상에서 뺄 때 playerId 를 쓴다 (AC-053). r2 전에는 null
   */
  ghost: { playerId: string; name: string } | null;
  /** 출몰 (FR-053). 판에 1번, 모든 참가자에게 보이는 유령의 말. 아직 안 썼으면 null */
  haunt: { id: string; body: string } | null;
  /** vote, revote 일 때만 (spec S-11). 공용에는 완료 인원만, 누가 누구를 찍었는지는 없다 (AC-060) */
  vote: VoteState | null;
};

export type VoteState = {
  /** 투표한 수 / 투표할 사람 수 (살아 있고 나가지 않은 사람, BR-011) */
  count: number;
  total: number;
  /** 내가 투표할 수 있는지 (유령은 못 함, AC-053), 이미 했는지 */
  canVote: boolean;
  voted: boolean;
  /**
   * 투표한 뒤 나갔다가 판정 전에 돌아와 표를 바꿀 수 있으면 내가 고른 player id (D-022).
   * 내 응답에만 싣는다. 바꿀 수 없으면 null
   */
  myChangeableTarget: string | null;
  /** 고를 수 있는 player id. revote 는 동점자만 (AC-060-2) */
  candidates: string[];
};

export function roundNumber(phase: string): 1 | 2 | 3 | null {
  return phase === "r1" ? 1 : phase === "r2" ? 2 : phase === "r3" ? 3 : null;
}

/**
 * 공용 정보만 돌려준다: 방, 참가자 닉네임과 seat, 단계. user_id, 배정, 범인은 넣지 않는다 (spec §4, AC-030).
 * 화면 주소가 방 코드라 코드로 찾는다 (진행 중 방끼리 코드는 겹치지 않는다).
 * serverNow: 폰이 "서버 시각 - 내 시각" 으로 남은 시간을 보정한다 (#21, 시간 기준은 서버).
 */
export async function getRoomState(
  deps: Deps,
  input: { code: string },
): Promise<Result<{ state: RoomState; serverNow: string }>> {
  const code = roomCodeSchema.safeParse(input.code);
  if (!code.success) return fail(MSG.notFound);
  const { store, user } = deps;

  const room = await store.findActiveRoomByCode(code.data);
  if (!room) return fail(MSG.notFound);
  const players = await store.listPlayers(room.id);
  const me = players.find((p) => p.userId === user.id);
  if (!me) return fail(MSG.notMember);

  const row = room.status === "lobby" ? null : await store.latestGame(room.id);
  const game = row ? await gameState(deps, row, me.id, players) : null;
  return {
    ok: true,
    state: {
      roomId: room.id,
      code: room.code,
      status: room.status,
      me: { playerId: me.id, isHost: room.hostPlayerId === me.id },
      // 대기실에는 판 취소 전에 나간 사람을 보여 주지 않는다 (#72 `제안`)
      players: players
        .filter((p) => room.status !== "lobby" || !p.leftAt)
        .map((p) => ({
          id: p.id,
          nickname: p.nickname,
          seat: p.seat,
          isHost: room.hostPlayerId === p.id,
          left: p.leftAt !== null,
        })),
      game,
    },
    serverNow: deps.now().toISOString(),
  };
}

async function gameState(
  deps: Deps,
  game: GameRow,
  myPlayerId: string,
  players: PlayerRow[],
): Promise<GameState> {
  const [revealed, readyIds, ghost, actions, assigned] = await Promise.all([
    deps.store.listRevealedClues(game.id),
    deps.store.listReadyPlayerIds(game.id, game.phase),
    deps.store.getGhost(game.id),
    deps.store.listGhostActions(game.id),
    deps.store.listAssignedPlayerIds(game.id),
  ]);
  // 이 판의 참가자 = 이 판에 배정이 있는 사람. 다시 하기 전에 나간 사람이 돌아와도 이 판에는 없다 (D-023)
  const inGame = players.filter((p) => assigned.includes(p.id));
  const readyMembers = new Set(
    inGame.filter((p) => !p.leftAt && p.id !== ghost?.playerId).map((p) => p.id),
  );
  // 속삭임은 공용에 넣지 않는다. 출몰만 (data §3 ghost_actions)
  const haunt = actions.find((a) => a.kind === "haunt");
  const ghostName = ghost
    ? deps.scenario.characters.find((c) => c.id === ghost.characterId)?.name
    : undefined;
  const vote =
    game.phase === "vote" || game.phase === "revote"
      ? await voteState(deps, game.id, game.phase, myPlayerId, inGame, ghost?.playerId ?? null)
      : null;
  const n = roundNumber(game.phase);
  const r = n ? deps.scenario.rounds.find((x) => x.round === n) : undefined;
  const clueText = new Map(deps.scenario.clues.map((c) => [c.id, c]));
  return {
    id: game.id,
    phase: game.phase,
    phaseEndsAt: game.phaseEndsAt,
    round: n && r ? { n, place: r.place, time: r.time } : null,
    inGame: assigned.includes(myPlayerId),
    // 인원은 game-phase.ts readyCounts 와 같은 기준: 이 판의 나가지 않은 산 사람만 (#53)
    ready: {
      count: readyIds.filter((id) => readyMembers.has(id)).length,
      total: readyMembers.size,
      mine: readyIds.includes(myPlayerId),
    },
    // 공용 단서만. revealed_clues 에는 공용 단서만 들어가지만, 한 번 더 걸러 개인 단서가 새지 않게 한다
    publicClues: revealed.flatMap(({ clueId, round }) => {
      const c = clueText.get(clueId);
      return c && c.visibility === "public" ? [{ id: c.id, round, text: c.text }] : [];
    }),
    ghost: ghost && ghostName ? { playerId: ghost.playerId, name: ghostName } : null,
    haunt: haunt ? { id: haunt.id, body: haunt.body } : null,
    vote,
  };
}

// 기준은 game-phase.ts voteCounts, game-vote.ts voteCandidates 와 같다
async function voteState(
  deps: Deps,
  gameId: string,
  phase: "vote" | "revote",
  myPlayerId: string,
  players: PlayerRow[],
  ghostId: string | null,
): Promise<VoteState> {
  const round = phase === "vote" ? 1 : 2;
  const [info, myChangeableTarget] = await Promise.all([
    deps.store.getVoteInfo(gameId, round),
    deps.store.getChangeableVote(gameId, round, myPlayerId),
  ]);
  // 유령은 GameState.ghost 와 같은 출처(store.getGhost) (AC-053)
  const ghosts = new Set(ghostId ? [ghostId] : []);
  const voters = new Set(players.filter((p) => !p.leftAt && !ghosts.has(p.id)).map((p) => p.id));
  const voted = new Set(info.votedPlayerIds);
  // vote 후보: 유령이 아닌 참가자 전부, 나간 사람 포함 (D-021). seat 순
  const candidates =
    phase === "revote"
      ? info.revoteCandidates
      : [...players]
          .sort((a, b) => a.seat - b.seat)
          .filter((p) => !ghosts.has(p.id))
          .map((p) => p.id);
  return {
    count: [...voted].filter((id) => voters.has(id)).length,
    total: voters.size,
    canVote: voters.has(myPlayerId),
    voted: voted.has(myPlayerId),
    myChangeableTarget,
    candidates,
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

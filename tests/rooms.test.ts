import { beforeEach, describe, expect, it } from "vitest";
import liveDeath from "../scenarios/live-death.json";
import type { RoomSignal } from "@/lib/realtime";
import { scenarioSchema } from "@/lib/scenario/schema";
import { assignByRule } from "@/server/assign";
import {
  createRoom,
  endRoom,
  getRoomState,
  joinRoom,
  leaveRoom,
  MSG,
  nextHost,
  replay,
  startGame,
  uniqueNickname,
  type Deps,
} from "@/server/rooms/core";
import { memoryStore, type MemoryStore } from "./fakes/memory-store";

const scenario = scenarioSchema.parse(liveDeath);
const ROOM_ID = "00000000-0000-4000-8000-000000000000"; // uuid 형식 검사용

let store: MemoryStore;
let signals: { roomId: string; signal: RoomSignal }[];
let seed: number;

beforeEach(() => {
  store = memoryStore();
  signals = [];
  seed = 0;
});

// 폰 한 대 = 세션 사용자 한 명
function phone(userId: string, opts: { random?: () => number } = {}): Deps {
  return {
    store,
    user: { id: userId, isGuest: true },
    broadcast: async (roomId, signal) => {
      signals.push({ roomId, signal });
    },
    scenario,
    random: opts.random ?? (() => (seed = (seed * 9301 + 49297) % 233280) / 233280),
    now: () => new Date("2026-11-25T12:00:00Z"),
    assignModel: null,
  };
}

async function roomWith(count: number) {
  const host = await createRoom(phone("u1"), { nickname: "방장" });
  if (!("ok" in host)) throw new Error(host.error);
  for (let i = 2; i <= count; i++) {
    const r = await joinRoom(phone(`u${i}`), { code: host.code, nickname: `p${i}` });
    if (!("ok" in r)) throw new Error(r.error);
  }
  return host;
}

describe("createRoom", () => {
  it("숫자 6자리 코드로 방을 만들고 나를 seat 1 방장으로", async () => {
    const r = await createRoom(phone("u1"), { nickname: "  현경  " });
    expect(r).toMatchObject({ ok: true });
    if (!("ok" in r)) return;
    expect(r.code).toMatch(/^[0-9]{6}$/);
    const [p] = store.players;
    expect(p).toMatchObject({ nickname: "현경", seat: 1, userId: "u1", isGuest: true });
    expect(store.rooms[0].hostPlayerId).toBe(p.id);
  });

  it("진행 중 방과 코드가 겹치면 다시 뽑는다", async () => {
    const values = [0.123456, 0.123456, 0.654321];
    const next = () => values.shift() ?? 0.5;
    await createRoom(phone("u1", { random: next }), { nickname: "a" });
    const r = await createRoom(phone("u2", { random: next }), { nickname: "b" });
    expect(r).toMatchObject({ ok: true, code: "654321" });
  });

  it("끝난 방의 코드는 다시 쓸 수 있다", async () => {
    await createRoom(phone("u1", { random: () => 0.111111 }), { nickname: "a" });
    store.rooms[0].status = "ended";
    const r = await createRoom(phone("u2", { random: () => 0.111111 }), { nickname: "b" });
    expect(r).toMatchObject({ ok: true, code: "111111" });
  });

  it("닉네임 1~10자 (FR-003)", async () => {
    expect(await createRoom(phone("u1"), { nickname: "   " })).toEqual({
      error: "닉네임을 입력해 주세요",
    });
    expect(await createRoom(phone("u1"), { nickname: "12345678901" })).toEqual({
      error: "닉네임은 10자까지예요",
    });
    expect(await createRoom(phone("u1"), { nickname: "1234567890" })).toMatchObject({ ok: true });
  });
});

describe("joinRoom", () => {
  it("AC-003: 로그인 없이 코드와 닉네임만으로 들어간다", async () => {
    const host = await roomWith(1);
    const check = await joinRoom(phone("guest"), { code: host.code });
    expect(check).toMatchObject({ ok: true, needNickname: true });
    const r = await joinRoom(phone("guest"), { code: host.code, nickname: "손님" });
    expect(r).toMatchObject({ ok: true, roomId: host.roomId });
    expect(r).not.toHaveProperty("needNickname");
    expect(store.players.map((p) => p.seat)).toEqual([1, 2]);
    expect(signals.at(-1)).toEqual({ roomId: host.roomId, signal: { type: "players" } });
  });

  it("AC-011: 입장 오류 문구는 spec S-02 표 그대로", async () => {
    expect(await joinRoom(phone("x"), { code: "000000" })).toEqual({ error: "없는 방이에요" });

    const full = await roomWith(6);
    expect(await joinRoom(phone("x"), { code: full.code, nickname: "7번" })).toEqual({
      error: "방이 꽉 찼어요 (6명)",
    });

    store.rooms[0].status = "playing";
    expect(await joinRoom(phone("y"), { code: full.code })).toEqual({
      error: "이미 시작한 방이에요",
    });
  });

  it("끝난 방 코드는 없는 방", async () => {
    const host = await roomWith(1);
    store.rooms[0].status = "ended";
    expect(await joinRoom(phone("x"), { code: host.code })).toEqual({ error: MSG.notFound });
  });

  it("이미 들어간 방이면 오류 없이 그 방으로 (꽉 찼거나 시작했어도)", async () => {
    const host = await roomWith(6);
    store.rooms[0].status = "playing";
    const r = await joinRoom(phone("u3"), { code: host.code });
    expect(r).toEqual({ ok: true, code: host.code, roomId: host.roomId });
    expect(store.players).toHaveLength(6);
  });

  it("게임 중 나갔다가 다시 오면 left_at 을 지운다 (spec §6)", async () => {
    const host = await roomWith(4);
    store.rooms[0].status = "playing";
    store.players[2].leftAt = "2026-11-25T12:00:00Z";
    await joinRoom(phone("u3"), { code: host.code });
    expect(store.players[2].leftAt).toBeNull();
  });

  it("같은 방에 같은 닉네임이면 숫자를 붙인다", async () => {
    const host = await roomWith(1);
    await joinRoom(phone("a"), { code: host.code, nickname: "방장" });
    await joinRoom(phone("b"), { code: host.code, nickname: "방장" });
    expect(store.players.map((p) => p.nickname)).toEqual(["방장", "방장2", "방장3"]);
  });

  it("대기실에서 나간 자리를 다음 사람이 채운다", async () => {
    const host = await roomWith(3);
    await leaveRoom(phone("u2"), { roomId: host.roomId });
    await joinRoom(phone("new"), { code: host.code, nickname: "새" });
    expect(store.players.find((p) => p.userId === "new")!.seat).toBe(2);
  });

  it("코드 형식이 틀리면 한 줄 안내", async () => {
    expect(await joinRoom(phone("x"), { code: "12ab" })).toEqual({
      error: "방 코드는 숫자 6자리예요",
    });
  });
});

describe("leaveRoom", () => {
  it("대기실에서 나가면 플레이어를 지운다", async () => {
    const host = await roomWith(3);
    expect(await leaveRoom(phone("u3"), { roomId: host.roomId })).toEqual({ ok: true });
    expect(store.players.map((p) => p.userId)).toEqual(["u1", "u2"]);
    expect(signals.at(-1)?.signal).toEqual({ type: "players" });
  });

  it("BR-012: 방장이 나가면 seat 다음 사람이 방장", async () => {
    const host = await roomWith(3);
    await leaveRoom(phone("u1"), { roomId: host.roomId });
    const u2 = store.players.find((p) => p.userId === "u2")!;
    expect(store.rooms[0].hostPlayerId).toBe(u2.id);
  });

  it("BR-012: 뒤에 사람이 없으면 맨 앞 사람", () => {
    expect(nextHost(5, [{ seat: 2 }, { seat: 3 }])).toEqual({ seat: 2 });
    expect(nextHost(2, [{ seat: 5 }, { seat: 3 }])).toEqual({ seat: 3 });
    expect(nextHost(1, [])).toBeNull();
  });

  it("마지막 사람이 나가면 방을 닫아 코드를 풀어 준다", async () => {
    const host = await roomWith(1);
    await leaveRoom(phone("u1"), { roomId: host.roomId });
    expect(store.rooms[0].status).toBe("ended");
  });

  it("게임 중에는 지우지 않고 left_at 만 (BR-011), 방장이면 넘긴다", async () => {
    const host = await roomWith(4);
    store.rooms[0].status = "playing";
    await leaveRoom(phone("u1"), { roomId: host.roomId });
    expect(store.players).toHaveLength(4);
    expect(store.players[0].leftAt).toBe("2026-11-25T12:00:00.000Z");
    expect(store.rooms[0].hostPlayerId).toBe(store.players[1].id);
  });

  it("참가자가 아니면 거절", async () => {
    const host = await roomWith(2);
    expect(await leaveRoom(phone("stranger"), { roomId: host.roomId })).toEqual({
      error: MSG.notMember,
    });
  });

  it("방 id 형식이 틀리면 없는 방", async () => {
    expect(await leaveRoom(phone("u1"), { roomId: "nope" })).toEqual({ error: MSG.notFound });
    expect(await leaveRoom(phone("u1"), { roomId: ROOM_ID })).toEqual({ error: MSG.notFound });
  });
});

describe("startGame", () => {
  it("AC-012: 3명이면 시작할 수 없다", async () => {
    const host = await roomWith(3);
    expect(await startGame(phone("u1"), { roomId: host.roomId })).toEqual({
      error: "4명부터 시작해요",
    });
    expect(store.rooms[0].status).toBe("lobby");
    expect(store.games).toHaveLength(0);
  });

  it("방장만 시작한다", async () => {
    const host = await roomWith(4);
    expect(await startGame(phone("u2"), { roomId: host.roomId })).toEqual({ error: MSG.notHost });
  });

  it.each([4, 5, 6])("%i명: 판을 만들고 phase=intro, 규칙 배정", async (count) => {
    const host = await roomWith(count);
    const r = await startGame(phone("u1"), { roomId: host.roomId });
    expect(r).toMatchObject({ ok: true });
    expect(store.rooms[0].status).toBe("playing");

    const [{ game }] = store.games;
    expect(game).toMatchObject({ playerCount: count, phase: "intro", assignmentSource: "rule" });
    expect(game.phaseEndsAt).toBe("2026-11-25T12:03:00.000Z");
    // 모두 서로 다른 인물, 범인 1명
    expect(new Set(game.assignments.map((a) => a.characterId)).size).toBe(count);
    expect(game.assignments.filter((a) => a.isCulprit)).toHaveLength(1);
    // 범인 ≠ 희생자 (BR-004)
    expect(game.secret.victimPlayerId).not.toBe(game.secret.culpritPlayerId);

    // 신호에 단계만, 범인 정보 없음 (data §5)
    const signal = signals.at(-1)!.signal;
    expect(signal).toEqual({ type: "phase", phase: "intro", endsAt: "2026-11-25T12:03:00.000Z" });
  });

  it("D-030: 4명 판 범인은 핵심 인물 4명 중 누구든 (판마다 바뀐다)", async () => {
    const core = ["fav", "villain", "athlete", "writer"];
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      store = memoryStore();
      seed = i;
      const host = await roomWith(4);
      await startGame(phone("u1"), { roomId: host.roomId });
      const culprit = store.games[0].game.secret.culpritCharacter;
      expect(core).toContain(culprit);
      seen.add(culprit);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("두 번 눌러도 한 번만 시작", async () => {
    const host = await roomWith(4);
    await startGame(phone("u1"), { roomId: host.roomId });
    expect(await startGame(phone("u1"), { roomId: host.roomId })).toEqual({ error: MSG.started });
    expect(store.games).toHaveLength(1);
  });

  it("판을 못 만들면 대기실로 되돌린다", async () => {
    const host = await roomWith(4);
    store.createGame = async () => {
      throw new Error("db down");
    };
    await expect(startGame(phone("u1"), { roomId: host.roomId })).rejects.toThrow("db down");
    expect(store.rooms[0].status).toBe("lobby");
  });

  it("AI 배정이 맞으면 assignment_source=ai, 응답과 신호에 범인 없음 (spec §5)", async () => {
    const host = await roomWith(4);
    const seats = store.players.map((p) => ({ id: p.id, seat: p.seat }));
    const plan = assignByRule(scenario, seats, () => 0.3);
    const deps = {
      ...phone("u1"),
      assignModel: { name: "fake", complete: async () => JSON.stringify(plan) },
    };
    const r = await startGame(deps, { roomId: host.roomId });
    expect(store.games[0].game.assignmentSource).toBe("ai");
    expect(store.games[0].game.secret.culpritCharacter).toBe(plan.culprit);
    const out = JSON.stringify([r, signals.at(-1)]);
    expect(out).not.toContain(plan.culprit);
    expect(out).not.toContain(store.games[0].game.secret.culpritPlayerId);
  });
});

describe("getRoomState", () => {
  it("참가자에게 공용 정보만 (user_id, 배정 없음)", async () => {
    const host = await roomWith(4);
    await startGame(phone("u1"), { roomId: host.roomId });
    const r = await getRoomState(phone("u2"), { code: host.code });
    if (!("ok" in r)) throw new Error(r.error);
    expect(r.state.me.isHost).toBe(false);
    expect(r.state.players[0]).toEqual({
      id: store.players[0].id,
      nickname: "방장",
      seat: 1,
      isHost: true,
      left: false,
    });
    expect(r.state.game?.phase).toBe("intro");
    expect(r.serverNow).toBe("2026-11-25T12:00:00.000Z");
    const json = JSON.stringify(r);
    expect(json).not.toContain("u1");
    expect(json).not.toContain("culprit");
  });

  it("참가자가 아니면 거절", async () => {
    const host = await roomWith(2);
    expect(await getRoomState(phone("x"), { code: host.code })).toEqual({ error: MSG.notMember });
  });
});

describe("uniqueNickname", () => {
  it("이름, 이름2, 이름3 순서", () => {
    expect(uniqueNickname("a", [])).toBe("a");
    expect(uniqueNickname("a", [{ nickname: "a" }, { nickname: "a2" }])).toBe("a3");
  });
});

describe("replay", () => {
  async function atReveal(count: number) {
    const host = await roomWith(count);
    const r = await startGame(phone("u1"), { roomId: host.roomId });
    if (!("ok" in r)) throw new Error(r.error);
    store.games.at(-1)!.phase = "reveal";
    return host;
  }

  it("누른 순간 접속한 사람으로 새 판. 나간 사람은 돌아와도 이 판 인원에 안 섞인다 (D-023)", async () => {
    const host = await atReveal(5);
    await leaveRoom(phone("u5"), { roomId: host.roomId });
    const r = await replay(phone("u1"), { roomId: host.roomId });
    expect(r).toMatchObject({ ok: true });
    expect(store.games.map((g) => g.phase)).toEqual(["ended", "intro"]);
    expect(store.games[1].game.assignments).toHaveLength(4);

    // 다시 들어오면 방에는 있지만 이 판 배정은 없다
    await joinRoom(phone("u5"), { code: host.code });
    const back = await getRoomState(phone("u5"), { code: host.code });
    if (!("ok" in back)) throw new Error(back.error);
    expect(back.state.game).toMatchObject({ inGame: false, ready: { total: 4 } });
  });

  it("두 번 눌러도 새 판은 하나, 방장이 아니면 막힌다", async () => {
    const host = await atReveal(4);
    expect(await replay(phone("u2"), { roomId: host.roomId })).toEqual({ error: MSG.hostOnly });
    expect(await endRoom(phone("u2"), { roomId: host.roomId })).toEqual({ error: MSG.hostOnly });
    const [a, b] = await Promise.all([
      replay(phone("u1"), { roomId: host.roomId }),
      replay(phone("u1"), { roomId: host.roomId }),
    ]);
    expect([a, b].filter((r) => "ok" in r)).toHaveLength(1);
    expect(store.games).toHaveLength(2);
  });

  it("방장의 홈으로(endRoom)는 판과 방을 끝내고, 두 번 눌러도 한 번만", async () => {
    const host = await atReveal(4);
    expect(await endRoom(phone("u1"), { roomId: host.roomId })).toEqual({ ok: true });
    expect(await endRoom(phone("u1"), { roomId: host.roomId })).toHaveProperty("error");
    expect(store.games[0].phase).toBe("ended");
    expect(store.rooms[0].status).toBe("ended");
  });

  it("접속한 사람이 4명 미만이면 막는다 (AC-070-2)", async () => {
    const host = await atReveal(4);
    await leaveRoom(phone("u4"), { roomId: host.roomId });
    expect(await replay(phone("u1"), { roomId: host.roomId })).toEqual({ error: MSG.tooFew });
    expect(store.games).toHaveLength(1);
  });
});

describe("범인 이탈 (D-025)", () => {
  async function gameAt(count: number, phase: string) {
    const host = await roomWith(count);
    const r = await startGame(phone("u1"), { roomId: host.roomId });
    if (!("ok" in r)) throw new Error(r.error);
    const game = store.games.at(-1)!;
    game.phase = phase;
    const culprit = store.players.find((p) => p.id === game.game.secret.culpritPlayerId)!;
    return { host, game, culprit: phone(culprit.userId) };
  }

  it.each(["intro", "secret"])(
    "%s 에서 나가면 판 취소, 방은 대기실, 나간 사람 빼고 다시 시작",
    async (phase) => {
      const { host, game, culprit } = await gameAt(5, phase);
      expect(await leaveRoom(culprit, { roomId: host.roomId })).toEqual({ ok: true });
      expect(game).toMatchObject({ phase: "ended", end: { endedReason: "cancelled" } });
      expect(store.rooms[0].status).toBe("lobby");
      expect(store.events.at(-1)).toMatchObject({ name: "player_left", props: { phase } });

      const lobby = await getRoomState(phone("u1"), { code: host.code });
      if (!("ok" in lobby)) throw new Error(lobby.error);
      expect(lobby.state.players).toHaveLength(4);
      const host1 = store.players.find((p) => p.id === store.rooms[0].hostPlayerId)!;
      expect(await startGame(phone(host1.userId), { roomId: host.roomId })).toMatchObject({
        ok: true,
      });
      expect(store.games[1].game.assignments).toHaveLength(4);
    },
  );

  it.each(["r1", "r2", "vote", "revote"])("%s 에서 나가면 바로 해설, 방송 중단", async (phase) => {
    const { host, game, culprit } = await gameAt(4, phase);
    await leaveRoom(culprit, { roomId: host.roomId });
    expect(game).toMatchObject({
      phase: "reveal",
      end: { outcome: "aired_off", endedReason: "culprit_left" },
    });
    expect(signals.at(-2)?.signal).toEqual({ type: "phase", phase: "reveal", endsAt: null });
  });

  it("다시 들어와도 취소나 해설을 되돌리지 않는다", async () => {
    const a = await gameAt(4, "r2");
    await leaveRoom(a.culprit, { roomId: a.host.roomId });
    await joinRoom(a.culprit, { code: a.host.code });
    expect(a.game.phase).toBe("reveal");

    store = memoryStore();
    const b = await gameAt(4, "intro");
    await leaveRoom(b.culprit, { roomId: b.host.roomId });
    expect(await joinRoom(b.culprit, { code: b.host.code })).toMatchObject({ ok: true });
    expect(b.game.phase).toBe("ended");
    expect(store.rooms[0].status).toBe("lobby");
    // 대기실에 다시 합류한다 (#72 `제안`)
    const lobby = await getRoomState(phone("u1"), { code: b.host.code });
    if (!("ok" in lobby)) throw new Error(lobby.error);
    expect(lobby.state.players).toHaveLength(4);
  });

  it("해설에서 범인이 홈으로를 눌러도 판은 그대로", async () => {
    const { host, game, culprit } = await gameAt(4, "reveal");
    await leaveRoom(culprit, { roomId: host.roomId });
    expect(game.phase).toBe("reveal");
    expect(game.end).toBeUndefined();
  });
});

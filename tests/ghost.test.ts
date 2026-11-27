// 단계 8: 유령 (spec S-10, FR-050~053, AC-051, AC-053, OQ-005). 가짜 저장소로 서버 규칙을 본다.
// RLS(속삭임은 당사자만)는 tests/db/rls.test.ts, 라운드당 속삭임 DB 제약은 tests/db/ghost.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import liveDeath from "../scenarios/live-death.json";
import type { RoomSignal } from "@/lib/realtime";
import { scenarioSchema } from "@/lib/scenario/schema";
import { GHOST_MSG, haunt, whisper } from "@/server/ghost";
import { getMine } from "@/server/reads";
import { createRoom, getRoomState, joinRoom, MSG, startGame, type Deps } from "@/server/rooms/core";
import { memoryStore, type MemoryStore } from "./fakes/memory-store";

const scenario = scenarioSchema.parse(liveDeath);

let store: MemoryStore;
let seed: number;
let signals: RoomSignal[];

beforeEach(() => {
  store = memoryStore();
  seed = 0;
  signals = [];
});

function phone(userId: string): Deps {
  return {
    store,
    user: { id: userId, isGuest: true },
    broadcast: async (_roomId, s) => {
      signals.push(s);
    },
    scenario,
    random: () => (seed = (seed * 9301 + 49297) % 233280) / 233280,
    now: () => new Date("2026-11-26T12:00:00Z"),
    assignModel: null,
  };
}

/** 판을 시작하고 phase 로 옮긴다. r2 이상이면 희생자를 유령으로 (game-phase.ts advance 가 하는 일) */
async function gameAt(count: number, phase: string) {
  const host = await createRoom(phone("u1"), { nickname: "방장" });
  if (!("ok" in host)) throw new Error(host.error);
  for (let i = 2; i <= count; i++) {
    const r = await joinRoom(phone(`u${i}`), { code: host.code, nickname: `p${i}` });
    if (!("ok" in r)) throw new Error(r.error);
  }
  const started = await startGame(phone("u1"), { roomId: host.roomId });
  if (!("ok" in started)) throw new Error(started.error);
  const game = store.games.find((g) => g.id === started.gameId)!;
  game.phase = phase;
  const victim = game.game.secret.victimPlayerId;
  if (["r2", "r3"].includes(phase)) store.ghosts.push({ gameId: game.id, playerId: victim });
  const userOf = (playerId: string) => store.players.find((p) => p.id === playerId)!.userId;
  const alive = game.game.assignments.map((a) => a.playerId).filter((id) => id !== victim);
  return {
    code: host.code,
    gameId: game.id,
    game,
    ghostUser: userOf(victim),
    ghostPlayer: victim,
    alive,
    userOf,
  };
}

const traitText = (id: string) => scenario.traits.find((t) => t.id === id)!.text;

describe("유령이 되기 (FR-050, AC-050)", () => {
  it("r1 에는 유령이 없다", async () => {
    const g = await gameAt(4, "r1");
    const r = await getRoomState(phone("u1"), { code: g.code });
    if (!("ok" in r)) throw new Error(r.error);
    expect(r.state.game?.ghost).toBeNull();
  });

  it("r2 부터 공용 상태에 유령(희생자)과 속보에 쓸 인물 이름이 있다", async () => {
    const g = await gameAt(5, "r2");
    const victim = g.game.game.assignments.find((a) => a.playerId === g.ghostPlayer)!;
    const name = scenario.characters.find((c) => c.id === victim.characterId)!.name;
    for (const user of ["u1", "u2", g.ghostUser]) {
      const r = await getRoomState(phone(user), { code: g.code });
      if (!("ok" in r)) throw new Error(r.error);
      expect(r.state.game?.ghost).toEqual({ playerId: g.ghostPlayer, name });
    }
  });

  it("유령 본인 getMine 에만 범인의 특징이 있다", async () => {
    const g = await gameAt(4, "r2");
    const ghost = await getMine(phone(g.ghostUser), { gameId: g.gameId });
    if (!("ok" in ghost)) throw new Error(ghost.error);
    expect(ghost.mine.ghost).toEqual({
      trait: traitText(g.game.game.secret.ghostTrait),
      whisperedThisRound: false,
    });
    const other = await getMine(phone(g.userOf(g.alive[0])), { gameId: g.gameId });
    expect(other).toMatchObject({ ok: true, mine: { ghost: null } });
  });

  it("공용 상태와 유령 응답에 범인 인물 id 와 이름이 없다 (AC-030)", async () => {
    for (let s = 0; s < 10; s++) {
      store = memoryStore();
      seed = s * 7919;
      const g = await gameAt(4 + (s % 3), "r2");
      const culprit = g.game.game.secret.culpritCharacter;
      const culpritName = scenario.characters.find((c) => c.id === culprit)!.name;
      const state = await getRoomState(phone("u1"), { code: g.code });
      const ghost = await getMine(phone(g.ghostUser), { gameId: g.gameId });
      const text = JSON.stringify(state) + JSON.stringify(ghost);
      expect(text).not.toContain(`"${culprit}"`);
      expect(text).not.toContain(culpritName);
    }
  });

  it("유령이 보는 특징은 그 판 인물 2명 이상에게 해당한다 (AC-051)", async () => {
    for (let count = 4; count <= 6; count++) {
      for (let s = 0; s < 30; s++) {
        store = memoryStore();
        seed = s * 104729 + count;
        const g = await gameAt(count, "r2");
        const trait = scenario.traits.find((t) => t.id === g.game.game.secret.ghostTrait)!;
        const present = new Set(g.game.game.assignments.map((a) => a.characterId));
        expect(trait.characters.filter((c) => present.has(c)).length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("whisper (FR-052, OQ-005)", () => {
  it("유령이 살아 있는 사람에게 보내면 받은 사람 getMine 에만 보인다", async () => {
    const g = await gameAt(5, "r2");
    const [to, other] = g.alive;
    const r = await whisper(phone(g.ghostUser), {
      gameId: g.gameId,
      toPlayerId: to,
      body: "  모자를 봐  ",
    });
    expect(r).toEqual({ ok: true });

    const got = await getMine(phone(g.userOf(to)), { gameId: g.gameId });
    expect(got).toMatchObject({ ok: true, mine: { whispers: [{ round: 2, body: "모자를 봐" }] } });
    const notMine = await getMine(phone(g.userOf(other)), { gameId: g.gameId });
    expect(notMine).toMatchObject({ ok: true, mine: { whispers: [] } });
    // 공용 상태에는 속삭임 글이 없다
    const state = await getRoomState(phone(g.userOf(other)), { code: g.code });
    expect(JSON.stringify(state)).not.toContain("모자를 봐");
    // 다른 폰에 알리는 신호를 보내지 않는다
    expect(signals.some((s) => JSON.stringify(s).includes("모자"))).toBe(false);
  });

  it("라운드당 1번: 같은 라운드 두 번째는 막고, 다음 라운드에는 다시 된다", async () => {
    const g = await gameAt(4, "r2");
    const send = () =>
      whisper(phone(g.ghostUser), { gameId: g.gameId, toPlayerId: g.alive[0], body: "하나" });
    expect(await send()).toEqual({ ok: true });
    expect(await send()).toEqual({ error: GHOST_MSG.whisperUsed });
    const mine = await getMine(phone(g.ghostUser), { gameId: g.gameId });
    expect(mine).toMatchObject({ ok: true, mine: { ghost: { whisperedThisRound: true } } });

    g.game.phase = "r3";
    expect(await send()).toEqual({ ok: true });
  });

  it("유령이 아니면, r2 전이면, 투표 단계면 막는다", async () => {
    const g = await gameAt(4, "r2");
    const notGhost = await whisper(phone(g.userOf(g.alive[0])), {
      gameId: g.gameId,
      toPlayerId: g.alive[1],
      body: "안녕",
    });
    expect(notGhost).toEqual({ error: GHOST_MSG.notGhost });

    g.game.phase = "vote";
    const late = await whisper(phone(g.ghostUser), {
      gameId: g.gameId,
      toPlayerId: g.alive[0],
      body: "안녕",
    });
    expect(late).toEqual({ error: GHOST_MSG.notNow });

    const early = await gameAt(4, "r1");
    const r = await whisper(phone(early.ghostUser), {
      gameId: early.gameId,
      toPlayerId: early.alive[0],
      body: "안녕",
    });
    expect(r).toEqual({ error: GHOST_MSG.notGhost });
  });

  it("대상: 나 자신, 나간 사람, 없는 사람에게는 못 보낸다", async () => {
    const g = await gameAt(5, "r2");
    const send = (toPlayerId: string) =>
      whisper(phone(g.ghostUser), { gameId: g.gameId, toPlayerId, body: "안녕" });
    expect(await send(g.ghostPlayer)).toEqual({ error: GHOST_MSG.target });
    expect(await send("00000000-0000-4000-8000-999999999999")).toEqual({
      error: GHOST_MSG.target,
    });
    store.players.find((p) => p.id === g.alive[0])!.leftAt = "2026-11-26T12:00:00Z";
    expect(await send(g.alive[0])).toEqual({ error: GHOST_MSG.target });
    expect(store.ghostActions).toHaveLength(0);
  });

  it("글은 1~80자, 판 밖 사람은 막는다", async () => {
    const g = await gameAt(4, "r2");
    const send = (body: string, user = g.ghostUser) =>
      whisper(phone(user), { gameId: g.gameId, toPlayerId: g.alive[0], body });
    expect(await send("   ")).toEqual({ error: "한 글자 이상 써 주세요" });
    expect(await send("가".repeat(81))).toEqual({ error: "80자까지 쓸 수 있어요" });
    expect(await send("안녕", "stranger")).toEqual({ error: MSG.notMember });
    expect(await send("가".repeat(80))).toEqual({ ok: true });
  });

  it("기록에 글 내용과 받은 사람을 넣지 않는다", async () => {
    const g = await gameAt(4, "r2");
    await whisper(phone(g.ghostUser), { gameId: g.gameId, toPlayerId: g.alive[0], body: "비밀" });
    const e = store.events.find((x) => x.name === "ghost_whisper")!;
    expect(JSON.stringify(e)).not.toContain("비밀");
    expect(JSON.stringify(e)).not.toContain(g.alive[0]);
  });
});

describe("haunt (FR-053, AC-053)", () => {
  it("유령의 말이 모든 참가자의 공용 상태에 보이고 haunt 신호를 보낸다", async () => {
    const g = await gameAt(4, "r3");
    expect(await haunt(phone(g.ghostUser), { gameId: g.gameId, body: "나는 봤어" })).toEqual({
      ok: true,
    });
    for (const id of g.alive) {
      const r = await getRoomState(phone(g.userOf(id)), { code: g.code });
      if (!("ok" in r)) throw new Error(r.error);
      expect(r.state.game?.haunt?.body).toBe("나는 봤어");
    }
    expect(signals).toContainEqual({ type: "haunt", body: "나는 봤어" });
  });

  it("판에 1번: 다른 라운드여도 두 번째는 막는다", async () => {
    const g = await gameAt(4, "r2");
    expect(await haunt(phone(g.ghostUser), { gameId: g.gameId, body: "하나" })).toEqual({
      ok: true,
    });
    g.game.phase = "r3";
    expect(await haunt(phone(g.ghostUser), { gameId: g.gameId, body: "둘" })).toEqual({
      error: GHOST_MSG.hauntUsed,
    });
  });

  it("유령이 아니면 막는다", async () => {
    const g = await gameAt(4, "r2");
    expect(await haunt(phone(g.userOf(g.alive[0])), { gameId: g.gameId, body: "나" })).toEqual({
      error: GHOST_MSG.notGhost,
    });
    expect(store.ghostActions).toHaveLength(0);
  });
});

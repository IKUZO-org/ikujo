// 단계 7: getMine(개인)과 getRoomState 의 판 공용 정보. AC-030 "남의 비밀 0건"
import { beforeEach, describe, expect, it } from "vitest";
import liveDeath from "../scenarios/live-death.json";
import { scenarioSchema } from "@/lib/scenario/schema";
import { getMine } from "@/server/reads";
import { createRoom, getRoomState, joinRoom, MSG, startGame, type Deps } from "@/server/rooms/core";
import { memoryStore, type MemoryStore } from "./fakes/memory-store";

const scenario = scenarioSchema.parse(liveDeath);

let store: MemoryStore;
let seed: number;

beforeEach(() => {
  store = memoryStore();
  seed = 0;
});

function phone(userId: string): Deps {
  return {
    store,
    user: { id: userId, isGuest: true },
    broadcast: async () => {},
    scenario,
    random: () => (seed = (seed * 9301 + 49297) % 233280) / 233280,
    now: () => new Date("2026-11-26T12:00:00Z"),
    assignModel: null,
  };
}

async function startedGame(count: number) {
  const host = await createRoom(phone("u1"), { nickname: "방장" });
  if (!("ok" in host)) throw new Error(host.error);
  for (let i = 2; i <= count; i++) {
    const r = await joinRoom(phone(`u${i}`), { code: host.code, nickname: `p${i}` });
    if (!("ok" in r)) throw new Error(r.error);
  }
  const started = await startGame(phone("u1"), { roomId: host.roomId });
  if (!("ok" in started)) throw new Error(started.error);
  const game = store.games.find((g) => g.id === started.gameId)!;
  const userOf = (playerId: string) => store.players.find((p) => p.id === playerId)!.userId;
  const culprit = game.game.assignments.find((a) => a.isCulprit)!;
  const innocent = game.game.assignments.find((a) => !a.isCulprit)!;
  return {
    code: host.code,
    gameId: started.gameId,
    game,
    culpritUser: userOf(culprit.playerId),
    culpritCharacter: culprit.characterId,
    innocentUser: userOf(innocent.playerId),
    innocent,
  };
}

function setPhase(gameId: string, phase: string) {
  store.games.find((g) => g.id === gameId)!.phase = phase;
}

const culpritName = (id: string) => scenario.characters.find((c) => c.id === id)!.name;

describe("getMine", () => {
  it("내 인물, 비밀, 알리바이를 시나리오 글로 돌려준다", async () => {
    const g = await startedGame(4);
    const r = await getMine(phone(g.innocentUser), { gameId: g.gameId });
    if (!("ok" in r)) throw new Error(r.error);
    const c = scenario.characters.find((x) => x.id === g.innocent.characterId)!;
    expect(r.mine.character).toEqual({ id: c.id, name: c.name, intro: c.intro });
    expect(r.mine.secret).toBe(scenario.secrets.find((s) => s.id === g.innocent.secretId)!.text);
    expect(r.mine.alibi).toBe(scenario.alibis.find((s) => s.id === g.innocent.alibiId)!.text);
  });

  it("범인 폰에만 isCulprit = true (AC-030)", async () => {
    const g = await startedGame(5);
    const culprit = await getMine(phone(g.culpritUser), { gameId: g.gameId });
    const innocent = await getMine(phone(g.innocentUser), { gameId: g.gameId });
    expect(culprit).toMatchObject({ ok: true, mine: { isCulprit: true } });
    expect(innocent).toMatchObject({ ok: true, mine: { isCulprit: false } });
  });

  it("범인이 아닌 폰의 응답에 범인 인물 id 와 이름이 없다 (AC-030, 인물 카드 단계)", async () => {
    const g = await startedGame(6);
    setPhase(g.gameId, "secret");
    for (const a of g.game.game.assignments.filter((x) => !x.isCulprit)) {
      const user = store.players.find((p) => p.id === a.playerId)!.userId;
      const r = await getMine(phone(user), { gameId: g.gameId });
      const json = JSON.stringify(r);
      expect(json).not.toContain(`"${g.culpritCharacter}"`);
      expect(json).not.toContain(culpritName(g.culpritCharacter));
    }
  });

  it("단서는 지금 라운드까지만. 인물 카드 단계에는 없다", async () => {
    const g = await startedGame(4);
    // 시험용으로 라운드마다 단서 하나씩 쥐여 준다 (지금 시나리오는 r3 에 개인 단서가 없어 그 라운드 아무 단서)
    const priv = (n: number) => scenario.clues.find((c) => c.round === n)!.id;
    g.innocent.clueIds = { r1: [priv(1)], r2: [priv(2)], r3: [priv(3)] };
    const mine = async () => {
      const r = await getMine(phone(g.innocentUser), { gameId: g.gameId });
      if (!("ok" in r)) throw new Error(r.error);
      return r.mine.clues.map((c) => c.id);
    };
    setPhase(g.gameId, "secret");
    expect(await mine()).toEqual([]);
    setPhase(g.gameId, "r1");
    expect(await mine()).toEqual([priv(1)]);
    setPhase(g.gameId, "r2");
    expect(await mine()).toEqual([priv(1), priv(2)]);
    setPhase(g.gameId, "vote");
    expect(await mine()).toEqual([priv(1), priv(2), priv(3)]);
  });

  it("참가자가 아니면 거절", async () => {
    const g = await startedGame(4);
    expect(await getMine(phone("stranger"), { gameId: g.gameId })).toEqual({
      error: MSG.notMember,
    });
  });

  it("gameId 가 uuid 가 아니거나 없는 판이면 거절", async () => {
    await startedGame(4);
    expect(await getMine(phone("u1"), { gameId: "nope" })).toEqual({ error: MSG.notFound });
    expect(await getMine(phone("u1"), { gameId: "00000000-0000-4000-8000-999999999999" })).toEqual({
      error: MSG.notFound,
    });
  });
});

describe("getRoomState 판 공용 정보", () => {
  it("라운드 정보, 공용 단서, 준비 인원을 싣는다", async () => {
    const g = await startedGame(4);
    setPhase(g.gameId, "r1");
    const pub = scenario.clues.filter((c) => c.round === 1 && c.visibility === "public");
    for (const c of pub) store.revealed.push({ gameId: g.gameId, clueId: c.id, round: 1 });
    const me = store.players.find((p) => p.userId === "u1")!;
    store.readies.push({ gameId: g.gameId, playerId: me.id, phase: "r1" });

    const r = await getRoomState(phone("u1"), { code: g.code });
    if (!("ok" in r)) throw new Error(r.error);
    expect(r.state.game).toMatchObject({
      phase: "r1",
      round: { n: 1, place: scenario.rounds[0].place, time: scenario.rounds[0].time },
      ready: { count: 1, total: 4, mine: true },
      publicClues: pub.map((c) => ({ id: c.id, round: 1, text: c.text })),
    });
    const other = await getRoomState(phone("u2"), { code: g.code });
    expect(other).toMatchObject({ ok: true, state: { game: { ready: { mine: false } } } });
  });

  it("revealed_clues 에 개인 단서가 잘못 들어가도 공용 응답에는 싣지 않는다", async () => {
    const g = await startedGame(4);
    setPhase(g.gameId, "r1");
    const priv = scenario.clues.find((c) => c.round === 1 && c.visibility === "private")!;
    store.revealed.push({ gameId: g.gameId, clueId: priv.id, round: 1 });
    const r = await getRoomState(phone("u1"), { code: g.code });
    if (!("ok" in r)) throw new Error(r.error);
    expect(r.state.game?.publicClues).toEqual([]);
  });

  it("공용 응답에 배정, 범인이 없다 (AC-030)", async () => {
    const g = await startedGame(6);
    for (const phase of ["intro", "secret", "r1"]) {
      setPhase(g.gameId, phase);
      const r = await getRoomState(phone(g.innocentUser), { code: g.code });
      const json = JSON.stringify(r);
      expect(json).not.toContain(`"${g.culpritCharacter}"`);
      expect(json).not.toContain(culpritName(g.culpritCharacter));
      expect(json).not.toMatch(/culprit|characterId|secretId|clueIds/i);
    }
  });
});

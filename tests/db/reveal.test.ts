// 해설 (spec §4 getReveal, data §3 reveals). 로컬 Supabase 필요
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import liveDeath from "../../scenarios/live-death.json";
import { scenarioSchema } from "@/lib/scenario/schema";
import { voteCounts, type GameRow } from "@/server/game-phase";
import { readReveal } from "@/server/game-reveal";
import { castVote, voteCandidates } from "@/server/game-vote";
import { createRoom, joinRoom, leaveRoom, replay, startGame, type Deps } from "@/server/rooms/core";
import { supabaseRoomStore } from "@/server/rooms/supabase-store";
import { guest, insert, serviceClient } from "./local-supabase";

type Row = Record<string, unknown> & { id: string };

const scenario = scenarioSchema.parse(liveDeath);

let db: SupabaseClient;
let users: { client: SupabaseClient; userId: string }[];
let p: Row[];
let gameId: string;

const CHARACTERS = ["fav", "villain", "athlete", "writer"];

// 4명 판, vote 단계. p[1] 범인(villain), p[3] 희생자(유령). 투표할 사람은 p[0]~p[2]
beforeAll(async () => {
  db = serviceClient();
  users = await Promise.all([guest(), guest(), guest(), guest()]);
  const [room] = await insert<Row>(db, "rooms", {
    code: String(Math.floor(100000 + Math.random() * 900000)),
    status: "playing",
  });
  p = await insert<Row>(
    db,
    "players",
    users.map((u, i) => ({ room_id: room.id, user_id: u.userId, nickname: `p${i}`, seat: i + 1 })),
  );
  p.sort((x, y) => Number(x.seat) - Number(y.seat));
  const [game] = await insert<Row>(db, "games", {
    room_id: room.id,
    player_count: 4,
    phase: "vote",
    phase_started_at: new Date().toISOString(),
    phase_ends_at: new Date(Date.now() + 60_000).toISOString(),
    assignment_source: "rule",
  });
  gameId = game.id;
  await insert(db, "game_secrets", {
    game_id: gameId,
    culprit_player_id: p[1].id,
    victim_player_id: p[3].id,
    culprit_character: "villain",
    ghost_trait: "t-black-cap",
  });
  await insert(
    db,
    "assignments",
    p.map((x, i) => ({
      game_id: gameId,
      player_id: x.id,
      character_id: CHARACTERS[i],
      secret_id: "s",
      alibi_id: "a",
      is_culprit: i === 1,
      is_ghost: i === 3,
    })),
  );
});

describe("getReveal", () => {
  it("reveal 전에는 getReveal 도, reveals 읽기도 0줄이고, reveal 이 되면 열린다 (data §3)", async () => {
    // 둘이 투표한 상태 (아직 vote)
    await castVote(db, users[0].userId, gameId, p[1].id);
    await castVote(db, users[1].userId, gameId, p[2].id);
    expect(await readReveal(db, users[0].userId, gameId)).toHaveProperty("error");
    const before = await users[0].client.from("reveals").select("*").eq("game_id", gameId);
    expect(before.data).toEqual([]);

    // 마지막 표 → 판정 → reveal 진입 때 해설을 만든다
    await castVote(db, users[2].userId, gameId, p[1].id);
    const r = await readReveal(db, users[0].userId, gameId);
    if (!("ok" in r)) throw new Error(r.error);
    expect(r.body.ending.outcome).toBe("caught");
    expect(r.body.solvers.map((w) => w.nickname).sort()).toEqual(["p0", "p2"]);
    expect(r.personal).toBeNull(); // 로컬은 모델 없음 (OQ-003)
    const after = await users[0].client.from("reveals").select("game_id").eq("game_id", gameId);
    expect(after.data).toHaveLength(1);
  });
});

describe("replay", () => {
  it("지난 판 기록은 남고, 나갔다 돌아온 사람은 새 판 인원과 후보에 안 섞인다 (D-019, D-023)", async () => {
    const ids = (await Promise.all([guest(), guest(), guest(), guest(), guest()])).map(
      (u) => u.userId,
    );
    const phone = (userId: string): Deps => ({
      store: supabaseRoomStore(db),
      user: { id: userId, isGuest: true },
      broadcast: async () => {},
      scenario,
      random: Math.random,
      now: () => new Date(),
      assignModel: null,
    });
    const room = await createRoom(phone(ids[0]), { nickname: "방장" });
    if (!("ok" in room)) throw new Error(room.error);
    for (const [i, id] of ids.slice(1).entries()) {
      await joinRoom(phone(id), { code: room.code, nickname: `q${i}` });
    }
    const first = await startGame(phone(ids[0]), { roomId: room.roomId });
    if (!("ok" in first)) throw new Error(first.error);
    await db.from("games").update({ phase: "reveal" }).eq("id", first.gameId);
    await leaveRoom(phone(ids[4]), { roomId: room.roomId });

    const second = await replay(phone(ids[0]), { roomId: room.roomId });
    if (!("ok" in second)) throw new Error(second.error);
    // 지난 판 배정과 비밀은 그대로 (30일 보관, D-019)
    const old = await db.from("assignments").select("player_id").eq("game_id", first.gameId);
    expect(old.data).toHaveLength(5);
    const oldSecret = await db.from("game_secrets").select("game_id").eq("game_id", first.gameId);
    expect(oldSecret.data).toHaveLength(1);

    // 나간 사람이 돌아와도 새 판에서는 빠진다
    await joinRoom(phone(ids[4]), { code: room.code });
    const { data: left } = await db
      .from("players")
      .select("id, left_at")
      .eq("room_id", room.roomId)
      .eq("user_id", ids[4])
      .single<{ id: string; left_at: string | null }>();
    expect(left!.left_at).toBeNull();
    await db.from("games").update({ phase: "vote" }).eq("id", second.gameId);
    const game = (
      await db
        .from("games")
        .select("id, room_id, phase, phase_ends_at, revote_candidates")
        .eq("id", second.gameId)
        .single<GameRow>()
    ).data!;
    expect(await voteCandidates(db, game, "vote")).not.toContain(left!.id);
    expect((await voteCounts(db, game, "vote")).total).toBeLessThanOrEqual(4);
    expect(await castVote(db, ids[4], second.gameId, game.room_id)).toHaveProperty("error");
  });
});

describe("범인 이탈 (D-025, 008)", () => {
  async function gameAt(phase: string) {
    const ids = (await Promise.all([guest(), guest(), guest(), guest()])).map((u) => u.userId);
    const phone = (userId: string): Deps => ({
      store: supabaseRoomStore(db),
      user: { id: userId, isGuest: true },
      broadcast: async () => {},
      scenario,
      random: Math.random,
      now: () => new Date(),
      assignModel: null,
    });
    const room = await createRoom(phone(ids[0]), { nickname: "방장" });
    if (!("ok" in room)) throw new Error(room.error);
    for (const [i, id] of ids.slice(1).entries()) {
      await joinRoom(phone(id), { code: room.code, nickname: `c${i}` });
    }
    const game = await startGame(phone(ids[0]), { roomId: room.roomId });
    if (!("ok" in game)) throw new Error(game.error);
    await db.from("games").update({ phase }).eq("id", game.gameId);
    const { data: secret } = await db
      .from("game_secrets")
      .select("players!game_secrets_culprit_player_id_fkey(user_id)")
      .eq("game_id", game.gameId)
      .single<{ players: { user_id: string } }>();
    const culprit = secret!.players.user_id;
    return { ids, phone, roomId: room.roomId, gameId: game.gameId, culprit };
  }

  it("secret 에서 나가면 cancelled 로 저장되고 방은 lobby, stale 도 저장된다", async () => {
    const g = await gameAt("secret");
    expect(await leaveRoom(g.phone(g.culprit), { roomId: g.roomId })).toEqual({ ok: true });
    const { data } = await db
      .from("games")
      .select("phase, ended_reason, ended_at, rooms(status)")
      .eq("id", g.gameId)
      .single<{
        phase: string;
        ended_reason: string;
        ended_at: string;
        rooms: { status: string };
      }>();
    expect(data).toMatchObject({
      phase: "ended",
      ended_reason: "cancelled",
      rooms: { status: "lobby" },
    });
    expect(data!.ended_at).not.toBeNull();

    const stale = await db.from("games").update({ ended_reason: "stale" }).eq("id", g.gameId);
    expect(stale.error).toBeNull();
  });

  it("투표 중 나가면 표가 있어도 판정 전이라 해설에 카드 3, 9 재료가 없다 (#72 `제안`)", async () => {
    const g = await gameAt("vote");
    const voter = g.ids.find((id) => id !== g.culprit)!;
    const { data: target } = await db
      .from("players")
      .select("id")
      .eq("room_id", g.roomId)
      .eq("user_id", g.culprit)
      .single<{ id: string }>();
    expect(await castVote(db, voter, g.gameId, target!.id)).toHaveProperty("ok");
    await leaveRoom(g.phone(g.culprit), { roomId: g.roomId });

    const r = await readReveal(db, voter, g.gameId);
    if (!("ok" in r)) throw new Error(r.error);
    expect(r.body.ending).toEqual({ outcome: "aired_off", text: "방송 중단", culpritLeft: true });
    expect(r.body.votes).toEqual([]);
    expect(r.body.solvers).toEqual([]);
  });
});

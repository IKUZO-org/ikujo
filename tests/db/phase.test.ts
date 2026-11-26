// advance, ready (spec §1.1, §4). 로컬 Supabase 필요
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import scenario from "../../scenarios/live-death.json";
import { advancePhase, markReady } from "@/server/game-phase";
import { guest, insert, serviceClient } from "./local-supabase";

type Row = Record<string, unknown> & { id: string };

let db: SupabaseClient;
let userIds: string[];
let players: Row[];
let roomId: string;

const past = () => new Date(Date.now() - 1000).toISOString();

async function newGame(phase: string, endsAt: string | null): Promise<string> {
  const [game] = await insert<Row>(db, "games", {
    room_id: roomId,
    player_count: 4,
    phase,
    phase_started_at: new Date().toISOString(),
    phase_ends_at: endsAt,
    assignment_source: "rule",
  });
  // 그 판 참가자는 assignments 로 센다
  await insert(
    db,
    "assignments",
    players.map((x, i) => ({
      game_id: game.id,
      player_id: x.id,
      character_id: ["fav", "villain", "athlete", "writer"][i],
      secret_id: "s",
      alibi_id: "a",
      is_culprit: false,
    })),
  );
  return game.id;
}

beforeAll(async () => {
  db = serviceClient();
  const users = await Promise.all([guest(), guest(), guest(), guest()]);
  userIds = users.map((u) => u.userId);
  const [room] = await insert<Row>(db, "rooms", {
    code: String(Math.floor(100000 + Math.random() * 900000)),
  });
  roomId = room.id;
  players = await insert<Row>(
    db,
    "players",
    users.map((u, i) => ({
      room_id: room.id,
      user_id: u.userId,
      nickname: `p${i + 1}`,
      seat: i + 1,
    })),
  );
  players.sort((x, y) => Number(x.seat) - Number(y.seat));
});

describe("advancePhase", () => {
  it("같은 from 으로 동시에 두 번 불러도 한 번만 넘어간다", async () => {
    const g = await newGame("secret", past());
    const results = await Promise.all([
      advancePhase(db, userIds[0], g, "secret"),
      advancePhase(db, userIds[1], g, "secret"),
    ]);
    const advanced = results.filter((r) => "ok" in r && r.advanced);
    expect(advanced).toHaveLength(1);
    const { data } = await db.from("games").select("phase").eq("id", g).single();
    expect(data?.phase).toBe("r1");
  });

  it("r1 에 들어가면 r1 공용 단서가 revealed_clues 에 들어간다", async () => {
    const g = await newGame("secret", past());
    const r = await advancePhase(db, userIds[0], g, "secret");
    expect(r).toMatchObject({ ok: true, advanced: true, phase: "r1" });
    const { data } = await db.from("revealed_clues").select("clue_id, round").eq("game_id", g);
    const expected = scenario.clues
      .filter((c) => c.round === 1 && c.visibility === "public")
      .map((c) => c.id);
    expect(expected.length).toBeGreaterThan(0);
    expect((data ?? []).map((c) => c.clue_id).sort()).toEqual(expected.sort());
    expect((data ?? []).every((c) => c.round === 1)).toBe(true);
  });

  it("r3 에 들어가면 범인을 가리키는 공용 단서 하나만 생긴다", async () => {
    const g = await newGame("r2", past());
    await insert(db, "game_secrets", {
      game_id: g,
      culprit_player_id: players[0].id,
      victim_player_id: players[1].id,
      culprit_character: "villain",
      ghost_trait: "t",
    });
    const r = await advancePhase(db, userIds[0], g, "r2");
    expect(r).toMatchObject({ ok: true, advanced: true, phase: "r3" });
    expect(JSON.stringify(r)).not.toContain("villain");
    const { data } = await db.from("revealed_clues").select("clue_id").eq("game_id", g);
    expect((data ?? []).map((c) => c.clue_id)).toEqual(["c-r3-02"]);
  });

  it("참가자가 아니면 거절한다", async () => {
    const g = await newGame("secret", past());
    const outsider = await guest();
    expect(await advancePhase(db, outsider.userId, g, "secret")).toHaveProperty("error");
  });
});

describe("markReady", () => {
  it("같은 단계는 한 번만 세고, 모두 누르면 secret 이 시간 전에 넘어간다", async () => {
    const g = await newGame("secret", new Date(Date.now() + 60_000).toISOString());
    expect(await advancePhase(db, userIds[0], g, "secret")).toMatchObject({ advanced: false });
    await markReady(db, userIds[0], g, "secret");
    const again = await markReady(db, userIds[0], g, "secret");
    expect(again).toMatchObject({ ok: true, ready: 1, total: 4 });
    for (const id of userIds.slice(1)) await markReady(db, id, g, "secret");
    const { data } = await db.from("games").select("phase").eq("id", g).single();
    expect(data?.phase).toBe("r1");
  });

  it("intro 에서 모두 ready 하면 시간 전에 secret 으로 넘어간다 (마지막 두 명 동시)", async () => {
    const g = await newGame("intro", new Date(Date.now() + 60_000).toISOString());
    for (const id of userIds.slice(0, 2)) await markReady(db, id, g, "intro");
    await Promise.all(userIds.slice(2).map((id) => markReady(db, id, g, "intro")));
    const { data } = await db.from("games").select("phase").eq("id", g).single();
    expect(data?.phase).toBe("secret");
  });

  it("r1 은 모두 눌러도 시간 전엔 안 넘어간다 (OQ-007)", async () => {
    const g = await newGame("r1", new Date(Date.now() + 60_000).toISOString());
    for (const id of userIds) await markReady(db, id, g, "r1");
    const { data } = await db.from("games").select("phase").eq("id", g).single();
    expect(data?.phase).toBe("r1");
  });

  it("r2 에서 유령은 분모와 누른 수에서 빠진다 (#53)", async () => {
    const g = await newGame("r2", new Date(Date.now() + 60_000).toISOString());
    const ghost = players[3].id;
    await db.from("assignments").update({ is_ghost: true }).eq("game_id", g).eq("player_id", ghost);
    // 유령이 되기 전에 누른 것이 남아 있어도 세지 않는다
    await insert(db, "readies", { game_id: g, player_id: ghost, phase: "r2" });
    let last;
    for (const id of userIds.slice(0, 3)) last = await markReady(db, id, g, "r2");
    expect(last).toMatchObject({ ok: true, ready: 3, total: 3 });
  });
});

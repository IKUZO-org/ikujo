// vote, 판정 (spec §4 vote, S-11). 로컬 Supabase 필요
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { castVote } from "@/server/game-vote";
import { guest, insert, serviceClient } from "./local-supabase";

type Row = Record<string, unknown> & { id: string };

let db: SupabaseClient;
let users: { client: SupabaseClient; userId: string }[];
let p: Row[];

const CHARACTERS = ["fav", "villain", "athlete", "writer", "influencer"];

// 5명 판. p[0] 범인, p[4] 희생자(유령). 투표할 사람은 p[0]~p[3] 4명
async function newGame(phase: "vote" | "revote" = "vote", revoteCandidates?: string[]) {
  const [game] = await insert<Row>(db, "games", {
    room_id: p[0].room_id,
    player_count: 5,
    phase,
    phase_started_at: new Date().toISOString(),
    phase_ends_at: new Date(Date.now() + 60_000).toISOString(),
    assignment_source: "rule",
    revote_candidates: revoteCandidates ?? null,
  });
  await insert(db, "game_secrets", {
    game_id: game.id,
    culprit_player_id: p[0].id,
    victim_player_id: p[4].id,
    culprit_character: "fav",
    ghost_trait: "t",
  });
  await insert(
    db,
    "assignments",
    p.map((x, i) => ({
      game_id: game.id,
      player_id: x.id,
      character_id: CHARACTERS[i],
      secret_id: "s",
      alibi_id: "a",
      is_culprit: i === 0,
      is_ghost: i === 4,
    })),
  );
  return game.id;
}

const cast = (gameId: string, voter: number, target: number) =>
  castVote(db, users[voter].userId, gameId, p[target].id);

async function gameRow(gameId: string) {
  const { data } = await db
    .from("games")
    .select("phase, revote_candidates, outcome")
    .eq("id", gameId)
    .single<{ phase: string; revote_candidates: string[] | null; outcome: string | null }>();
  return data;
}

beforeAll(async () => {
  db = serviceClient();
  users = await Promise.all([guest(), guest(), guest(), guest(), guest()]);
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
});

describe("castVote", () => {
  it("다른 참가자 세션으로는 남의 투표를 읽을 수 없다 (AC-060)", async () => {
    const g = await newGame();
    expect(await cast(g, 0, 1)).toMatchObject({ ok: true, votes: 1, total: 4 });
    const { data } = await users[1].client.from("votes").select("*").eq("game_id", g);
    expect(data).toHaveLength(0);
  });

  it("마지막 두 표가 동시에 와도 판정은 한 번만", async () => {
    const g = await newGame();
    await cast(g, 0, 0);
    await cast(g, 1, 0);
    await Promise.all([cast(g, 2, 0), cast(g, 3, 1)]);
    expect(await gameRow(g)).toMatchObject({ phase: "reveal", outcome: "caught" });
    const { data: events } = await db
      .from("events")
      .select("name")
      .eq("game_id", g)
      .eq("name", "vote_done");
    expect(events).toHaveLength(1);
  });

  it("2:2 동점이면 그 2명만 후보로 재투표, 재투표도 동점이면 방송 중단 (AC-060-2, OQ-008)", async () => {
    const g = await newGame();
    expect(await cast(g, 0, 4)).toEqual({ error: "고를 수 없는 사람이에요." }); // 유령은 후보 아님
    await cast(g, 0, 1);
    expect(await cast(g, 0, 2)).toEqual({ error: "이미 투표했어요." });
    await cast(g, 1, 1);
    await cast(g, 2, 2);
    await cast(g, 3, 2);
    const revote = await gameRow(g);
    expect(revote?.phase).toBe("revote");
    expect([...(revote?.revote_candidates ?? [])].sort()).toEqual([p[1].id, p[2].id].sort());

    expect(await cast(g, 0, 0)).toEqual({ error: "고를 수 없는 사람이에요." });
    await cast(g, 0, 1);
    await cast(g, 1, 1);
    await cast(g, 2, 2);
    await cast(g, 3, 2);
    expect(await gameRow(g)).toMatchObject({ phase: "reveal", outcome: "aired_off" });
  });

  it("유령은 투표하지 않는다 (AC-053)", async () => {
    const g = await newGame();
    expect(await cast(g, 4, 0)).toEqual({ error: "유령은 투표하지 않아요." });
  });
});

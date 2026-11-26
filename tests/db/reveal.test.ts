// 해설 (spec §4 getReveal, data §3 reveals). 로컬 Supabase 필요
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readReveal } from "@/server/game-reveal";
import { castVote } from "@/server/game-vote";
import { guest, insert, serviceClient } from "./local-supabase";

type Row = Record<string, unknown> & { id: string };

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

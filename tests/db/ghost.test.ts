// 유령 동작의 DB 제약 (005_ghost.sql, 001_core.sql, AC-053, OQ-005). 로컬 Supabase 필요
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { guest, insert, serviceClient } from "./local-supabase";

type Row = Record<string, unknown> & { id: string };

let db: SupabaseClient;
let game: Row;
let players: Row[];

beforeAll(async () => {
  db = serviceClient();
  const users = await Promise.all([guest(), guest(), guest(), guest()]);
  const [room] = await insert<Row>(db, "rooms", {
    code: String(Math.floor(100000 + Math.random() * 900000)),
  });
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
  [game] = await insert<Row>(db, "games", {
    room_id: room.id,
    player_count: 4,
    phase: "r2",
    assignment_source: "rule",
  });
});

const whisperRow = (round: number, to: number) => ({
  game_id: game.id,
  kind: "whisper",
  from_player_id: players[3].id,
  to_player_id: players[to].id,
  round,
  body: "속삭임",
});

describe("ghost_actions 제약", () => {
  it("같은 라운드에 속삭임 두 번은 unique 로 막힌다 (OQ-005)", async () => {
    await insert(db, "ghost_actions", whisperRow(2, 0));
    const { error } = await db.from("ghost_actions").insert(whisperRow(2, 1));
    expect(error?.code).toBe("23505");
    expect(error?.message).toContain("ghost_actions_one_whisper_per_round_key");
    // 다음 라운드는 된다
    await insert(db, "ghost_actions", whisperRow(3, 1));
  });

  it("출몰은 판에 1번 (AC-053)", async () => {
    const row = {
      game_id: game.id,
      kind: "haunt",
      from_player_id: players[3].id,
      round: 2,
      body: "하나",
    };
    await insert(db, "ghost_actions", row);
    const { error } = await db.from("ghost_actions").insert({ ...row, round: 3, body: "둘" });
    expect(error?.code).toBe("23505");
    expect(error?.message).toContain("ghost_actions_one_haunt_key");
  });

  it("글은 80자까지", async () => {
    const { error } = await db
      .from("ghost_actions")
      .insert({ ...whisperRow(1, 2), body: "가".repeat(81) });
    expect(error?.code).toBe("23514");
  });
});

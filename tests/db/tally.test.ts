// tally 테스트 (spec S-11, §8: 단독 최다, 2인 동점, 재투표 동점, 무투표). 로컬 Supabase 필요
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { guest, insert, serviceClient } from "./local-supabase";

type Row = Record<string, unknown> & { id: string };

let db: SupabaseClient;
let memberClient: SupabaseClient;
let p: Row[];

// 새 판을 만들고 그 판의 id 를 돌려준다
async function newGame(): Promise<string> {
  const [game] = await insert<Row>(db, "games", {
    room_id: p[0].room_id,
    player_count: 5,
    phase: "vote",
    assignment_source: "rule",
  });
  return game.id;
}

async function vote(gameId: string, round: number, pairs: [number, number][]) {
  await insert(
    db,
    "votes",
    pairs.map(([voter, target]) => ({
      game_id: gameId,
      round,
      voter_player_id: p[voter].id,
      target_player_id: p[target].id,
    })),
  );
}

async function tally(gameId: string, round: number) {
  const { data, error } = await db.rpc("tally", {
    p_game_id: gameId,
    p_round: round,
  });
  expect(error).toBeNull();
  return (data as { target_player_id: string; vote_count: number }[]).map((r) => ({
    target: r.target_player_id,
    count: r.vote_count,
  }));
}

beforeAll(async () => {
  db = serviceClient();
  const users = await Promise.all([guest(), guest(), guest(), guest(), guest()]);
  memberClient = users[0].client;
  const [room] = await insert<Row>(db, "rooms", {
    code: String(Math.floor(100000 + Math.random() * 900000)),
  });
  p = await insert<Row>(
    db,
    "players",
    users.map((u, i) => ({
      room_id: room.id,
      user_id: u.userId,
      nickname: `t${i + 1}`,
      seat: i + 1,
    })),
  );
  p.sort((x, y) => Number(x.seat) - Number(y.seat));
});

describe("tally(game_id, round)", () => {
  it("단독 최다: 1명만 돌려준다", async () => {
    const g = await newGame();
    await vote(g, 1, [
      [0, 1],
      [2, 1],
      [3, 1],
      [1, 4],
    ]);
    expect(await tally(g, 1)).toEqual([{ target: p[1].id, count: 3 }]);
  });

  it("2인 동점: 동점자 둘을 돌려준다 (AC-060-2 재투표 후보)", async () => {
    const g = await newGame();
    await vote(g, 1, [
      [0, 1],
      [2, 1],
      [1, 3],
      [4, 3],
    ]);
    const result = await tally(g, 1);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.target).sort()).toEqual([p[1].id, p[3].id].sort());
    expect(result.every((r) => r.count === 2)).toBe(true);
  });

  it("재투표도 동점: round 2 만 따로 센다", async () => {
    const g = await newGame();
    await vote(g, 1, [
      [0, 1],
      [2, 1],
      [1, 3],
      [4, 3],
    ]);
    await vote(g, 2, [
      [0, 1],
      [1, 3],
    ]);
    const result = await tally(g, 2);
    expect(result.map((r) => r.target).sort()).toEqual([p[1].id, p[3].id].sort());
    expect(result.every((r) => r.count === 1)).toBe(true);
  });

  it("무투표: 빈 목록", async () => {
    const g = await newGame();
    expect(await tally(g, 1)).toEqual([]);
  });

  it("참가자 세션으로는 부를 수 없다 (해설 전 집계 비밀, BR-001)", async () => {
    const g = await newGame();
    const { error } = await memberClient.rpc("tally", {
      p_game_id: g,
      p_round: 1,
    });
    expect(error).not.toBeNull();
  });
});

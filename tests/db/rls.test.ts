// RLS 테스트 (data §3, AC-030, NFR-004). 로컬 Supabase 필요: `supabase start` 뒤 `npm run test:db`
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { guest, insert, serviceClient } from "./local-supabase";

type Row = Record<string, unknown> & { id: string };

let A: SupabaseClient;
let B: SupabaseClient;
let C: SupabaseClient;
let outsider: SupabaseClient;
let room: Row;
let game: Row;
let players: Row[];

beforeAll(async () => {
  const db = serviceClient();
  const users = await Promise.all([guest(), guest(), guest(), guest(), guest()]);
  [A, B, C] = users.map((u) => u.client);
  outsider = users[4].client;

  const code = String(Math.floor(100000 + Math.random() * 900000));
  [room] = await insert<Row>(db, "rooms", { code });
  players = await insert<Row>(
    db,
    "players",
    users.slice(0, 4).map((u, i) => ({
      room_id: room.id,
      user_id: u.userId,
      nickname: `p${i + 1}`,
      seat: i + 1,
    })),
  );
  // insert().select() 는 넣은 순서를 보장하지 않아서 seat 로 맞춘다
  players.sort((x, y) => Number(x.seat) - Number(y.seat));
  const [pA, pB, pC, pD] = players;

  [game] = await insert<Row>(db, "games", {
    room_id: room.id,
    player_count: 4,
    phase: "vote",
    assignment_source: "rule",
  });
  await insert(db, "game_secrets", {
    game_id: game.id,
    culprit_player_id: pB.id,
    victim_player_id: pD.id,
    culprit_character: "villain",
    ghost_trait: "t-cap",
  });
  await insert(db, "assignments", [
    // 여러 줄을 한 번에 넣으면 빠진 칸은 기본값이 아니라 null 이 되어서 모든 칸을 채운다
    {
      game_id: game.id,
      player_id: pA.id,
      character_id: "fav",
      secret_id: "s1",
      alibi_id: "a1",
      is_culprit: false,
      is_ghost: false,
    },
    {
      game_id: game.id,
      player_id: pB.id,
      character_id: "villain",
      secret_id: "s2",
      alibi_id: "a2",
      is_culprit: true,
      is_ghost: false,
    },
    {
      game_id: game.id,
      player_id: pC.id,
      character_id: "athlete",
      secret_id: "s3",
      alibi_id: "a3",
      is_culprit: false,
      is_ghost: false,
    },
    {
      game_id: game.id,
      player_id: pD.id,
      character_id: "writer",
      secret_id: "s4",
      alibi_id: "a4",
      is_culprit: false,
      is_ghost: true,
    },
  ]);
  await insert(db, "votes", [
    {
      game_id: game.id,
      round: 1,
      voter_player_id: pA.id,
      target_player_id: pB.id,
    },
    {
      game_id: game.id,
      round: 1,
      voter_player_id: pB.id,
      target_player_id: pC.id,
    },
  ]);
  await insert(db, "ghost_actions", [
    {
      game_id: game.id,
      kind: "whisper",
      from_player_id: pD.id,
      to_player_id: pA.id,
      round: 2,
      body: "모자",
    },
    {
      game_id: game.id,
      kind: "haunt",
      from_player_id: pD.id,
      to_player_id: null,
      round: 3,
      body: "생방송 연결",
    },
  ]);
  await insert(db, "reveals", { game_id: game.id, body: { cards: [] } });
});

async function rows(client: SupabaseClient, table: string) {
  const { data, error } = await client.from(table).select("*");
  expect(error).toBeNull();
  return data ?? [];
}

describe("남의 비밀은 0줄 (AC-030, NFR-004)", () => {
  it("assignments: 내 것 1줄만, 범인 표시는 범인 본인만", async () => {
    const mine = await rows(A, "assignments");
    expect(mine).toHaveLength(1);
    expect(mine[0].player_id).toBe(players[0].id);
    expect(mine[0].is_culprit).toBe(false);
    const culprit = await rows(B, "assignments");
    expect(culprit).toHaveLength(1);
    expect(culprit[0].is_culprit).toBe(true);
  });

  it("game_secrets: 참가자도 0줄", async () => {
    for (const c of [A, B, C]) expect(await rows(c, "game_secrets")).toHaveLength(0);
  });

  it("votes: 내 투표 1줄만, 남의 투표 0줄", async () => {
    const mine = await rows(A, "votes");
    expect(mine).toHaveLength(1);
    expect(mine[0].voter_player_id).toBe(players[0].id);
    expect(await rows(C, "votes")).toHaveLength(0);
  });
});

describe("참가자가 아닌 사람과 players 칸", () => {
  it("참가자가 아니면 rooms 가 0줄 (코드로 찾기는 단계 4 join_room)", async () => {
    expect(await rows(A, "rooms")).toHaveLength(1);
    expect(await rows(outsider, "rooms")).toHaveLength(0);
  });

  it("players 의 user_id 는 못 읽는다 (data §3)", async () => {
    const { error } = await A.from("players").select("user_id");
    expect(error).not.toBeNull();
  });
});

describe("조건이 붙은 정책", () => {
  it("속삭임은 보낸 사람과 받은 사람만, 출몰은 참가자 모두", async () => {
    const forA = await rows(A, "ghost_actions");
    expect(forA.map((r) => r.kind).sort()).toEqual(["haunt", "whisper"]);
    const forC = await rows(C, "ghost_actions");
    expect(forC.map((r) => r.kind)).toEqual(["haunt"]);
  });

  it("해설은 reveal 단계부터", async () => {
    expect(await rows(A, "reveals")).toHaveLength(0);
    const { error } = await serviceClient()
      .from("games")
      .update({ phase: "reveal" })
      .eq("id", game.id);
    expect(error).toBeNull();
    expect(await rows(A, "reveals")).toHaveLength(1);
  });
});

describe("클라이언트는 쓰지 못한다 (쓰기는 서버만)", () => {
  it("참가자가 votes 에 직접 넣으면 막힌다", async () => {
    const { error } = await A.from("votes").insert({
      game_id: game.id,
      round: 2,
      voter_player_id: players[0].id,
      target_player_id: players[1].id,
    });
    expect(error).not.toBeNull();
  });
});

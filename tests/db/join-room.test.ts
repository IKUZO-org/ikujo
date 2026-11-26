// join_room 과 startGame 이 겹칠 때 (#36). 로컬 Supabase 필요
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import liveDeath from "../../scenarios/live-death.json";
import { scenarioSchema } from "@/lib/scenario/schema";
import { createRoom, joinRoom, startGame, type Deps } from "@/server/rooms/core";
import { supabaseRoomStore } from "@/server/rooms/supabase-store";
import { guest, serviceClient } from "./local-supabase";

const scenario = scenarioSchema.parse(liveDeath);
let db: SupabaseClient;

beforeAll(() => {
  db = serviceClient();
});

function phone(userId: string): Deps {
  return {
    store: supabaseRoomStore(db),
    user: { id: userId, isGuest: true },
    broadcast: async () => {},
    scenario,
    random: Math.random,
    now: () => new Date(),
    assignModel: null,
  };
}

async function users(n: number): Promise<string[]> {
  return (await Promise.all(Array.from({ length: n }, () => guest()))).map((u) => u.userId);
}

async function newRoom(hostId: string) {
  const r = await createRoom(phone(hostId), { nickname: "방장" });
  if (!("ok" in r)) throw new Error(r.error);
  return r;
}

describe("join_room", () => {
  it("6명이 동시에 들어와도 자리와 이름이 겹치지 않는다", async () => {
    const [host, ...others] = await users(7);
    const room = await newRoom(host);
    // 방장 1명 + 7명 동시 → 5명만 들어가고 2명은 꽉 참
    const extra = await users(2);
    const results = await Promise.all(
      [...others, ...extra].map((u) => joinRoom(phone(u), { code: room.code, nickname: "손님" })),
    );
    expect(results.filter((r) => "ok" in r)).toHaveLength(5);
    expect(results.filter((r) => "error" in r)).toHaveLength(3);

    const { data } = await db.from("players").select("seat, nickname").eq("room_id", room.roomId);
    const seats = (data ?? []).map((p) => p.seat).sort();
    const names = new Set((data ?? []).map((p) => p.nickname));
    expect(seats).toEqual([1, 2, 3, 4, 5, 6]);
    expect(names.size).toBe(6);
  });

  it("anon, authenticated 는 부를 수 없다", async () => {
    const g = await guest();
    const { error } = await g.client.rpc("join_room", {
      p_code: "000000",
      p_user_id: g.userId,
      p_is_guest: true,
      p_nickname: "x",
    });
    expect(error).not.toBeNull();
  });
});

describe("startGame 과 입장이 겹칠 때", () => {
  it("배정 없는 참가자가 남지 않는다", async () => {
    for (let round = 0; round < 5; round++) {
      const [host, a, b, c, late] = await users(5);
      const room = await newRoom(host);
      for (const u of [a, b, c]) await joinRoom(phone(u), { code: room.code, nickname: "p" });

      const [started, joined] = await Promise.all([
        startGame(phone(host), { roomId: room.roomId }),
        joinRoom(phone(late), { code: room.code, nickname: "늦게" }),
      ]);
      expect("ok" in started).toBe(true);

      const { data: players } = await db.from("players").select("id").eq("room_id", room.roomId);
      const { data: games } = await db
        .from("games")
        .select("id, player_count")
        .eq("room_id", room.roomId);
      const { data: assigned } = await db
        .from("assignments")
        .select("player_id")
        .eq("game_id", games![0].id);
      // 늦게 온 사람은 들어가서 배정을 받거나, "이미 시작한 방" 으로 못 들어간다
      expect((players ?? []).length).toBe("ok" in joined ? 5 : 4);
      expect(games![0].player_count).toBe(players!.length);
      expect(new Set(assigned!.map((x) => x.player_id))).toEqual(
        new Set(players!.map((p) => p.id)),
      );
    }
  });
});

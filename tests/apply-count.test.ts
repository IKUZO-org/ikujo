import { describe, expect, it } from "vitest";
import { applyCount } from "@/lib/apply-count";
import type { RoomState } from "@/server/rooms/core";

const state = (ready: number, votes: number) =>
  ({
    game: { ready: { count: ready, total: 4, mine: false }, vote: { count: votes, total: 4 } },
  }) as unknown as RoomState;

describe("applyCount (#135)", () => {
  it("count 신호는 지금보다 클 때만 반영하고 거꾸로 온 작은 값은 무시한다", () => {
    expect(applyCount(state(3, 0), { type: "count", ready: 4 })?.game?.ready.count).toBe(4);
    expect(applyCount(state(4, 0), { type: "count", ready: 3 })?.game?.ready.count).toBe(4);
    expect(applyCount(state(0, 2), { type: "count", votes: 3 })?.game?.vote?.count).toBe(3);
    expect(applyCount(state(0, 3), { type: "count", votes: 2 })?.game?.vote?.count).toBe(3);
  });
});

import { describe, expect, it } from "vitest";
import { applyCount, keepHeardCounts } from "@/lib/apply-count";
import type { RoomSignal } from "@/lib/realtime";
import type { RoomState } from "@/server/rooms/core";

const state = (ready: number, votes: number) =>
  ({
    game: {
      id: "g",
      phase: "intro",
      ready: { count: ready, total: 4, mine: false },
      vote: { count: votes, total: 4 },
    },
  }) as unknown as RoomState;
const count = (c: { ready?: number; votes?: number }, phase = "intro", gameId = "g") =>
  ({ type: "count", gameId, phase, ...c }) as Extract<RoomSignal, { type: "count" }>;

describe("applyCount (#135)", () => {
  it("count 신호는 지금보다 클 때만 반영하고 거꾸로 온 작은 값은 무시한다", () => {
    expect(applyCount(state(3, 0), count({ ready: 4 }))?.game?.ready.count).toBe(4);
    expect(applyCount(state(4, 0), count({ ready: 3 }))?.game?.ready.count).toBe(4);
    expect(applyCount(state(0, 2), count({ votes: 3 }))?.game?.vote?.count).toBe(3);
    expect(applyCount(state(0, 3), count({ votes: 2 }))?.game?.vote?.count).toBe(3);
  });

  it("다른 단계나 다른 판의 신호는 무시한다", () => {
    expect(applyCount(state(0, 0), count({ ready: 3 }, "secret"))?.game?.ready.count).toBe(0);
    expect(applyCount(state(0, 0), count({ ready: 3 }, "intro", "h"))?.game?.ready.count).toBe(0);
  });
});

describe("keepHeardCounts (#135)", () => {
  it("읽는 사이 받은 큰 수는 지키고, 다른 단계 신호면 응답 그대로", () => {
    expect(keepHeardCounts(state(3, 0), [count({ ready: 4 })]).game?.ready.count).toBe(4);
    expect(keepHeardCounts(state(3, 0), [count({ ready: 4 }, "secret")]).game?.ready.count).toBe(3);
  });
});

// 단계 규칙 (spec §1.1, OQ-007)
import { describe, expect, it } from "vitest";
import { canAdvance, endsAtFor, nextPhase, type Phase } from "@/server/phase";

const start = new Date("2026-01-01T00:00:00Z");
const at = (ms: number) => new Date(start.getTime() + ms);

function decide(phase: Phase, nowMs: number, readyCount = 0, playerCount = 4) {
  return canAdvance({
    current: phase,
    from: phase,
    endsAt: endsAtFor(phase, start),
    now: at(nowMs),
    readyCount,
    playerCount,
  });
}

describe("canAdvance", () => {
  it("시간 전에는 거절한다", () => {
    expect(decide("r1", 8 * 60_000 - 1)).toEqual({ ok: false, reason: "too_early" });
  });

  it("시간이 지나면 다음 단계로", () => {
    expect(decide("intro", 3 * 60_000)).toEqual({ ok: true, to: "secret" });
    expect(decide("r3", 8 * 60_000)).toEqual({ ok: true, to: "vote" });
  });

  it("intro, secret 은 모두 누르면 시간 전에도 넘어간다", () => {
    expect(decide("intro", 1000, 4, 4)).toEqual({ ok: true, to: "secret" });
    expect(decide("secret", 1000, 4, 4)).toEqual({ ok: true, to: "r1" });
    expect(decide("secret", 1000, 3, 4)).toEqual({ ok: false, reason: "too_early" });
  });

  it("r1 은 모두 준비해도 시간 전이면 거절한다 (OQ-007)", () => {
    expect(decide("r1", 1000, 4, 4)).toEqual({ ok: false, reason: "too_early" });
  });

  it("from 이 지금 단계가 아니면 아무것도 안 한다", () => {
    const d = canAdvance({
      current: "r2",
      from: "r1",
      endsAt: start,
      now: at(1),
      readyCount: 0,
      playerCount: 4,
    });
    expect(d).toEqual({ ok: false, reason: "stale" });
  });

  it("vote 다음은 단계 9 판정 전까지 넘기지 않는다", () => {
    expect(nextPhase("vote")).toBeNull();
    expect(decide("vote", 3 * 60_000)).toEqual({ ok: false, reason: "no_next" });
  });
});

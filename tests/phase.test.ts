// 단계 규칙 (spec §1.1, OQ-007)
import { describe, expect, it } from "vitest";
import { canAdvance, decideTally, endsAtFor, type Phase } from "@/server/phase";

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

  it("vote 는 모두 투표하거나 시간이 끝나면 판정으로 넘어간다", () => {
    expect(decide("vote", 1000, 3, 4)).toEqual({ ok: false, reason: "too_early" });
    expect(decide("vote", 1000, 4, 4)).toEqual({ ok: true, to: "reveal" });
    expect(decide("vote", 3 * 60_000, 0, 4)).toEqual({ ok: true, to: "reveal" });
  });
});

// 판정 (spec S-11, §8)
describe("decideTally", () => {
  it("단독 최다면 그 사람을 지목하고 reveal", () => {
    expect(decideTally("vote", ["a"])).toEqual({ to: "reveal", accused: "a" });
    expect(decideTally("revote", ["b"])).toEqual({ to: "reveal", accused: "b" });
  });

  it("2인 동점이면 그 2명만 후보로 revote (AC-060-2)", () => {
    expect(decideTally("vote", ["a", "b"])).toEqual({ to: "revote", candidates: ["a", "b"] });
  });

  it("재투표도 동점이면 지목 없이 reveal (OQ-008)", () => {
    expect(decideTally("revote", ["a", "b"])).toEqual({ to: "reveal", accused: null });
  });

  it("아무도 안 찍으면 지목 없이 reveal (OQ-008)", () => {
    expect(decideTally("vote", [])).toEqual({ to: "reveal", accused: null });
    expect(decideTally("revote", [])).toEqual({ to: "reveal", accused: null });
  });
});

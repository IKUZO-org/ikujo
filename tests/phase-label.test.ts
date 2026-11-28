import { describe, expect, it } from "vitest";
import { phaseLabel } from "@/lib/phase-label";

describe("phaseLabel (QA #136)", () => {
  it("라운드: 준비 완료 전에는 라운드 번호만", () => {
    expect(phaseLabel("r1", { ready: false, dead: false })).toBe("라운드 1");
    expect(phaseLabel("r3", { ready: false, dead: false })).toBe("라운드 3");
  });

  it("라운드: 준비 완료 뒤에는 토론 중", () => {
    expect(phaseLabel("r2", { ready: true, dead: false })).toBe("라운드 2 · 토론 중");
  });

  it("희생자 폰은 준비와 상관없이 사망", () => {
    expect(phaseLabel("r2", { ready: false, dead: true })).toBe("사망");
    expect(phaseLabel("r3", { ready: true, dead: true })).toBe("사망");
  });

  it("라운드가 아닌 단계는 화면 이름 그대로", () => {
    expect(phaseLabel("intro")).toBe("오프닝");
    expect(phaseLabel("vote", { ready: false, dead: true })).toBe("투표");
    expect(phaseLabel(null)).toBe("");
    expect(phaseLabel("unknown")).toBe("");
  });
});

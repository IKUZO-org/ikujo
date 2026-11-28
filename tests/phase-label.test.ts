import { describe, expect, it } from "vitest";
import { phaseLabel } from "@/lib/phase-label";

describe("phaseLabel (QA #136, #138)", () => {
  it("라운드: 모두 준비하기 전에는 라운드 번호만", () => {
    expect(phaseLabel("r1", { talking: false, dead: false })).toBe("라운드 1");
    expect(phaseLabel("r3", { talking: false, dead: false })).toBe("라운드 3");
  });

  it("라운드: 모두 준비하고 토스트가 사라지면 토론 중", () => {
    expect(phaseLabel("r2", { talking: true, dead: false })).toBe("라운드 2 · 토론 중");
  });

  it("희생자 폰은 토론과 상관없이 사망", () => {
    expect(phaseLabel("r2", { talking: false, dead: true })).toBe("사망");
    expect(phaseLabel("r3", { talking: true, dead: true })).toBe("사망");
  });

  it("라운드가 아닌 단계는 화면 이름 그대로", () => {
    expect(phaseLabel("intro")).toBe("오프닝");
    expect(phaseLabel("vote", { talking: false, dead: true })).toBe("투표");
    expect(phaseLabel(null)).toBe("");
    expect(phaseLabel("unknown")).toBe("");
  });
});

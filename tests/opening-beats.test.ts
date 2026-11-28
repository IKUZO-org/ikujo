import { describe, expect, it } from "vitest";
import { beatAt, OPENING_BEAT_STARTS } from "@/lib/opening-beats";

describe("beatAt (#141, V-01 콘티 컷 시각)", () => {
  it("장면은 4개", () => {
    expect(OPENING_BEAT_STARTS).toHaveLength(4);
  });

  it("각 구간 안의 시각은 그 장면", () => {
    expect(beatAt(0)).toBe(0);
    expect(beatAt(11.9)).toBe(0);
    expect(beatAt(12)).toBe(1);
    expect(beatAt(19.99)).toBe(1);
    expect(beatAt(20)).toBe(2);
    expect(beatAt(29.4)).toBe(2);
    expect(beatAt(29.5)).toBe(3);
    expect(beatAt(39.3)).toBe(3);
  });

  it("범위 밖도 처음과 마지막 장면으로", () => {
    expect(beatAt(-1)).toBe(0);
    expect(beatAt(120)).toBe(3);
  });
});

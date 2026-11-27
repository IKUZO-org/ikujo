import { describe, expect, it } from "vitest";
import {
  BG_TAIL_MS,
  crossedAlert,
  hasNewcomer,
  loopEndSeconds,
  PHASE_LAYER,
  pickLayer,
  shouldPlay,
} from "@/lib/sound-cues";

describe("pickLayer (sound.md §1, #100)", () => {
  it("V-01 이 끝나기 전 오프닝과 단계가 없을 때는 깔지 않는다", () => {
    expect(pickLayer("intro", null, false)).toBeNull();
    expect(pickLayer(null, null, true)).toBeNull();
  });

  it("라운드 끝 3분부터 BG 를 깐다", () => {
    expect(pickLayer("r1", BG_TAIL_MS + 1, true)).toBe(PHASE_LAYER.r1);
    expect(pickLayer("r1", BG_TAIL_MS, true)).toBe("bg-01");
  });
});

describe("loopEndSeconds", () => {
  it("모든 채널에서 마지막 소리 뒤 0.05초까지, 끝 무음은 뺀다", () => {
    const a = [0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const b = [0, 0, 0.1, 0.001, 0, 0, 0, 0, 0, 0]; // 0.001 은 무음
    expect(loopEndSeconds([a, b], 10)).toBeCloseTo(0.35);
    expect(loopEndSeconds([[0, 0]], 10)).toBeCloseTo(0.2); // 전부 무음이면 전체 길이
  });
});

describe("shouldPlay", () => {
  it("host 소리는 방장 폰에서만 난다 (규칙 1)", () => {
    expect([shouldPlay("rd-01", true), shouldPlay("rd-01", false)]).toEqual([true, false]);
  });
});

describe("hasNewcomer (LB-01)", () => {
  it("처음 읽은 목록과 나가기만 한 목록에서는 울리지 않는다", () => {
    expect(hasNewcomer(null, ["a", "b"])).toBe(false);
    expect(hasNewcomer(["a", "b"], ["a"])).toBe(false);
    expect(hasNewcomer(["a"], ["a", "b"])).toBe(true);
  });
});

describe("R3 BGM (#128)", () => {
  it("R3 는 잡음 대신 BG-02 로 시작해 끝 3분은 BG-01", () => {
    expect(pickLayer("r3", BG_TAIL_MS + 1, true)).toBe("bg-02");
    expect(pickLayer("r3", BG_TAIL_MS, true)).toBe("bg-01");
  });
});

describe("crossedAlert (RD-06 남은 1분, 10초, #128)", () => {
  it("1분과 10초를 지나는 순간에만 울린다", () => {
    expect(crossedAlert(61_000, 60_000)).toBe(60_000);
    expect(crossedAlert(60_000, 59_000)).toBeNull();
    expect(crossedAlert(11_000, 10_000)).toBe(10_000);
    expect(crossedAlert(120_000, 119_000)).toBeNull();
  });
  it("처음 읽은 값, 시간 끝은 울리지 않는다", () => {
    expect(crossedAlert(null, 30_000)).toBeNull();
    expect(crossedAlert(11_000, 0)).toBeNull();
  });
  it("한 번에 두 경계를 건너뛰면 짧은 쪽 하나만", () => {
    expect(crossedAlert(70_000, 5_000)).toBe(10_000);
  });
});

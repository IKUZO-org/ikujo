// 영상 소리를 내는 폰 (docs/video/PLAN.md §1 영상별 소리, sound.md 규칙 1, 3, FR-091, #101)
import { afterEach, describe, expect, it, vi } from "vitest";
import { onSettingsChange, setOn } from "@/lib/settings";
import {
  holdAt,
  isOpeningDone,
  markOpeningDone,
  onOpeningDone,
  playedKey,
  videoHasSound,
  videoSrc,
  type VideoId,
} from "@/lib/video";

const SHARED: VideoId[] = ["v-01", "v-02", "v-03", "v-06", "v-07", "v-09"];

afterEach(() => vi.unstubAllGlobals());

describe("videoHasSound", () => {
  it("공용 영상은 방장 폰만 소리를 낸다", () => {
    for (const id of SHARED) {
      expect(videoHasSound(id, { isHost: true, soundOn: true })).toBe(true);
      expect(videoHasSound(id, { isHost: false, soundOn: true })).toBe(false);
    }
  });

  it("V-05 출몰은 모든 폰, V-04 유령 전환은 그 영상이 나오는 희생자 폰이 소리를 낸다", () => {
    for (const id of ["v-04", "v-05"] as const) {
      expect(videoHasSound(id, { isHost: false, soundOn: true })).toBe(true);
      expect(videoHasSound(id, { isHost: true, soundOn: true })).toBe(true);
    }
  });

  it("설정에서 소리를 끄면 방장 폰도, V-05 도 소리를 내지 않는다", () => {
    for (const id of [...SHARED, "v-04", "v-05"] as const) {
      expect(videoHasSound(id, { isHost: true, soundOn: false })).toBe(false);
    }
  });
});

describe("영상 주소와 본 기록", () => {
  it("public/videos/<ID 소문자>.mp4, 본 기록은 판과 영상마다 따로", () => {
    expect(videoSrc("v-09")).toBe("/videos/v-09.mp4");
    expect(playedKey("g1", "v-02")).not.toBe(playedKey("g2", "v-02"));
    expect(playedKey("g1", "v-02")).not.toBe(playedKey("g1", "v-03"));
  });
});

describe("오프닝 끝 신호 (sound.md 1.1, #110)", () => {
  it("판마다 따로, 한 번만 알린다. 새로 고친 뒤에도 이 폰에 남는다", () => {
    const m = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
    });
    const listener = vi.fn();
    const stop = onOpeningDone(listener);
    expect(isOpeningDone("game-a")).toBe(false);
    markOpeningDone("game-a");
    markOpeningDone("game-a");
    expect(isOpeningDone("game-a")).toBe(true);
    expect(isOpeningDone("game-b")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect([...m.values()]).toEqual(["1"]); // 새로 고침 뒤에는 저장소로 안다
    stop();
  });
});

describe("onSettingsChange", () => {
  it("설정을 바꾸면 듣는 쪽에 알리고, 그만 들으면 더 알리지 않는다", () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => undefined });
    const listener = vi.fn();
    const stop = onSettingsChange(listener);
    setOn("sound", false);
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    setOn("sound", true);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("holdAt (#141)", () => {
  it("끝이 검게 사라지는 V-01 은 어두워지기 직전에서 멈춘다", () => {
    expect(holdAt("v-01")).toBe(36.5);
  });

  it("나머지 영상은 끝까지 튼다", () => {
    expect(holdAt("v-03")).toBeNull();
    expect(holdAt("v-07")).toBeNull();
  });
});

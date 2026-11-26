// 설정, 온보딩 본 적은 이 폰에만 (S-13, S-01, #73)
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasSeenOnboarding, isOn, markOnboardingSeen, setOn, vibrate } from "@/lib/settings";

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("settings", () => {
  it("처음에는 소리, 진동이 켜져 있고 온보딩은 안 봄. 저장한 값은 다시 읽힌다", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    expect(isOn("sound")).toBe(true);
    expect(hasSeenOnboarding()).toBe(false);
    setOn("sound", false);
    markOnboardingSeen();
    expect(isOn("sound")).toBe(false);
    expect(isOn("vibration")).toBe(true);
    expect(hasSeenOnboarding()).toBe(true);
  });

  it("저장소를 못 쓰면 기본값으로 돌고 던지지 않는다", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("localStorage", { getItem: blocked, setItem: blocked });
    expect(() => setOn("vibration", false)).not.toThrow();
    expect(isOn("vibration")).toBe(true);
    expect(hasSeenOnboarding()).toBe(false);
  });

  it("진동을 끄면 떨지 않는다", () => {
    const buzz = vi.fn();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("navigator", { vibrate: buzz });
    vibrate(200);
    setOn("vibration", false);
    vibrate(200);
    expect(buzz).toHaveBeenCalledTimes(1);
  });
});

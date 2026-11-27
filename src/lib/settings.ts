// 설정(S-13, FR-091)과 온보딩 본 적(S-01, FR-002)은 이 폰에만 둔다 (로그인 없음, D-018).
// localStorage 를 못 쓰는 브라우저(사생활 보호 모드 등)에서는 기본값으로 돌고 화면은 깨지지 않는다
const KEYS = {
  sound: "last-one:sound",
  vibration: "last-one:vibration",
  onboarded: "last-one:onboarded",
} as const;

export type Toggle = "sound" | "vibration";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장 못 해도 지금 화면에서는 바뀐 값으로 보인다
  }
}

/** 소리, 진동은 기본으로 켜져 있다 */
export function isOn(name: Toggle): boolean {
  return read(KEYS[name]) !== "off";
}

/** 설정이 바뀌면 이 폰 안에 알린다. 소리를 끄는 순간 깔린 BGM 을 멈추는 데 쓴다 (src/lib/sound.ts) */
export const SETTINGS_EVENT = "last-one:settings";

export function setOn(name: Toggle, on: boolean) {
  write(KEYS[name], on ? "on" : "off");
  try {
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  } catch {
    // window 가 없는 곳(테스트 등)
  }
}

export function hasSeenOnboarding(): boolean {
  return read(KEYS.onboarded) === "1";
}

export function markOnboardingSeen() {
  write(KEYS.onboarded, "1");
}

/** 진동 설정이 켜져 있을 때만 떨린다. 못 하는 기기(iOS Safari 등)는 조용히 넘어간다 */
export function vibrate(pattern: number | number[]) {
  if (!isOn("vibration")) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // 진동을 못 하는 기기: 점과 글로만 알린다 (DESIGN.md §7)
  }
}

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

// 설정을 바꾸면 이미 나오고 있는 영상, 소리도 바로 따르게 알린다 (#101)
const listeners = new Set<() => void>();

export function setOn(name: Toggle, on: boolean) {
  write(KEYS[name], on ? "on" : "off");
  for (const l of listeners) l();
}

/** 설정이 바뀔 때마다 부른다. 돌려준 함수로 그만 듣는다 (useSyncExternalStore 의 subscribe 모양) */
export function onSettingsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
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

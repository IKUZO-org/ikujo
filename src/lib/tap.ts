// 사용자 탭 기다리기. 모바일은 사용자가 누르는 순간 안에서만 소리를 켤 수 있다 (sound.md 규칙 6).
// iOS Safari 는 pointerdown 으로는 소리가 안 열리는 경우가 있어 셋을 같이 듣는다
const TAP_EVENTS = ["pointerdown", "touchend", "click"] as const;

/** 탭마다 fn 을 부른다. 돌려준 함수로 뗀다 */
export function onTap(fn: () => void): () => void {
  for (const e of TAP_EVENTS) window.addEventListener(e, fn, true);
  return () => {
    for (const e of TAP_EVENTS) window.removeEventListener(e, fn, true);
  };
}

/** 다음 탭에 fn 을 한 번 부른다. 돌려준 함수로 미리 뗄 수 있다 */
export function onNextTap(fn: () => void): () => void {
  const off = onTap(() => {
    off();
    fn();
  });
  return off;
}

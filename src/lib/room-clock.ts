// 남은 시간 계산 (#21, NFR-001). 시간 기준은 서버 시각이다.
// 폰 시계가 틀려도 같은 남은 시간을 보이도록 "서버 시각 - 받은 순간 폰 시각" 으로 보정한다.
// 왕복 지연은 보정하지 않는다.

/** 보정값(ms) = serverNow - 응답을 받은 순간의 폰 시각 */
export function clockOffsetMs(serverNow: string, phoneNowMs: number): number {
  return Date.parse(serverNow) - phoneNowMs;
}

/** 남은 시간(ms). 마감이 없으면 null, 지났으면 0 */
export function remainingMs(
  phaseEndsAt: string | null,
  phoneNowMs: number,
  offsetMs: number,
): number | null {
  if (phaseEndsAt === null) return null;
  return Math.max(0, Date.parse(phaseEndsAt) - (phoneNowMs + offsetMs));
}

/** 남은 시간(ms)을 mm:ss 로. 초는 올림 (0.2초 남으면 00:01). null 이면 빈 문자열 */
export function formatRemaining(ms: number | null): string {
  if (ms === null) return "";
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

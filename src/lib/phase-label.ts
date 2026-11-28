// 상단 바 가운데의 단계 문구 (spec §2 공통 틀, DESIGN.md §6 TopBar).
// 라운드는 폰마다 다르다 (QA #136):
// - 준비 완료 전 "라운드 N", 준비 완료 뒤 "라운드 N · 토론 중"
// - r2 부터 희생자 폰(유령 모드)은 "사망"
// 나머지 단계는 spec 화면 이름(S-07~S-12)

const LABELS: Record<string, string> = {
  intro: "오프닝",
  secret: "인물 카드",
  vote: "투표",
  revote: "재투표",
  reveal: "해설",
  ended: "끝",
};

const ROUND: Record<string, number> = { r1: 1, r2: 2, r3: 3 };

export function phaseLabel(
  phase: string | null,
  me: { ready: boolean; dead: boolean } = { ready: false, dead: false },
): string {
  if (!phase) return "";
  const n = ROUND[phase];
  if (n === undefined) return LABELS[phase] ?? "";
  if (me.dead) return "사망";
  return me.ready ? `라운드 ${n} · 토론 중` : `라운드 ${n}`;
}

// 상단 바 가운데의 단계 문구 (spec §2 공통 틀, DESIGN.md §6 TopBar).
// 라운드 (QA #136, #138):
// - 평소 "라운드 N". 모두 준비 완료를 누르고 토스트가 사라지면 다 같이 "라운드 N · 토론 중" (talking)
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
  me: { talking: boolean; dead: boolean } = { talking: false, dead: false },
): string {
  if (!phase) return "";
  const n = ROUND[phase];
  if (n === undefined) return LABELS[phase] ?? "";
  if (me.dead) return "사망";
  return me.talking ? `라운드 ${n} · 토론 중` : `라운드 ${n}`;
}

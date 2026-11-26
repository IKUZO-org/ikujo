// 상단 고정 바 (spec §2 공통 틀, PRD §13, DESIGN.md §6 TopBar): 높이 52px + 위 안전 영역, 3칸.
// 왼쪽: 설정(S-13) 아이콘과 사건 제목, 가운데: 지금 단계, 오른쪽: 남은 시간.
// 사건 제목 자리는 spec/PRD(상단 바)와 DESIGN.md(등장인물 보기 안)가 다르다. docs 를 따라 상단 바에 둔다 (CLAUDE.md §2).
// 등장인물 보기 아이콘은 #73(설정) 범위 밖이라 두지 않았다
import { Timer } from "@/components/game";
import { SettingsButton } from "@/components/settings";

// 문구는 spec 예시 "라운드 2 · 토론 중" 을 따르고, 나머지는 spec 화면 이름(S-07~S-12)
export const PHASE_LABELS: Record<string, string> = {
  intro: "오프닝",
  secret: "인물 카드",
  r1: "라운드 1 · 토론 중",
  r2: "라운드 2 · 토론 중",
  r3: "라운드 3 · 토론 중",
  vote: "투표",
  revote: "재투표",
  reveal: "해설",
  ended: "끝",
};

export function PhaseBar({
  title,
  phase,
  remainingMs,
}: {
  title: string;
  phase: string | null;
  remainingMs: number | null;
}) {
  return (
    <header className="sticky top-0 z-10 shrink-0 bg-(--color-bg) pt-[env(safe-area-inset-top)] text-(--color-text)">
      <div className="grid h-13 grid-cols-[1fr_auto_1fr] items-center gap-(--space-2) border-b border-(--color-border) px-(--space-4)">
        <span className="flex min-w-0 items-center">
          <SettingsButton />
          <span className="truncate text-(length:--text-sm) text-(--color-text-muted)">
            {title}
          </span>
        </span>
        <h1 className="text-center text-(length:--text-md) font-bold">
          {phase ? (PHASE_LABELS[phase] ?? "") : ""}
        </h1>
        <span className="flex justify-end">
          <Timer ms={remainingMs} label="남은 시간" />
        </span>
      </div>
    </header>
  );
}

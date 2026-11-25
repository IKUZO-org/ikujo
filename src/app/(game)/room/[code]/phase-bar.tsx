// 상단 고정 바 (spec "공통 틀", PRD §13): 사건 제목, 지금 단계, 남은 시간.
// 등장인물 보기, 설정은 각 화면 단계에서 붙인다
import { formatRemaining } from "@/lib/room-clock";

// 문구는 spec 예시 "라운드 2 · 토론 중" 을 따르고, 나머지는 spec 화면 이름(S-07~S-12)
const LABELS: Record<string, string> = {
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
    <header className="sticky top-0 z-10 flex min-h-11 items-center justify-between gap-(--space-2) bg-(--color-surface) px-(--space-4) pt-[env(safe-area-inset-top)] text-(--color-text)">
      <div className="flex min-w-0 flex-col py-(--space-2)">
        <span className="truncate text-(length:--text-sm) text-(--color-text-muted)">{title}</span>
        <span className="text-(length:--text-md)">{phase ? (LABELS[phase] ?? "") : ""}</span>
      </div>
      <span
        aria-label={remainingMs === null ? undefined : "남은 시간"}
        className="text-(length:--text-lg) tabular-nums"
      >
        {formatRemaining(remainingMs)}
      </span>
    </header>
  );
}

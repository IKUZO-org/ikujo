// 상단 고정 바 (spec §2 공통 틀, PRD §13, DESIGN.md §6 TopBar): 높이 52px + 위 안전 영역, 3칸.
// 왼쪽: 설정(S-13) 아이콘과 사건 제목, 가운데: 지금 단계, 오른쪽: 남은 시간.
// 사건 제목 자리는 spec/PRD(상단 바)와 DESIGN.md(등장인물 보기 안)가 다르다. docs 를 따라 상단 바에 둔다 (CLAUDE.md §2).
// 등장인물 보기 아이콘은 #73(설정) 범위 밖이라 두지 않았다
import { Timer } from "@/components/game";
import { SettingsButton } from "@/components/settings";
import { phaseLabel } from "@/lib/phase-label";

export function PhaseBar({
  title,
  phase,
  remainingMs,
  talking = false,
  dead = false,
}: {
  title: string;
  phase: string | null;
  remainingMs: number | null;
  /** 모두 준비 완료를 누르고 토스트가 사라졌는지. 라운드 문구가 "토론 중"으로 바뀐다 (#138) */
  talking?: boolean;
  /** r2 부터 희생자 폰(유령 모드). 라운드 문구가 "사망" (QA #136) */
  dead?: boolean;
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
          {phaseLabel(phase, { talking, dead })}
        </h1>
        <span className="flex justify-end">
          <Timer ms={remainingMs} label="남은 시간" />
        </span>
      </div>
    </header>
  );
}

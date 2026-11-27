// 화면 틀 (DESIGN.md §2, §3): 100dvh, 안전 영역, 주요 버튼은 아래 고정
import type { ReactNode } from "react";
import { SettingsButton } from "@/components/settings";

// top: 위에 붙는 바 (진행 중 상단 바). 있으면 노치 여백은 바가 넣고, 바와 내용이 한 화면(dvh) 안에 든다.
// 없으면 설정 아이콘만 있는 바를 둔다: 설정은 어느 화면에서나 연다 (PRD §12, S-13)
export function Screen({
  children,
  bottom,
  top,
}: {
  children: ReactNode;
  bottom?: ReactNode;
  top?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-(--color-bg) text-(--color-text)">
      {top ?? (
        <header className="shrink-0 pt-[env(safe-area-inset-top)]">
          <div className="flex h-13 items-center px-(--space-4)">
            <SettingsButton />
          </div>
        </header>
      )}
      <main className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) py-(--space-6)">
        {children}
      </main>
      {bottom && (
        <div className="sticky bottom-0 flex flex-col gap-2 bg-(--color-bg) px-(--space-4) pt-(--space-3) pb-[max(env(safe-area-inset-bottom),var(--space-4))]">
          {bottom}
        </div>
      )}
    </div>
  );
}

/** 한 줄 안내 (오류). 화면 읽기 프로그램이 바로 읽게 role=alert */
export function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-(length:--text-md) text-(--color-danger)">
      {message}
    </p>
  );
}

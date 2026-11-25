// 화면 틀 (DESIGN.md §2, §3): 100dvh, 안전 영역, 주요 버튼은 아래 고정
import type { ReactNode } from "react";

export function Screen({ children, bottom }: { children: ReactNode; bottom?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-(--color-bg) pt-[env(safe-area-inset-top)] text-(--color-text)">
      <main className="flex flex-1 flex-col gap-(--space-4) px-(--space-4) py-(--space-6)">{children}</main>
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

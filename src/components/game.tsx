// 게임 화면 조각 (DESIGN.md §3, §4, §6): 화면 틀, 개인 화면 표시, 타이머, 탭, 카드, 가리기, 뱃지.
// 색, 글자, 간격은 토큰 이름만 쓴다 (§5). 넓은 화면 분기 없음 (§2)
"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./Button";

// 화면 틀 -----------------------------------------------------------------------

/**
 * 게임 화면 틀 (§3): [나만 보기 띠] 상단 바 / 그래픽 영역(남는 높이) / 가운데 정렬 글 / 아래 고정 버튼.
 * 그래픽 영역은 어셋이 없으면 검정 그대로 둔다 (PRD §24). 글은 그래픽 위에 겹치지 않는다.
 * isPrivate: 개인(비밀) 화면 표시. 5px 테두리 + 맨 위 "나만 보기" 띠 (§4). 범인에게도 같은 모양
 */
export function GameScreen({
  top,
  graphic,
  children,
  bottom,
  isPrivate = false,
}: {
  top?: ReactNode;
  graphic?: ReactNode;
  children: ReactNode;
  bottom?: ReactNode;
  isPrivate?: boolean;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-(--color-bg) text-(--color-text)">
      {isPrivate && <PrivateBand />}
      {top}
      {/* 상단 바는 그대로 두고 본문과 버튼만 살짝 나타난다 (QA #136) */}
      <main className="screen-enter flex flex-1 flex-col px-(--space-4)">
        <div
          aria-hidden={graphic ? undefined : true}
          className="flex min-h-24 flex-1 bg-(--color-bg)"
        >
          {graphic}
        </div>
        <div className="flex flex-col items-center gap-(--space-2) pt-(--space-4) pb-(--space-3) text-center">
          {children}
        </div>
      </main>
      {bottom && (
        <div className="screen-enter sticky bottom-0 flex flex-col gap-(--space-2) bg-(--color-bg) px-(--space-4) pt-(--space-3) pb-[max(env(safe-area-inset-bottom),var(--space-4))]">
          {bottom}
        </div>
      )}
      {isPrivate && (
        // 화면 가장자리 테두리. 누르는 것을 막지 않게 pointer-events-none
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-[5px] border-(--color-private-bg)"
        />
      )}
    </div>
  );
}

function PrivateBand() {
  return (
    <div className="flex h-[calc(34px+env(safe-area-inset-top))] shrink-0 items-end justify-center bg-(--color-private-bg) pb-(--space-2) text-(length:--text-sm) font-bold text-(--color-text)">
      <span className="flex items-center gap-(--space-1)">
        <EyeIcon size={16} />
        나만 보기
      </span>
    </div>
  );
}

// 타이머 ------------------------------------------------------------------------

/** 분:초 알약 (§6 Timer). 60초 남으면 레드 면 */
export function Timer({ ms, label }: { ms: number | null; label: string }) {
  if (ms === null) return null;
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const text = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  const ending = total <= 60;
  return (
    <span
      role="timer"
      aria-label={`${label} ${Math.floor(total / 60)}분 ${total % 60}초`}
      className={`inline-flex h-8 items-center rounded-(--radius-full) border-[1.5px] px-(--space-3) text-(length:--text-md) font-bold tabular-nums ${
        ending
          ? "border-(--color-primary) bg-(--color-primary) text-(--color-text)"
          : "border-(--color-text) text-(--color-text)"
      }`}
    >
      {text}
    </span>
  );
}

// 탭 ---------------------------------------------------------------------------

/** 두 칸 같은 폭 탭 (§6 Tabs). dot: 새 단서 점 (점 + 글로 알림, §7) */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; dot?: boolean }[];
}) {
  return (
    <div role="tablist" className="grid grid-cols-2 gap-(--space-2)">
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.value)}
            className={`flex min-h-11 items-center justify-center gap-(--space-2) rounded-(--radius-sm) border-[1.5px] text-(length:--text-md) font-bold transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text) ${
              on
                ? "border-(--color-text) text-(--color-text)"
                : "border-(--color-border) text-(--color-text-muted)"
            }`}
          >
            {it.label}
            {it.dot && (
              <>
                <span
                  aria-hidden
                  className="size-[7px] rounded-(--radius-full) bg-(--color-primary)"
                />
                <span className="sr-only">새 단서</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

// 카드, 뱃지, 이름표 -----------------------------------------------------------------

/** 지난 단서 목록 한 줄 (§6 Card) */
export function Card({ children }: { children: ReactNode }) {
  return (
    <li className="w-full rounded-(--radius-sm) bg-(--color-surface) p-(--space-3) text-center text-(length:--text-md)">
      {children}
    </li>
  );
}

/** "새 단서" 표시: 레드 알약 (§6 화면 안에서 같이 쓰는 모양) */
export function NewBadge() {
  return (
    <span className="rounded-(--radius-full) bg-(--color-primary) px-(--space-2) py-0.5 text-(length:--text-sm) font-bold text-(--color-text)">
      새 단서
    </span>
  );
}

/** 이름표 칩: 비밀, 알리바이처럼 한 줄 앞에 붙는 이름 */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-(--radius-full) border-[1.2px] border-(--color-text) px-(--space-2) py-0.5 text-(length:--text-sm) font-bold">
      {children}
    </span>
  );
}

/**
 * 잠깐 떴다 사라지는 알림 (§6 Toast 모양): surface 면, radius-md, text-md, shadow-overlay.
 * 자리: §6 은 "상단 바 바로 아래"지만, 라운드의 "이제 이야기를 나눠 보세요"는 요청에 따라 주요 버튼 바로 위에 띄운다 (#138).
 * 부르는 쪽의 relative 상자 위쪽 바깥에 겹쳐 뜬다 (아래 글과 버튼을 밀지 않게).
 * 언제 없앨지는 부르는 쪽이 정한다 (3초). 누르는 것을 막지 않는다
 */
export function Toast({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="screen-enter pointer-events-none absolute inset-x-0 bottom-full z-30 mb-(--space-2) flex justify-center"
    >
      <p className="rounded-(--radius-md) bg-(--color-surface) px-(--space-4) py-(--space-3) text-center text-(length:--text-md) font-bold text-(--color-text) shadow-(--shadow-overlay)">
        {children}
      </p>
    </div>
  );
}

// 시트, 덮는 화면 -------------------------------------------------------------------

/**
 * 아래에서 올라오는 시트 (§6 Sheet). surface 면, 위 모서리 radius-md, shadow-overlay, 뒤는 검게 가림, 손잡이 막대.
 * 뒤를 누르거나 Esc, "닫기" 로 닫는다
 */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-30 flex justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-(--color-bg)/80"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative mt-auto flex w-full max-w-[430px] flex-col gap-(--space-3) rounded-t-(--radius-md) bg-(--color-surface) px-(--space-4) pt-(--space-2) pb-[max(env(safe-area-inset-bottom),var(--space-4))] text-center text-(--color-text) shadow-(--shadow-overlay)"
      >
        <span
          aria-hidden
          className="mx-auto h-1 w-10 rounded-(--radius-full) bg-(--color-text-muted)"
        />
        <h2 className="text-(length:--text-xl) font-extrabold">{title}</h2>
        {children}
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}

/**
 * 화면 전체를 덮는 연출 (§3 "가상 폰 연출은 화면 전체를 덮고, 닫으면 원래 화면으로", S-14).
 * 게임 속 모양으로 새로 그린다: 실제 방송사, 앱 모양을 따라 하지 않는다 (BR-008).
 * graphic: 그래픽 영역에 넣을 영상, 그림. 없으면 검정 그대로 (PRD §24)
 */
export function Cover({
  label,
  title,
  children,
  graphic,
  action,
  onClose,
}: {
  label: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  graphic?: ReactNode;
  action: string;
  onClose: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
      className="fixed inset-0 z-40 flex justify-center bg-(--color-bg)"
    >
      <div className="flex min-h-dvh w-full max-w-[430px] flex-col px-(--space-4) pt-[env(safe-area-inset-top)] text-(--color-text)">
        <div aria-hidden className="flex min-h-24 flex-1 bg-(--color-bg)">
          {graphic}
        </div>
        <div className="flex flex-col items-center gap-(--space-2) pb-(--space-3) text-center">
          {label}
          <h2 className="text-(length:--text-xl) font-extrabold">{title}</h2>
          {children}
        </div>
        <div className="pt-(--space-3) pb-[max(env(safe-area-inset-bottom),var(--space-4))]">
          <Button autoFocus onClick={onClose}>
            {action}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 가리기 -------------------------------------------------------------------------

/**
 * 개인 내용은 처음에 가려 두고 눌러서 본다 (§4 `제안`, 옆 사람 시선).
 * 가린 상태에서는 그래픽 영역 자리에 눈 아이콘 + "눌러서 보기" (§6 PrivateReveal)
 */
export function usePrivateReveal() {
  const [open, setOpen] = useState(false);
  const hide = () => setOpen(false);
  const cover = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full flex-1 flex-col items-center justify-center gap-(--space-2) text-(length:--text-md) font-bold text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text)"
    >
      <EyeIcon size={24} />
      눌러서 보기
    </button>
  );
  return { open, cover, hide };
}

// 아이콘 -------------------------------------------------------------------------

export function EyeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

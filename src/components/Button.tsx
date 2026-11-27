// DESIGN.md §6 Button: 주요, 보조, 꺼짐(disabled). 토큰 이름만 쓴다 (§5)
// 가로 꽉 참, 높이 52px (누르는 곳 44px 이상, §2). 인원이 있으면 글자 옆에 작게 "3/5"
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  /** 글자 옆 인원 "3/5" */
  count?: { n: number; of: number };
};

export function Button({ variant = "primary", count, className = "", children, ...props }: Props) {
  const look =
    variant === "primary"
      ? "bg-(--color-primary) text-(--color-text) active:brightness-90"
      : "border-[1.5px] border-(--color-text) text-(--color-text) active:bg-(--color-surface)";
  return (
    <button
      type="button"
      className={`flex min-h-13 w-full items-center justify-center gap-(--space-2) rounded-(--radius-sm) px-(--space-4) text-(length:--text-lg) font-extrabold transition-[filter,background-color] duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text) disabled:border-transparent disabled:bg-(--color-surface) disabled:text-(--color-text-muted) disabled:brightness-100 ${look} ${className}`}
      {...props}
    >
      {children}
      {count && (
        <span className="text-(length:--text-sm) font-bold tabular-nums">
          {count.n}/{count.of}
        </span>
      )}
    </button>
  );
}

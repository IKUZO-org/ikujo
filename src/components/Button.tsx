// DESIGN.md §6 Button (주요, 보조). 모양은 상경 확정 전: 토큰 이름만 쓴다 (§5)
// 누르는 곳 44px 이상 (§2)
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const look =
    variant === "primary"
      ? "bg-(--color-primary) text-(--color-bg)"
      : "bg-(--color-surface) text-(--color-text)";
  return (
    <button
      type="button"
      className={`min-h-11 w-full rounded-(--radius-md) px-(--space-4) text-(length:--text-md) disabled:opacity-50 ${look} ${className}`}
      {...props}
    />
  );
}

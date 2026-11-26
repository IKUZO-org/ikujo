"use client";
// S-13 설정 (FR-091): 상단 바 왼쪽 아이콘(DESIGN.md §6 TopBar)에서 Sheet 로 연다. 소리, 진동, 온보딩 다시 보기.
// S-01 온보딩 (FR-002): 처음 연 사람에게 4장, 건너뛰기, 마지막 장에서 시작. 설정에서 다시 본다.
// 값은 모두 이 폰에만 (src/lib/settings.ts)
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/Button";
import { Sheet } from "@/components/game";
import { hasSeenOnboarding, isOn, markOnboardingSeen, setOn, type Toggle } from "@/lib/settings";

export function SettingsButton() {
  const [open, setOpen] = useState<"settings" | "onboarding" | null>(null);
  return (
    <>
      <button
        type="button"
        aria-label="설정"
        onClick={() => setOpen("settings")}
        className="-ml-(--space-3) flex size-11 shrink-0 items-center justify-center text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text)"
      >
        <GearIcon />
      </button>
      {open === "settings" && (
        <SettingsSheet onClose={() => setOpen(null)} onOnboarding={() => setOpen("onboarding")} />
      )}
      {open === "onboarding" && <Onboarding onDone={() => setOpen(null)} />}
    </>
  );
}

function SettingsSheet({
  onClose,
  onOnboarding,
}: {
  onClose: () => void;
  onOnboarding: () => void;
}) {
  return (
    <Sheet title="설정" onClose={onClose}>
      <SwitchRow name="sound" label="소리" />
      <SwitchRow name="vibration" label="진동" />
      <Button variant="secondary" onClick={onOnboarding}>
        온보딩 다시 보기
      </Button>
    </Sheet>
  );
}

function SwitchRow({ name, label }: { name: Toggle; label: string }) {
  const [on, setState] = useState(() => isOn(name));
  function toggle() {
    setOn(name, !on);
    setState(!on);
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className="flex min-h-11 items-center justify-between rounded-(--radius-sm) px-(--space-1) text-(length:--text-lg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text)"
    >
      <span className="font-bold">{label}</span>
      <span className="flex items-center gap-(--space-2) text-(length:--text-md) text-(--color-text-muted)">
        {/* 색만으로 알리지 않는다 (DESIGN.md §7) */}
        {on ? "켜짐" : "꺼짐"}
        <span
          aria-hidden
          className={`flex h-6 w-11 items-center rounded-(--radius-full) p-0.5 transition-colors duration-(--duration-fast) ${on ? "justify-end bg-(--color-primary)" : "justify-start bg-(--color-border)"}`}
        >
          <span className="size-5 rounded-(--radius-full) bg-(--color-text)" />
        </span>
      </span>
    </button>
  );
}

// 글은 PRD §11 한 판 흐름으로 쓴 임시 문구, 그림은 그래픽 규칙(#23) 전이라 그래픽 영역만 비워 둔다 (DESIGN.md §3)
const PAGES = [
  { title: "모여서 하는 추리 게임", body: "4~6명이 한자리에 모여 각자 폰으로 해요" },
  { title: "내 인물 카드는 나만 봐요", body: "비밀과 알리바이를 보고 얼굴 보며 이야기해요" },
  { title: "라운드마다 단서가 와요", body: "세 라운드 동안 단서를 모아 범인을 좁혀요" },
  { title: "범인을 투표로 골라요", body: "투표가 끝나면 진행자가 진실을 풀어 줘요" },
];

const noop = () => () => {};

/** 홈에 들어올 때 처음 연 사람에게만 띄운다 (PRD §12 온보딩 → 홈) */
export function FirstOnboarding() {
  // 서버 그림에서는 본 것으로 두어 처음 그릴 때 깜빡이지 않게 한다
  const seen = useSyncExternalStore(noop, hasSeenOnboarding, () => true);
  const [closed, setClosed] = useState(false);
  if (seen || closed) return null;
  return <Onboarding onDone={() => setClosed(true)} />;
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === PAGES.length - 1;
  const page = PAGES[i];
  function done() {
    markOnboardingSeen();
    onDone();
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="게임 방법"
      className="fixed inset-0 z-40 flex justify-center bg-(--color-bg)"
    >
      <div className="flex min-h-dvh w-full max-w-[430px] flex-col px-(--space-4) pt-[env(safe-area-inset-top)] text-(--color-text)">
        <div className="flex h-13 shrink-0 items-center justify-end">
          {!last && (
            <button
              type="button"
              onClick={done}
              className="-mr-(--space-3) min-h-11 px-(--space-3) text-(length:--text-md) text-(--color-text-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text)"
            >
              건너뛰기
            </button>
          )}
        </div>
        {/* 그래픽 영역: 어셋 전에는 검정 그대로 (DESIGN.md §3) */}
        <div className="flex-1" />
        <div className="flex flex-col items-center gap-(--space-2) text-center">
          <h2 className="text-(length:--text-xl) font-extrabold">{page.title}</h2>
          <p className="text-(length:--text-md) text-(--color-text-muted)">{page.body}</p>
          <p
            aria-label={`${PAGES.length}장 중 ${i + 1}장`}
            className="flex gap-(--space-2) py-(--space-2)"
          >
            {PAGES.map((p, n) => (
              <span
                key={p.title}
                aria-hidden
                className={`size-2 rounded-(--radius-full) ${n === i ? "bg-(--color-text)" : "bg-(--color-border)"}`}
              />
            ))}
          </p>
        </div>
        <div className="pt-(--space-3) pb-[max(env(safe-area-inset-bottom),var(--space-4))]">
          <Button onClick={last ? done : () => setI(i + 1)}>{last ? "시작하기" : "다음"}</Button>
        </div>
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      aria-hidden
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

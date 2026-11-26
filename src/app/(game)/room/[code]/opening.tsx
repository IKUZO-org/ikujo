"use client";
// S-07 오프닝 (FR-021, PRD §11): 방송 예고 → 가상 단톡방 PD 메시지 → 정전 → 발견 내레이션.
// 내용은 PRD §28 사건 개요와 타임라인 중 공개해도 되는 것만 (범인의 행동 21:50, 22:00~22:10 은 넣지 않는다, BR-001).
// TTS 는 OQ-011 미정이라 글로만, 소리와 그림은 자리만 둔다 (PRD §24). 그래픽 영역은 어셋이 오면 채운다.
// "다음"은 각자. 마지막에서 ready(intro). 모두 누르거나 3분이 지나면 서버가 S-08 로 넘긴다 (spec S-07)
import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Chip, GameScreen } from "@/components/game";
import { ErrorLine } from "@/components/Screen";
import { ready } from "@/server/actions/phase";
import type { GameState } from "@/server/rooms/core";

type Beat = { title: string; body: ReactNode };

// 제목은 한 줄(약 15자), 보조는 한두 줄 (DESIGN.md §1, §5)
const BEATS: Beat[] = [
  {
    title: "내일은 결승 생방송",
    body: "상금 10억이 걸린 무인도 서바이벌 「LAST ONE」. 폭풍으로 제작진 배가 섬을 떠난 밤이에요.",
  },
  {
    title: "제작진 단톡방 · 21:30",
    body: (
      <>
        <Chip>PD</Chip>
        <span className="block pt-(--space-2)">
          “내일 생방송에서 전부 말할 거야. 원본은 편집실에 있다.”
        </span>
      </>
    ),
  },
  {
    title: "22:00 섬 전체 정전",
    body: "10분 동안 불이 꺼졌어요. 하나뿐인 위성 전화도 먹통이에요.",
  },
  {
    title: "22:12 PD 발견",
    body: "비상 전원이 켜지고, 편집실에서 쓰러진 PD가 발견됐어요. 범인은 이 안에 있어요.",
  },
];

export function Opening({
  game,
  top,
  reload,
}: {
  game: GameState;
  top: ReactNode;
  reload: () => Promise<void>;
}) {
  const [i, setI] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = game.ready.mine;
  const last = i === BEATS.length - 1;
  const beat = BEATS[done ? BEATS.length - 1 : i];

  function next() {
    if (!last) return setI(i + 1);
    setError(null);
    startTransition(async () => {
      const r = await ready(game.id, "intro");
      if ("error" in r) setError(r.error);
      await reload();
    });
  }

  return (
    <GameScreen
      top={top}
      bottom={
        <>
          <ErrorLine message={error} />
          {done && (
            <p className="text-center text-(length:--text-sm) text-(--color-text-muted)">
              모두 누르면 인물 카드로 넘어가요
            </p>
          )}
          <Button
            onClick={next}
            disabled={pending || done}
            count={last || done ? { n: game.ready.count, of: game.ready.total } : undefined}
          >
            {done ? "기다리는 중" : "다음"}
          </Button>
        </>
      }
    >
      {/* 몇 번째 장면인지: 점 + 글 (색만으로 알리지 않는다, DESIGN.md §7) */}
      <p className="sr-only">
        {BEATS.length}장면 중 {done ? BEATS.length : i + 1}번째
      </p>
      <div aria-hidden className="flex gap-(--space-1) pb-(--space-2)">
        {BEATS.map((b, k) => (
          <span
            key={b.title}
            className={`h-1 w-6 rounded-(--radius-full) ${k <= (done ? BEATS.length - 1 : i) ? "bg-(--color-text)" : "bg-(--color-border)"}`}
          />
        ))}
      </div>
      <h2 aria-live="polite" className="text-(length:--text-xl) font-extrabold">
        {beat.title}
      </h2>
      <div className="text-(length:--text-md) text-(--color-text-muted)">{beat.body}</div>
    </GameScreen>
  );
}

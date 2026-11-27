"use client";
// S-08 인물 카드 (FR-030). 개인 내용은 getMine 결과만으로 그린다 (AC-030).
// 공용: "각자 폰으로 비밀을 확인하세요", 확인 n/N. 개인: 인물, 소개, 비밀, 알리바이, (범인만) 범인 안내.
// 범인 안내도 같은 테두리, 띠, 글자색 (DESIGN.md §4: 색으로 알아채지 않게).
// "확인했어요" → ready(secret). 모두 누르거나 2분 → r1 (서버가 넘긴다)
// 카드를 열면 CH-01 (내 폰만). 범인도 같은 소리, 같은 길이, 같은 때 (sound.md 규칙 4, BR-001)
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Chip, GameScreen, usePrivateReveal } from "@/components/game";
import { ErrorLine } from "@/components/Screen";
import { playSound } from "@/lib/sound";
import { ready } from "@/server/actions/phase";
import type { MineState } from "@/server/reads";
import type { GameState } from "@/server/rooms/core";

export function CharacterCard({
  game,
  mine,
  isHost,
  top,
  reload,
}: {
  game: GameState;
  mine: MineState | null;
  isHost: boolean;
  top: ReactNode;
  reload: () => Promise<void>;
}) {
  const { open, cover } = usePrivateReveal();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = game.ready.mine;
  const shown = open && mine !== null;
  // 누르는 순간에 낸다. 내용(범인 여부)이 오기 전이라 소리로 구별되지 않는다
  useEffect(() => {
    if (open) playSound("ch-01", { isHost });
  }, [open, isHost]);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const r = await ready(game.id, "secret");
      if ("error" in r) setError(r.error);
      await reload();
    });
  }

  return (
    <GameScreen
      isPrivate
      top={top}
      graphic={shown ? undefined : cover}
      bottom={
        <>
          <ErrorLine message={error} />
          <p className="text-center text-(length:--text-sm) text-(--color-text-muted)">
            {done ? "모두 확인하면 라운드 1이 시작돼요" : "각자 폰으로 비밀을 확인하세요"}
          </p>
          <Button
            onClick={confirm}
            disabled={pending || done || !shown}
            count={{ n: game.ready.count, of: game.ready.total }}
          >
            {done ? "확인 완료" : "확인했어요"}
          </Button>
        </>
      }
    >
      {shown ? (
        <>
          <p className="text-(length:--text-md) text-(--color-text-muted)">당신은</p>
          <h2 className="text-(length:--text-2xl) font-extrabold">{mine.character.name}</h2>
          <p className="text-(length:--text-md) text-(--color-text-muted)">
            {mine.character.intro}
          </p>
          <Line label="비밀">{mine.secret}</Line>
          <Line label="알리바이">{mine.alibi}</Line>
          {mine.isCulprit && (
            <p className="pt-(--space-2) text-(length:--text-lg) font-extrabold">
              당신이 범인입니다. 생방송 전까지 들키지 마세요.
            </p>
          )}
        </>
      ) : (
        <h2 className="text-(length:--text-xl) font-extrabold">
          {mine ? "내 인물 카드" : "카드를 불러오는 중"}
        </h2>
      )}
    </GameScreen>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-(--space-1) pt-(--space-2)">
      <Chip>{label}</Chip>
      <p className="text-(length:--text-md)">{children}</p>
    </div>
  );
}

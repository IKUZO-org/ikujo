"use client";
// S-11 투표, 재투표 (FR-060). 공용: 완료 n/N, 남은 시간(상단 바). 개인: 후보 하나 고르고 보내기.
// 공용 정보(getRoomState)에는 완료 인원만 있고 누가 누구를 찍었는지는 없다 (AC-060).
// 보내면 바꿀 수 없다 (S-11). 투표한 뒤 나갔다가 판정 전에 돌아온 사람만 고른 칸이 보이고 바꿀 수 있다 (D-022).
// 모두 투표하거나 시간이 끝나면 서버가 판정한다.
// 인물 그래픽은 그래픽 규칙(#23) 전이라 자리만 두고 이름으로 보여 준다 (PRD §24)
import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { GameScreen } from "@/components/game";
import { ErrorLine } from "@/components/Screen";
import { vote } from "@/server/actions/vote";
import type { GameState, RoomState, VoteState } from "@/server/rooms/core";

export function Vote({
  game,
  vote: v,
  players,
  top,
  reload,
}: {
  game: GameState;
  vote: VoteState;
  players: RoomState["players"];
  top: ReactNode;
  reload: () => Promise<void>;
}) {
  const [picked, setPicked] = useState<string | null>(v.myChangeableTarget);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const name = new Map(players.map((p) => [p.id, p.nickname]));
  const revote = game.phase === "revote";
  // revote 는 동점자만, vote 는 후보 + 흐린 유령 칸 (DESIGN.md §6 투표 칸)
  const tiles = [
    ...v.candidates.map((id) => ({ id, ghost: false })),
    ...(revote || !game.ghost ? [] : [{ id: game.ghost.playerId, ghost: true }]),
  ];
  const changing = v.myChangeableTarget !== null;
  const locked = !v.canVote || (v.voted && !changing);

  function send() {
    if (!picked) return;
    setError(null);
    startTransition(async () => {
      const r = await vote(game.id, picked);
      if ("error" in r) setError(r.error);
      await reload();
    });
  }

  const guide = !v.canVote
    ? "유령은 투표하지 않아요"
    : changing
      ? "돌아왔어요. 원하면 다른 사람으로 바꿀 수 있어요"
      : v.voted
        ? "모두 투표하면 결과가 나와요"
        : revote
          ? "동점이에요. 동점인 사람 중 한 명을 다시 골라 주세요"
          : "범인이라고 생각하는 사람을 골라 주세요";

  return (
    <GameScreen
      isPrivate={v.canVote}
      top={top}
      bottom={
        <>
          <ErrorLine message={error} />
          {!locked && (
            <p className="text-center text-(length:--text-sm) text-(--color-text-muted)">
              {changing ? "바꾸지 않으면 고른 표가 그대로 들어가요" : "보내면 바꿀 수 없어요"}
            </p>
          )}
          <Button
            onClick={send}
            disabled={pending || locked || !picked || picked === v.myChangeableTarget}
            count={{ n: v.count, of: v.total }}
          >
            {changing ? "투표 바꾸기" : v.voted ? "투표 완료" : "투표"}
          </Button>
        </>
      }
    >
      <h2 className="text-(length:--text-xl) font-extrabold">{revote ? "재투표" : "투표"}</h2>
      <p className="text-(length:--text-md) text-(--color-text-muted)">
        완료 {v.count}/{v.total}
      </p>
      <p className="text-(length:--text-md)">{guide}</p>
      <ul className="grid w-full grid-cols-2 gap-(--space-2) pt-(--space-2)">
        {tiles.map(({ id, ghost }) => {
          const on = picked === id;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={ghost || locked || pending}
                onClick={() => setPicked(id)}
                className={`relative flex min-h-11 w-full flex-col items-center gap-(--space-2) rounded-(--radius-sm) border-[2.5px] p-(--space-2) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text) ${
                  on ? "border-(--color-primary)" : "border-transparent"
                } ${ghost ? "opacity-35" : ""}`}
              >
                {/* 인물 그래픽 자리 (#23 전) */}
                <span
                  aria-hidden
                  className="aspect-square w-full rounded-(--radius-sm) bg-(--color-surface)"
                />
                <span className="text-(length:--text-md) font-bold">
                  {name.get(id) ?? ""}
                  {ghost && <span className="text-(--color-text-muted)"> 유령</span>}
                </span>
                {on && <CheckCircle />}
              </button>
            </li>
          );
        })}
      </ul>
    </GameScreen>
  );
}

function CheckCircle() {
  return (
    <span
      aria-hidden
      className="absolute top-(--space-1) right-(--space-1) flex size-6 items-center justify-center rounded-(--radius-full) bg-(--color-primary) text-(--color-text)"
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5 9-10" />
      </svg>
    </span>
  );
}

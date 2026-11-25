"use client";
// 방 화면. 서버의 상태(getRoomState)를 따라 그린다 (ARCHITECTURE.md §2-1).
// 읽기와 room:{id} 신호 구독은 useRoomState 가 한다. 신호에는 비밀이 없다 (data §5)
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { ErrorLine, Screen } from "@/components/Screen";
import { useRoomState } from "@/lib/use-room-state";
import { leaveRoom } from "@/server/actions/leave-room";
import { startGame } from "@/server/actions/start-game";
import type { RoomState } from "@/server/rooms/core";
import { PhaseBar } from "./phase-bar";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 6;

export function RoomView({ title }: { title: string }) {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { state, error: loadError, reload: load, remainingMs } = useRoomState(code);

  if (loadError) {
    return (
      <Screen
        bottom={
          <Link href="/" className="flex min-h-11 items-center justify-center">
            홈으로
          </Link>
        }
      >
        <ErrorLine message={loadError} />
      </Screen>
    );
  }
  if (!state) return <Screen>{null}</Screen>;

  if (state.status === "lobby")
    return <Lobby state={state} onLeft={() => router.push("/")} reload={load} />;

  // 다음 단계 화면(S-06~)은 단계 5, 7에서. 지금은 진행 중임만 보여 준다
  return (
    <>
      <PhaseBar title={title} phase={state.game?.phase ?? null} remainingMs={remainingMs} />
      <Screen>
        <p className="text-(length:--text-lg)">진행자가 사건을 준비하고 있어요</p>
      </Screen>
    </>
  );
}

// S-05 대기실 (FR-012, FR-013) -----------------------------------------------------

function Lobby({
  state,
  onLeft,
  reload,
}: {
  state: RoomState;
  onLeft: () => void;
  reload: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const count = state.players.length;
  const canStart = count >= MIN_PLAYERS; // AC-012

  async function copy() {
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function start() {
    setError(null);
    startTransition(async () => {
      const r = await startGame({ roomId: state.roomId });
      if ("error" in r) setError(r.error);
      await reload();
    });
  }

  function leave() {
    setError(null);
    startTransition(async () => {
      const r = await leaveRoom({ roomId: state.roomId });
      if ("error" in r) return setError(r.error);
      onLeft();
    });
  }

  return (
    <Screen
      bottom={
        <>
          {state.me.isHost && (
            <>
              <Button onClick={start} disabled={pending || !canStart}>
                시작
              </Button>
              {!canStart && (
                <p className="text-center text-(length:--text-sm) text-(--color-text-muted)">
                  {MIN_PLAYERS}명부터 시작해요
                </p>
              )}
            </>
          )}
          <Button variant="secondary" onClick={leave} disabled={pending}>
            나가기
          </Button>
        </>
      }
    >
      <button
        type="button"
        onClick={copy}
        aria-label={`방 코드 ${state.code} 복사`}
        className="flex min-h-11 flex-col items-center gap-(--space-1) rounded-(--radius-md) bg-(--color-surface) py-(--space-4)"
      >
        <span className="text-(length:--text-sm) text-(--color-text-muted)">방 코드</span>
        <span className="text-(length:--text-xl) tracking-[0.3em]">{state.code}</span>
        <span aria-live="polite" className="text-(length:--text-sm) text-(--color-text-muted)">
          {copied ? "복사했어요" : "눌러서 복사"}
        </span>
      </button>

      <h2 className="text-(length:--text-lg)">
        참가자 {count}/{MAX_PLAYERS}
      </h2>
      <ul className="flex flex-col gap-(--space-2)">
        {state.players.map((p) => (
          <li
            key={p.id}
            className="flex min-h-11 items-center justify-between rounded-(--radius-md) bg-(--color-surface) px-(--space-3) text-(length:--text-md)"
          >
            <span>
              {p.nickname}
              {p.id === state.me.playerId && (
                <span className="text-(--color-text-muted)"> (나)</span>
              )}
            </span>
            {p.isHost && (
              <span className="text-(length:--text-sm) text-(--color-text-muted)">방장</span>
            )}
          </li>
        ))}
      </ul>
      <ErrorLine message={error} />
    </Screen>
  );
}

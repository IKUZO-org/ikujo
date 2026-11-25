"use client";
// 방 화면. 서버의 상태(getRoomState)를 따라 그린다 (ARCHITECTURE.md §2-1).
// 실시간 room:{id} 신호를 받으면 다시 읽는다. 신호에는 비밀이 없다 (data §5)
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { ErrorLine, Screen } from "@/components/Screen";
import { roomChannel, SIGNAL_EVENT } from "@/lib/realtime";
import { createClient } from "@/lib/supabase/client";
import { getRoomState } from "@/server/actions/get-room-state";
import { leaveRoom } from "@/server/actions/leave-room";
import { startGame } from "@/server/actions/start-game";
import type { RoomState } from "@/server/rooms/core";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 6;

export function RoomView() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [state, setState] = useState<RoomState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const apply = useCallback((r: Awaited<ReturnType<typeof getRoomState>>) => {
    if ("error" in r) setLoadError(r.error);
    else {
      setLoadError(null);
      setState(r.state);
    }
  }, []);
  const load = useCallback(() => getRoomState({ code }).then(apply), [code, apply]);

  // 화면을 열 때 읽는다 (NFR-002)
  useEffect(() => {
    let alive = true;
    getRoomState({ code }).then((r) => alive && apply(r));
    return () => {
      alive = false;
    };
  }, [code, apply]);

  // 신호를 받을 때 다시 읽는다 (NFR-001)
  const roomId = state?.roomId;
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(roomChannel(roomId))
      .on("broadcast", { event: SIGNAL_EVENT }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, load]);

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
    <Screen>
      <p className="text-(length:--text-lg)">진행자가 사건을 준비하고 있어요</p>
    </Screen>
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

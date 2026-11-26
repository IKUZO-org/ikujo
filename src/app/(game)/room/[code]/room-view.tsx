"use client";
// 방 화면. 서버의 상태(getRoomState)를 따라 그린다 (ARCHITECTURE.md §2-1).
// 단계(games.phase)에 따라 S-05 대기실, S-06 배정 중, S-07 오프닝, S-08 인물 카드, S-09 라운드, S-11 투표.
// 개인 내용(내 인물, 비밀, 단서)은 getMine 으로만 받는다 (ARCHITECTURE.md §2-3, AC-030).
// 읽기와 room:{id} 신호 구독은 useRoomState 가 한다. 신호에는 비밀이 없다 (data §5)
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { GameScreen } from "@/components/game";
import { ErrorLine, Screen } from "@/components/Screen";
import { useMine } from "@/lib/use-mine";
import { useRoomState } from "@/lib/use-room-state";
import { leaveRoom } from "@/server/actions/leave-room";
import { startGame } from "@/server/actions/start-game";
import type { RoomState } from "@/server/rooms/core";
import { CharacterCard } from "./character-card";
import { Opening } from "./opening";
import { PHASE_LABELS, PhaseBar } from "./phase-bar";
import { Round } from "./round";
import { Vote } from "./vote";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 6;

export function RoomView({ title }: { title: string }) {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { state, error: loadError, reload: load, remainingMs } = useRoomState(code);
  const game = state?.status === "lobby" ? null : (state?.game ?? null);
  const mine = useMine(game && game.phase !== "intro" ? game.id : null, state);

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

  const top = <PhaseBar title={title} phase={game?.phase ?? null} remainingMs={remainingMs} />;

  // S-06 배정 중: 방은 시작했는데 판이 아직 없다 (AI 배정 중, FR-020)
  if (!game) return <Assigning top={top} />;

  switch (game.phase) {
    case "intro":
      return <Opening key={game.id} game={game} top={top} reload={load} />;
    case "secret":
      return <CharacterCard key={game.id} game={game} mine={mine} top={top} reload={load} />;
    case "r1":
    case "r2":
    case "r3":
      // TODO(단계 8): r2 부터 희생자 폰은 유령 모드(S-10)
      return game.round ? (
        <Round
          // 라운드마다 새로 그린다: 탭, 가리기, 오류가 다음 라운드로 넘어가지 않게 (#44)
          key={`${game.id}:${game.phase}`}
          game={{ ...game, round: game.round }}
          mine={mine}
          top={top}
          reload={load}
        />
      ) : null;
    case "vote":
    case "revote":
      return game.vote ? (
        <Vote
          // 재투표는 새로 그린다: vote 때 고른 칸이 남지 않게
          key={`${game.id}:${game.phase}`}
          game={game}
          vote={game.vote}
          players={state.players}
          top={top}
          reload={load}
        />
      ) : null;
    default:
      // 해설 화면(S-12)은 #47 에서 만든다. 그 전까지 reveal 은 자리만 둔다
      return (
        <GameScreen top={top}>
          <h2 className="text-(length:--text-xl) font-extrabold">
            {PHASE_LABELS[game.phase] ?? ""}
          </h2>
          <p className="text-(length:--text-md) text-(--color-text-muted)">
            다음 화면을 준비하고 있어요
          </p>
        </GameScreen>
      );
  }
}

// S-06 배정 중 (FR-020, NFR-003) ------------------------------------------------------
// 15초 넘으면 "조금만 더 기다려 주세요". 그 사이 서버는 규칙 배정으로 바꾼다 (startGame)

const SLOW_MS = 15_000;

function Assigning({ top }: { top: ReactNode }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <GameScreen top={top}>
      <h2 aria-live="polite" className="text-(length:--text-xl) font-extrabold">
        진행자가 사건을 준비하고 있어요
      </h2>
      {slow && (
        <p className="text-(length:--text-md) text-(--color-text-muted)">조금만 더 기다려 주세요</p>
      )}
    </GameScreen>
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

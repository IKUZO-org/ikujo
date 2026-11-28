"use client";
// S-10 유령 모드 (FR-050~053). 희생자 폰은 r2, r3 동안 라운드 화면 대신 이 화면.
// 개인 화면: 범인의 흐릿한 특징(getMine, 유령 본인만) + 속삭이기 + 출몰하기 (DESIGN.md §4 나만 보기, 가리기).
// 속삭임은 라운드당 1번 (OQ-005 임시 결정, spec §9), 출몰은 판에 1번 (AC-053). 막는 것은 서버가 한다.
// 유령은 준비 완료를 누르지 않는다: 라운드는 타이머로만 넘어간다 (OQ-007)
import { useCallback, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Chip, GameScreen, Sheet, usePrivateReveal } from "@/components/game";
import { ErrorLine } from "@/components/Screen";
import { haunt, whisper } from "@/server/actions/ghost";
import type { MineState } from "@/server/reads";
import type { GameState, RoomState } from "@/server/rooms/core";

const MAX_BODY = 80; // spec S-10 `제안` 1~80자

type Open = "whisper" | "haunt" | null;

export function Ghost({
  game,
  players,
  mine,
  top,
  reload,
}: {
  game: GameState;
  players: RoomState["players"];
  mine: MineState | null;
  top: ReactNode;
  reload: (since?: number) => Promise<void>;
}) {
  const reveal = usePrivateReveal();
  const [open, setOpen] = useState<Open>(null);
  const close = useCallback(() => setOpen(null), []);
  const ghost = mine?.ghost ?? null;
  const shown = reveal.open && ghost !== null;
  const whispered = ghost?.whisperedThisRound ?? false;
  const haunted = game.haunt !== null;
  // 살아 있는 사람: 나가지 않았고 유령이 아님 (spec §4 "대상 생존")
  const alive = players.filter((p) => !p.left && p.id !== game.ghost?.playerId);

  return (
    <GameScreen
      isPrivate
      top={top}
      graphic={shown ? undefined : reveal.cover}
      bottom={
        <>
          {whispered && (
            <p className="text-center text-(length:--text-sm) text-(--color-text-muted)">
              이번 라운드에는 이미 속삭였어요
            </p>
          )}
          <Button onClick={() => setOpen("whisper")} disabled={!ghost || whispered}>
            속삭이기
          </Button>
          {haunted && (
            <p className="text-center text-(length:--text-sm) text-(--color-text-muted)">
              출몰은 이미 했어요
            </p>
          )}
          <Button variant="secondary" onClick={() => setOpen("haunt")} disabled={!ghost || haunted}>
            출몰하기
          </Button>
        </>
      }
    >
      {shown ? (
        <>
          <p className="text-(length:--text-md) text-(--color-text-muted)">당신은 유령이에요</p>
          <Chip>정전 때 복도에서 스친 사람</Chip>
          <h2 className="text-(length:--text-xl) font-extrabold">{ghost.trait}</h2>
          <p className="text-(length:--text-md) text-(--color-text-muted)">
            범인만의 특징은 아니에요. 이 판의 두 명 이상에게 있어요
          </p>
        </>
      ) : (
        <h2 className="text-(length:--text-xl) font-extrabold">
          {ghost ? "유령 모드" : "불러오는 중"}
        </h2>
      )}

      {open === "whisper" && (
        <WhisperSheet gameId={game.id} alive={alive} onClose={close} reload={reload} />
      )}
      {open === "haunt" && <HauntSheet gameId={game.id} onClose={close} reload={reload} />}
    </GameScreen>
  );
}

// 속삭이기: 살아 있는 한 명 + 글 (FR-052) ------------------------------------------------

function WhisperSheet({
  gameId,
  alive,
  onClose,
  reload,
}: {
  gameId: string;
  alive: RoomState["players"];
  onClose: () => void;
  reload: (since?: number) => Promise<void>;
}) {
  const [to, setTo] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    if (!to) return;
    setError(null);
    startTransition(async () => {
      const since = performance.now();
      const r = await whisper({ gameId, toPlayerId: to, body });
      if ("error" in r) return setError(r.error);
      await reload(since);
      onClose();
    });
  }

  return (
    <Sheet title="누구에게 속삭일까요?" onClose={onClose}>
      <p className="text-(length:--text-sm) text-(--color-text-muted)">
        그 사람만 볼 수 있어요. 라운드마다 한 번
      </p>
      <div role="radiogroup" aria-label="받을 사람" className="grid grid-cols-2 gap-(--space-2)">
        {alive.map((p) => {
          const on = p.id === to;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTo(p.id)}
              className={`min-h-11 truncate rounded-(--radius-sm) px-(--space-2) text-(length:--text-md) font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text) ${
                on
                  ? "border-[2.5px] border-(--color-primary) text-(--color-text)"
                  : "border-[1.5px] border-(--color-border) text-(--color-text-muted)"
              }`}
            >
              {p.nickname}
            </button>
          );
        })}
      </div>
      <BodyField label="속삭일 말" value={body} onChange={setBody} />
      <ErrorLine message={error} />
      <Button onClick={send} disabled={pending || !to || body.trim() === ""}>
        속삭이기
      </Button>
    </Sheet>
  );
}

// 출몰하기: 모든 폰에 "생방송 연결" + 유령의 말 (FR-053) -----------------------------------

function HauntSheet({
  gameId,
  onClose,
  reload,
}: {
  gameId: string;
  onClose: () => void;
  reload: (since?: number) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setError(null);
    startTransition(async () => {
      const since = performance.now();
      const r = await haunt({ gameId, body });
      if ("error" in r) return setError(r.error);
      await reload(since);
      onClose();
    });
  }

  return (
    <Sheet title="모두에게 출몰하기" onClose={onClose}>
      <p className="text-(length:--text-sm) text-(--color-text-muted)">
        모든 폰에 내 말이 떠요. 판에 한 번만 쓸 수 있어요
      </p>
      <BodyField label="유령의 말" value={body} onChange={setBody} />
      <ErrorLine message={error} />
      <Button onClick={send} disabled={pending || body.trim() === ""}>
        생방송 연결하기
      </Button>
    </Sheet>
  );
}

function BodyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-(--space-1) text-left">
      <span className="text-(length:--text-sm) font-bold">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_BODY}
        rows={2}
        className="w-full resize-none rounded-(--radius-sm) border-[1.5px] border-(--color-text-muted) bg-(--color-bg) p-(--space-3) text-(length:--text-lg) text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-text)"
      />
      <span className="self-end text-(length:--text-sm) text-(--color-text-muted) tabular-nums">
        {value.length}/{MAX_BODY}
      </span>
    </label>
  );
}

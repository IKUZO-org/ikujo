"use client";
// S-07 오프닝 (FR-021, PRD §11): 방송 예고 → 가상 단톡방 PD 메시지 → 정전 → 발견 내레이션.
// 내용은 PRD §28 사건 개요와 타임라인 중 공개해도 되는 것만 (범인의 행동 21:50, 22:00~22:10 은 넣지 않는다, BR-001).
// TTS 는 쓰지 않는다(D-024): 글로만. 그래픽 영역에는 오프닝 영상 V-01 을 튼다 (FR-081, #101).
// 영상이 없거나 못 틀어도 글만으로 진행된다 (PRD §24).
// "다음"은 각자. 마지막에서 ready(intro). 모두 누르거나 3분이 지나면 서버가 S-08 로 넘긴다 (spec S-07)
// 영상과 장면(점, 글)은 같이 간다 (#141): 영상이 흐르면 컷 시각에 맞춰 장면이 넘어가고, "다음"을 먼저 누르면 영상이 그 장면으로 건너뛴다
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Chip, GameScreen } from "@/components/game";
import { GameVideo } from "@/components/GameVideo";
import { ErrorLine } from "@/components/Screen";
import { playSound } from "@/lib/sound";
import { beatAt, OPENING_BEAT_STARTS } from "@/lib/opening-beats";
import { readItem } from "@/lib/session-item";
import { markOpeningDone, playedKey } from "@/lib/video";
import { ready } from "@/server/actions/phase";
import type { GameState } from "@/server/rooms/core";

type Beat = { title: string; body: ReactNode };

// V-01 뒤 소리 (sound.md 1.1): OP-08 스팅(2초) 다음에 OP-04 알림음과 OP-02 BGM. 못 틀면 OP-05(2초) 다음에 OP-02
const AFTER_STING_MS = 2000;

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
  isHost,
  top,
  reload,
}: {
  game: GameState;
  isHost: boolean;
  top: ReactNode;
  reload: (since?: number) => Promise<void>;
}) {
  // 영상을 이미 끝까지 본 뒤 새로 고쳤으면 영상은 마지막 장면에 멈춰 있으므로 글도 마지막 장면부터 (#141).
  // 방 화면은 방 상태를 읽은 뒤 브라우저에서만 그려져서 처음부터 저장소를 읽어도 된다 (GameVideo 와 같음)
  const [i, setI] = useState(() =>
    readItem(playedKey(game.id, "v-01")) !== null ? BEATS.length - 1 : 0,
  );
  // "다음"으로 넘긴 장면의 영상 시각. 영상도 그 장면으로 건너뛴다 (#141)
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = game.ready.mine;
  const last = i === BEATS.length - 1;
  const beat = BEATS[done ? BEATS.length - 1 : i];

  // 영상이 흐르면 장면 점과 글도 V-01 컷 시각에 맞춰 넘어간다 (#141). 뒤로는 돌아가지 않는다
  function onVideoTime(seconds: number) {
    const at = beatAt(seconds);
    setI((cur) => Math.max(cur, at));
  }

  function next() {
    if (!last) {
      // 영상을 못 틀었거나 이미 봤으면 GameVideo 가 건너뛰기를 무시하고, 글만 넘어간다 (PRD §24)
      setSeekTo(OPENING_BEAT_STARTS[i + 1]);
      return setI(i + 1);
    }
    setError(null);
    startTransition(async () => {
      const since = performance.now();
      const r = await ready(game.id, "intro");
      if ("error" in r) setError(r.error);
      await reload(since);
    });
  }

  // 소리 (sound.md 1.1, 모두 방장 폰만. SOUND_TARGET 표가 정한다):
  // - V-01 이 나오는 동안 OP-05(정전), OP-06(폭풍, 파도), OP-02(BGM)는 내지 않는다. 영상 안 소리를 쓴다
  // - 영상이 끝나면 OP-08(긴장 스팅) → OP-04(메신저 알림음). 그때부터 OP-02 (markOpeningDone → use-room-sound)
  // - 영상을 못 틀면 op-05.mp3 를 대신 내고, 그 뒤 OP-02
  // 화면이 사라지면(인물 카드로 넘어감) 아직 안 낸 소리는 내지 않는다. 인물 카드에서는 단계 소리가 OP-02 를 깐다
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // 영상을 이미 끝까지 본 뒤 새로 고쳤으면 기다리지 않고 OP-02 로
    if (readItem(playedKey(game.id, "v-01")) !== null) markOpeningDone(game.id);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [game.id]);
  function videoDone(how: "ended" | "skipped") {
    playSound(how === "ended" ? "op-08" : "op-05", { isHost });
    timer.current = setTimeout(() => {
      if (how === "ended") playSound("op-04", { isHost });
      markOpeningDone(game.id);
    }, AFTER_STING_MS);
  }

  return (
    <GameScreen
      top={top}
      graphic={
        <GameVideo
          id="v-01"
          gameId={game.id}
          isHost={isHost}
          onEnded={videoDone}
          onTime={onVideoTime}
          seekTo={seekTo}
        />
      }
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

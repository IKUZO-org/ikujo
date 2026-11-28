"use client";
// S-09 라운드 (FR-040~043). 공용 / 내 것 두 탭 (spec §2).
// 공용 탭: 라운드 n/3, 장소와 시점, 이번 공용 단서, 지금까지 공용 단서, 준비 완료 n/N (getRoomState).
// 내 것 탭: 나에게만 온 단서 (getMine). 개인 화면 표시 + 가리기 (DESIGN.md §4).
// 새로 고쳐도 고른 탭은 그대로, 개인 내용은 다시 가린다 (#44).
// 새 개인 단서가 오면 내 것 탭에 점 + 진동 (NFR-006, 설정 S-13 에서 끄면 점만). 진동만으로 알리지 않는다 (DESIGN.md §7).
// 준비 완료는 현황에만 반영하고, 다음 라운드는 타이머로만 넘어간다 (OQ-007 임시 결정, spec §9).
// 이벤트 알림(FR-044, S-14 덮는 화면)은 단계 8, 9 에서 붙인다.
// 공용 탭 그래픽 영역: R2 편집본 V-02, R3 원본 V-03 (FR-081, PRD §28.9, #101). 소리는 방장 폰만.
// 소리 (sound.md 라운드 공통, #110): 속삭임 GH-03 은 받은 폰만, 새 공용 단서 RD-03 은 방장 폰만.
// 새 개인 단서 RD-02 는 내지 않는다 (보류, PO 확인): 범인을 가리키는 단서는 범인에게 가지 않아(assign.ts)
// 범인 폰이 라운드 시작 때 조용할 때가 많고, 소리는 옆 사람도 들어 범인이 드러날 수 있다 (BR-001, sound.md 규칙 4)
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Card, Chip, GameScreen, NewBadge, Tabs, usePrivateReveal } from "@/components/game";
import { GameVideo } from "@/components/GameVideo";
import { ErrorLine } from "@/components/Screen";
import { readItem, writeItem } from "@/lib/session-item";
import { vibrate } from "@/lib/settings";
import { playSound } from "@/lib/sound";
import { ready } from "@/server/actions/phase";
import type { MineState } from "@/server/reads";
import type { GameState } from "@/server/rooms/core";
import type { VideoId } from "@/lib/video";

// 라운드 영상. R1 숙소 거실은 영상이 없다 (video PLAN.md §1)
const ROUND_VIDEO: Partial<Record<GameState["phase"], VideoId>> = { r2: "v-02", r3: "v-03" };

// 공용 단서는 라운드가 시작될 때 열린다. 시작 전환음(RD-05 → RD-01 → R2-01/R3-01, 약 4초)이 끝난 뒤 RD-03 을 낸다
const PUBLIC_CLUE_SOUND_MS = 4000;

type Tab = "public" | "mine";
type Clue = { id: string; round: number; text: string };
export type RoundGame = GameState & { round: NonNullable<GameState["round"]> };

export function Round({
  game,
  mine,
  isHost,
  videoReady = true,
  top,
  reload,
}: {
  game: RoundGame;
  mine: MineState | null;
  isHost: boolean;
  /** false 면 라운드 영상을 아직 틀지 않는다 (덮는 화면이 떠 있음) */
  videoReady?: boolean;
  top: ReactNode;
  reload: (since?: number) => Promise<void>;
}) {
  // 고른 탭은 이 판, 이 라운드 동안 기억한다: 새로 고쳐도 그 탭으로 (AC-NFR-002, #44).
  // 라운드가 바뀌면 key 가 달라 "모두의 단서"부터 (새 공용 단서를 먼저 보게)
  const tabKey = `last-one:round-tab:${game.id}:${game.phase}`;
  const [tab, setTab] = useState<Tab>(() => (readItem(tabKey) === "mine" ? "mine" : "public"));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reveal = usePrivateReveal();
  const myClues = mine?.clues ?? null;
  const whispers = mine?.whispers ?? [];
  // 유령의 속삭임도 새 개인 것이라 같은 점 + 진동으로 알린다 (FR-052, NFR-006). id 가 단서와 겹치지 않게 w- 를 붙인다
  const alertItems = myClues && [
    ...myClues,
    ...whispers.map((w) => ({ id: `w-${w.id}`, round: w.round, text: w.body })),
  ];
  const clues = useClueAlert(game.id, alertItems, tab === "mine", isHost);
  const n = game.round.n;

  function changeTab(next: Tab) {
    // 내 것 탭을 열거나 닫을 때 지금 단서는 본 것으로. 다시 열면 다시 가린다 (옆 사람 시선)
    clues.markSeen();
    if (next === "mine") reveal.hide();
    writeItem(tabKey, next);
    setTab(next);
  }

  function markReady() {
    setError(null);
    startTransition(async () => {
      const since = performance.now();
      const r = await ready(game.id, game.phase);
      if ("error" in r) setError(r.error);
      await reload(since);
    });
  }

  const showMine = tab === "mine" && reveal.open && myClues !== null;
  const video = ROUND_VIDEO[game.phase];

  // 새 공용 단서 RD-03: 이번 라운드 공용 단서가 있으면 라운드마다 한 번 (새로 고쳐도 다시 내지 않음)
  const hasPublicNow = game.publicClues.some((c) => c.round === n);
  useEffect(() => {
    if (!isHost || !hasPublicNow) return;
    const key = `last-one:rd-03:${game.id}:${game.phase}`;
    if (readItem(key) !== null) return;
    const t = setTimeout(() => {
      writeItem(key, "1");
      playSound("rd-03", { isHost });
    }, PUBLIC_CLUE_SOUND_MS);
    return () => clearTimeout(t);
  }, [isHost, hasPublicNow, game.id, game.phase]);
  const publicGraphic = video && videoReady && (
    <GameVideo id={video} gameId={game.id} isHost={isHost} />
  );
  const graphic = tab === "mine" ? (showMine ? undefined : reveal.cover) : publicGraphic;

  return (
    <GameScreen
      isPrivate={tab === "mine"}
      top={top}
      graphic={graphic}
      bottom={
        <>
          <Tabs
            value={tab}
            onChange={changeTab}
            items={[
              { value: "public", label: "모두의 단서" },
              { value: "mine", label: "내 단서", dot: clues.unseen },
            ]}
          />
          <ErrorLine message={error} />
          {game.ready.mine && (
            <p className="text-center text-(length:--text-sm) text-(--color-text-muted)">
              {n < 3 ? "시간이 끝나면 다음 라운드로 넘어가요" : "시간이 끝나면 투표로 넘어가요"}
            </p>
          )}
          <Button
            onClick={markReady}
            disabled={pending || game.ready.mine}
            count={{ n: game.ready.count, of: game.ready.total }}
          >
            {game.ready.mine ? "준비했어요" : "준비 완료"}
          </Button>
        </>
      }
    >
      {tab === "public" ? (
        <PublicText game={game} />
      ) : showMine ? (
        <>
          <MineText clues={myClues} round={n} />
          <Whispers whispers={whispers} />
        </>
      ) : (
        <h2 className="text-(length:--text-xl) font-extrabold">
          {myClues === null ? "단서를 불러오는 중" : "나에게만 온 단서"}
        </h2>
      )}
    </GameScreen>
  );
}

function PublicText({ game }: { game: RoundGame }) {
  const n = game.round.n;
  const now = game.publicClues.filter((c) => c.round === n);
  const before = game.publicClues.filter((c) => c.round < n);
  return (
    <>
      {now.length > 0 && <NewBadge />}
      <h2 className="text-(length:--text-xl) font-extrabold">{game.round.place}</h2>
      <p className="text-(length:--text-md) text-(--color-text-muted)">
        라운드 {n}/3 · {game.round.time}
      </p>
      <ClueList now={now} before={before} empty="이번 라운드 공용 단서는 아직 없어요" />
    </>
  );
}

// 유령에게 받은 속삭임 (FR-052, S-10). 나만 보기 화면 안에서만 보인다 (DESIGN.md §4)
function Whispers({ whispers }: { whispers: { id: string; round: number; body: string }[] }) {
  if (whispers.length === 0) return null;
  return (
    <section className="flex w-full flex-col items-center gap-(--space-2) pt-(--space-3)">
      <Chip>유령의 속삭임</Chip>
      <ul className="flex w-full flex-col gap-(--space-2)">
        {whispers.map((w) => (
          <Card key={w.id}>“{w.body}”</Card>
        ))}
      </ul>
    </section>
  );
}

function MineText({ clues, round }: { clues: Clue[]; round: number }) {
  const now = clues.filter((c) => c.round === round);
  const before = clues.filter((c) => c.round < round);
  return (
    <>
      {now.length > 0 && <NewBadge />}
      <h2 className="text-(length:--text-xl) font-extrabold">나에게만 온 단서</h2>
      <ClueList now={now} before={before} empty="이번 라운드에는 나에게 온 단서가 없어요" />
    </>
  );
}

// 이번 라운드 단서는 크게, 지난 라운드 단서는 카드 목록으로 (FR-041 "지금까지 목록을 언제든")
function ClueList({ now, before, empty }: { now: Clue[]; before: Clue[]; empty: string }) {
  return (
    <>
      {now.length === 0 ? (
        <p className="text-(length:--text-md) text-(--color-text-muted)">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {now.map((c) => (
            <li key={c.id} className="text-(length:--text-lg) font-bold">
              {c.text}
            </li>
          ))}
        </ul>
      )}
      {before.length > 0 && (
        <section className="flex w-full flex-col gap-(--space-2) pt-(--space-3)">
          <h3 className="text-(length:--text-sm) text-(--color-text-muted)">지난 라운드</h3>
          <ul className="flex flex-col gap-(--space-2)">
            {before.map((c) => (
              <Card key={c.id}>{c.text}</Card>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// 새 개인 단서 ---------------------------------------------------------------------

/**
 * 아직 안 본 개인 단서가 있으면 unseen = true (내 것 탭을 보고 있을 때는 false).
 * 새 단서가 처음 보이면 한 번 진동한다 (NFR-006).
 * 본 단서 id 는 이 폰의 sessionStorage 에 둔다: 새로 고침해도 다시 울리지 않게 (편의용이라 실패해도 된다)
 */
function useClueAlert(gameId: string, clues: Clue[] | null, viewing: boolean, isHost: boolean) {
  const key = `last-one:seen-clues:${gameId}`;
  const [seen, setSeen] = useState<Set<string>>(() => readSeen(key));
  const buzzed = useRef(new Set<string>());

  const fresh = (clues ?? []).filter((c) => !seen.has(c.id)).map((c) => c.id);
  const freshKey = fresh.join(",");

  useEffect(() => {
    if (viewing || freshKey === "") return;
    const ids = freshKey.split(",").filter((id) => !buzzed.current.has(id));
    if (ids.length === 0) return;
    for (const id of ids) buzzed.current.add(id);
    vibrate(200);
    // 속삭임(id 가 "w-" 로 시작)이면 내 폰에서만 GH-03. 단서 RD-02 는 보류 (위 머리 주석)
    if (ids.some((id) => id.startsWith("w-"))) playSound("gh-03", { isHost });
  }, [freshKey, viewing, isHost]);

  function markSeen() {
    if (fresh.length === 0) return;
    const next = new Set(seen);
    for (const id of fresh) next.add(id);
    writeSeen(key, next);
    setSeen(next);
  }

  return { unseen: fresh.length > 0 && !viewing, markSeen };
}

function readSeen(key: string): Set<string> {
  try {
    return new Set(JSON.parse(readItem(key) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function writeSeen(key: string, seen: Set<string>) {
  writeItem(key, JSON.stringify([...seen]));
}

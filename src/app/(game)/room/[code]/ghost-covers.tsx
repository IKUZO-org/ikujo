"use client";
// r2 이후 화면 전체를 덮는 연출 (S-10, S-14 모양, DESIGN.md §3):
// - 희생자 폰: 녹화가 끊기는 연출 → 유령 모드 (FR-050). 2초 뒤 저절로 닫힌다
// - 나머지 폰: 긴급 속보 "○○, 해변에서 쓰러진 채 발견" (FR-050, AC-050)
// - 출몰: 유령이 아닌 모든 폰에 "생방송 연결" + 유령의 말 (FR-053)
// 한 번 본 연출은 이 폰의 sessionStorage 에 기억해 새로 고쳐도 다시 띄우지 않는다 (편의용)
// 그래픽 영역: 녹화 끊김은 V-04(희생자 폰만, 2초), 출몰은 V-05(모든 폰이 소리). 속보는 영상이 아니라 앱 UI 다 (video PLAN.md §1, #101)
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Chip, Cover } from "@/components/game";
import { GameVideo } from "@/components/GameVideo";
import { readItem, writeItem } from "@/lib/session-item";
import type { GameState } from "@/server/rooms/core";

const CUT_MS = 2000;

/** 한 번만 보여 줄 덮는 화면. key 가 sessionStorage 에 있으면 이미 본 것 */
function useOnce(key: string | null) {
  const [closed, setClosed] = useState<string | null>(null);
  const show = key !== null && closed !== key && readItem(key) === null;
  // 화면은 타이머 때문에 1초마다 다시 그려진다. close 가 그때마다 바뀌면 아래 2초 타이머가 계속 다시 시작된다
  const close = useCallback(() => {
    if (!key) return;
    writeItem(key, "1");
    setClosed(key);
  }, [key]);
  return { show, close };
}

/**
 * 지금 띄울 덮는 화면. 없으면 null.
 * 방 화면이 이 값으로 덮는 화면이 떠 있는지 알고, 그동안 라운드 영상을 틀지 않는다 (속보 뒤에서 V-02 가 지나가지 않게, #101)
 */
export function useGhostCover(game: GameState | null, isGhost: boolean): ReactNode {
  const ghost = game?.ghost ?? null;
  const news = useOnce(game && ghost && !isGhost ? `last-one:news:${game.id}` : null);
  const cut = useOnce(game && ghost && isGhost ? `last-one:ghost-cut:${game.id}` : null);
  const haunt = useOnce(game?.haunt && !isGhost ? `last-one:haunt:${game.id}` : null);

  const cutShown = cut.show;
  const closeCut = cut.close;
  useEffect(() => {
    if (!cutShown) return;
    const t = setTimeout(closeCut, CUT_MS);
    return () => clearTimeout(t);
  }, [cutShown, closeCut]);

  if (!game || !ghost) return null;
  // 출몰이 속보보다 늦게 온 것이라 먼저 보인다. 닫으면 남은 것이 이어서 뜬다
  if (haunt.show && game.haunt) {
    // 소리 자리 (playSound #99 머지 뒤): GH-04 "생방송 연결" 지직, 모든 폰 같이 (sound.md 규칙 3)
    return (
      <Cover
        label={<Chip>생방송 연결</Chip>}
        graphic={<GameVideo id="v-05" gameId={game.id} />}
        title={`“${game.haunt.body}”`}
        action="닫기"
        onClose={haunt.close}
      >
        <p className="text-(length:--text-md) text-(--color-text-muted)">
          유령이 된 {ghost.name}의 목소리
        </p>
      </Cover>
    );
  }
  if (news.show) {
    return (
      <Cover
        label={
          <span className="rounded-(--radius-sm) bg-(--color-primary) px-(--space-3) py-(--space-1) text-(length:--text-sm) font-bold text-(--color-text)">
            긴급 속보
          </span>
        }
        title={`${ghost.name}, 해변에서 쓰러진 채 발견`}
        action="닫기"
        onClose={news.close}
      >
        <p className="text-(length:--text-md) text-(--color-text-muted)">
          유령은 투표할 수 없고, 투표로 고를 수도 없어요
        </p>
      </Cover>
    );
  }
  if (cut.show) {
    // 소리 자리 (playSound #99 머지 뒤): GH-01 REC 꺼지는 소리, 희생자 폰만
    return (
      <Cover
        label={<Chip>녹화 중단</Chip>}
        graphic={<GameVideo id="v-04" gameId={game.id} />}
        title="녹화가 끊겼어요"
        action="유령으로 계속"
        onClose={cut.close}
      >
        <p className="text-(length:--text-md) text-(--color-text-muted)">
          당신은 쓰러진 채 발견됐어요. 이제 유령이에요
        </p>
      </Cover>
    );
  }
  return null;
}

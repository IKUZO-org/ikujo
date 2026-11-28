"use client";
// r2 이후 화면 전체를 덮는 연출 (S-10, S-14 모양, DESIGN.md §3):
// - 희생자 폰: 녹화가 끊기는 연출 → 유령 모드 (FR-050). V-04(2초)가 끝나면 저절로 닫힌다.
//   영상이 늦게 떠도 끝까지 보이게 하되 최대 4초까지만 기다리고, 못 틀면 2초 (#106 리뷰, #110).
//   AC-050 "2초 안"은 R2 시작부터 이 녹화 끊김 연출이 뜨는 것으로 본다
// - 나머지 폰: 긴급 속보 "○○, 거실에서 갑자기 쓰러져 의식 없음" (D-029) (FR-050, AC-050)
// - 출몰: 유령이 아닌 모든 폰에 "생방송 연결" + 유령의 말 (FR-053)
// 한 번 본 연출은 이 폰의 sessionStorage 에 기억해 새로 고쳐도 다시 띄우지 않는다 (편의용)
// 그래픽 영역: 녹화 끊김은 V-04(희생자 폰만, 2초), 출몰은 V-05(모든 폰이 소리). 속보는 영상이 아니라 앱 UI 다 (video PLAN.md §1, #101)
// 소리: 녹화 끊김 GH-01(희생자 폰만), 출몰 GH-04(모든 폰 같이, sound.md 규칙 3). 누가 낼지는 SOUND_TARGET 표
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Chip, Cover } from "@/components/game";
import { GameVideo } from "@/components/GameVideo";
import { readItem, writeItem } from "@/lib/session-item";
import { playSound } from "@/lib/sound";
import type { GameState } from "@/server/rooms/core";

const CUT_MS = 2000; // 영상을 못 틀 때 녹화 끊김 화면을 보여 주는 시간
const CUT_MAX_MS = 4000; // 영상이 늦게 떠도 이보다 오래 기다리지 않는다

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
export function useGhostCover(
  game: GameState | null,
  isGhost: boolean,
  isHost: boolean,
): ReactNode {
  const ghost = game?.ghost ?? null;
  const news = useOnce(game && ghost && !isGhost ? `last-one:news:${game.id}` : null);
  const cut = useOnce(game && ghost && isGhost ? `last-one:ghost-cut:${game.id}` : null);
  const haunt = useOnce(game?.haunt && !isGhost ? `last-one:haunt:${game.id}` : null);

  const cutShown = cut.show;
  const closeCut = cut.close;
  // 영상을 못 틀었으면(파일 없음, 움직임 줄이기 등) 2초, 아니면 영상이 끝날 때 닫고 최대 4초
  const [cutSkipped, setCutSkipped] = useState(false);
  useEffect(() => {
    if (!cutShown) return;
    const t = setTimeout(closeCut, cutSkipped ? CUT_MS : CUT_MAX_MS);
    return () => clearTimeout(t);
  }, [cutShown, cutSkipped, closeCut]);
  const onCutVideo = useCallback(
    (how: "ended" | "skipped") => (how === "ended" ? closeCut() : setCutSkipped(true)),
    [closeCut],
  );

  useEffect(() => {
    if (cutShown) playSound("gh-01", { isHost });
  }, [cutShown, isHost]);
  const hauntShown = haunt.show;
  useEffect(() => {
    if (hauntShown) playSound("gh-04", { isHost });
  }, [hauntShown, isHost]);

  if (!game || !ghost) return null;
  // 출몰이 속보보다 늦게 온 것이라 먼저 보인다. 닫으면 남은 것이 이어서 뜬다
  if (haunt.show && game.haunt) {
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
        title={`${ghost.name}, 거실에서 갑자기 쓰러져 의식 없음`}
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
    return (
      <Cover
        label={<Chip>녹화 중단</Chip>}
        graphic={<GameVideo id="v-04" gameId={game.id} onEnded={onCutVideo} />}
        title="녹화가 끊겼어요"
        action="유령으로 계속"
        onClose={cut.close}
      >
        <p className="text-(length:--text-md) text-(--color-text-muted)">
          컵을 비우고 얼마 안 돼 눈앞이 흐려졌어요. 몸은 거실에 쓰러져 있지만, 정전 때 복도에서 스친
          누군가가 떠올라요
        </p>
      </Cover>
    );
  }
  return null;
}

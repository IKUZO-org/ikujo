// 게임 영상 (FR-081, docs/video/RULES.md §3, PLAN.md §1 영상별 소리, #101).
// 파일은 public/videos/<ID 소문자>.mp4. 없거나 못 틀면 앱은 글로만 진행한다 (PRD §24)
import { readItem, writeItem } from "@/lib/session-item";

/** 지금 public/videos 에 있는 영상. V-08(짤), V-10(유령이 본 장면)은 아직 없다 */
export type VideoId = "v-01" | "v-02" | "v-03" | "v-04" | "v-05" | "v-06" | "v-07" | "v-09";

export function videoSrc(id: VideoId): string {
  return `/videos/${id}.mp4`;
}

/**
 * 이 폰이 영상 소리를 내는가.
 * - 공용 영상은 방장 폰만 낸다. 여러 폰이 같이 내면 메아리처럼 들린다 (sound.md 규칙 1)
 * - V-05 출몰은 모든 폰이 같이 낸다 (sound.md 규칙 3, video VQ-19)
 * - V-04 유령 전환은 희생자 폰에서만 나오는 영상이라 그 폰이 낸다 (PLAN.md §1)
 * - 설정에서 소리를 끄면 어느 영상도 소리를 내지 않는다 (FR-091)
 */
export function videoHasSound(
  id: VideoId,
  { isHost, soundOn }: { isHost: boolean; soundOn: boolean },
): boolean {
  if (!soundOn) return false;
  if (id === "v-05" || id === "v-04") return true;
  return isHost;
}

/**
 * 끝이 검게 사라지는(페이드 아웃) 영상은 어두워지기 직전 시각(초)에서 멈추고 그 장면을 둔다 (#141).
 * 그대로 끝까지 틀면 마지막 장면이 검정이라 그래픽 영역이 꺼진 것처럼 보인다.
 * - V-01: C-08 편집실이 36.5초부터 어두워져 39.25초에 검정 (밝기를 재서 정함. 영상을 다시 편집하면 같이 고친다)
 */
const HOLD_AT_S: Partial<Record<VideoId, number>> = { "v-01": 36.5 };

/** 이 영상을 멈춰 둘 시각(초). 끝까지 트는 영상이면 null */
export function holdAt(id: VideoId): number | null {
  return HOLD_AT_S[id] ?? null;
}

/** 한 판에서 한 번 끝까지 본 영상은 다시 틀지 않는다 (새로 고침, 탭 바꾸기). sessionStorage 키 */
export function playedKey(gameId: string, id: VideoId): string {
  return `last-one:video:${gameId}:${id}`;
}

/**
 * 영상 소리 크기(0~1). 앱 소리(sound.md 큐)가 영상 안 소리보다 먼저 들려야 해서 BGM(0.5)보다 작게 둔다
 * (video RULES R-13, `제안` #110). iOS Safari 는 영상 크기를 바꿀 수 없어 그대로 1 로 난다
 */
export const VIDEO_VOLUME = 0.4;

// 오프닝 끝 신호 ------------------------------------------------------------------
// OP-02(오프닝 BGM)는 V-01 이 끝나고 OP-08 스팅 뒤부터 깐다 (sound.md 1.1).
// 오프닝 화면이 신호를 주고, 단계 소리(use-room-sound)가 듣는다. 새로 고쳐도 다시 기다리지 않게 이 폰에 기억한다

const openingListeners = new Set<() => void>();
const openingDoneKey = (gameId: string) => `last-one:opening-done:${gameId}`;

export function markOpeningDone(gameId: string) {
  if (isOpeningDone(gameId)) return;
  writeItem(openingDoneKey(gameId), "1");
  openingDone.add(gameId);
  for (const l of openingListeners) l();
}

// sessionStorage 를 못 쓰는 브라우저에서도 이 화면에서는 기억한다
const openingDone = new Set<string>();

export function isOpeningDone(gameId: string): boolean {
  return openingDone.has(gameId) || readItem(openingDoneKey(gameId)) !== null;
}

/** 오프닝 끝 신호를 듣는다. 돌려준 함수로 그만 듣는다 (useSyncExternalStore 의 subscribe 모양) */
export function onOpeningDone(listener: () => void): () => void {
  openingListeners.add(listener);
  return () => {
    openingListeners.delete(listener);
  };
}

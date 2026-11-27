// 게임 영상 (FR-081, docs/video/RULES.md §3, PLAN.md §1 영상별 소리, #101).
// 파일은 public/videos/<ID 소문자>.mp4. 없거나 못 틀면 앱은 글로만 진행한다 (PRD §24)

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

/** 한 판에서 한 번 끝까지 본 영상은 다시 틀지 않는다 (새로 고침, 탭 바꾸기). sessionStorage 키 */
export function playedKey(gameId: string, id: VideoId): string {
  return `last-one:video:${gameId}:${id}`;
}

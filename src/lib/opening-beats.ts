// 오프닝(S-07) 장면 4개가 영상 V-01 의 몇 초에서 시작하는지 (#141).
// 시각은 V-01 콘티 편집본 기준 (docs/video/storyboards/V-01.md 2번 컷 표):
// ① 결승 생방송 C-01~C-03 0:00 / ② 단톡방 C-04 0:12 / ③ 정전 C-05~C-06 0:20 / ④ 발견 C-07~C-08 0:29.5
// 영상을 다시 편집해 컷 시각이 바뀌면 여기도 같이 고친다
export const OPENING_BEAT_STARTS = [0, 12, 20, 29.5] as const;

/** 영상 시각(초)에 맞는 장면 번호 (0부터) */
export function beatAt(seconds: number): number {
  let beat = 0;
  for (let k = 0; k < OPENING_BEAT_STARTS.length; k++) {
    if (seconds >= OPENING_BEAT_STARTS[k]) beat = k;
  }
  return beat;
}

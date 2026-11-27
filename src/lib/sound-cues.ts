// 소리 설정 표와 표를 읽는 순수 함수 (docs/sound.md, #100). 소리를 내지는 않는다.
// 어떤 소리를 언제, 누가, 얼마나 크게 낼지는 아래 "설정" 표만 고치면 된다
import type { Phase } from "@/server/phase";

// ---- 설정 ----------------------------------------------------------------------

// public/sounds/<id>.mp3 에 있는 소리 전부 (sound.md §3). 파일을 더하면 여기에도 더한다
export const SOUND_IDS = [
  "bg-01",
  "bg-02",
  "ch-01",
  "cl-01",
  "gh-01",
  "gh-02",
  "gh-03",
  "gh-04",
  "lb-01",
  "lb-02",
  "op-01",
  "op-02",
  "op-04",
  "op-05",
  "op-06",
  "op-08",
  "r1-01",
  "r2-01",
  "r2-02",
  "r2-04",
  "r3-01",
  "r3-01-alt",
  "r3-02",
  "rd-01",
  "rd-02",
  "rd-03",
  "rd-04",
  "rd-05",
  "rv-01",
  "rv-02",
  "rv-03",
  "rv-04",
  "vt-01",
  "vt-01-alt",
  "vt-02",
  "vt-03",
] as const;
export type SoundId = (typeof SOUND_IDS)[number];

// 단계마다 깔아 둘 BGM/앰비언스 하나 (sound.md §1 끝: 한 번에 하나). id 를 바꾸면 그 단계 배경 소리가 바뀐다.
// OP-02 는 V-01 이 끝나고 OP-08 뒤부터 인물 카드까지 (sound.md 1.1). intro 는 openingVideoDone 일 때만 깐다
export const PHASE_LAYER: Partial<Record<Phase, SoundId>> = {
  intro: "op-02",
  secret: "op-02",
  r1: "r1-01",
  r2: "r2-02",
  r3: "r3-02",
  vote: "vt-01",
  revote: "vt-01",
  reveal: "rv-03",
};

type Round = "r1" | "r2" | "r3";

// 라운드 끝 무렵(남은 시간 BG_TAIL_MS 이하)에 장소 앰비언스 대신 깔 BG (sound.md BG-01/02 "개발과 정함", `제안` #100).
// 장소 소리로 자리를 먼저 알리고 마감 쪽으로 긴장을 올린다. 라운드가 8~10분이라 앰비언스가 5분 이상 깔린다
export const ROUND_TAIL_LAYER: Record<Round, SoundId> = { r1: "bg-01", r2: "bg-02", r3: "bg-01" };
export const BG_TAIL_MS = 3 * 60 * 1000; // 3분

export type Cue = { id: SoundId; atMs: number };

// 단계 전환('이전>다음') 때 낼 효과음과 전환 뒤 낼 시각(ms). 한꺼번에 내면 어수선해 차례로 낸다 (sound.md RD-01, RD-05, R2-01, R3-01. CH-02 는 RD-01 을 다시 씀).
// 표에 없는 전환은 소리 없음
export const TRANSITION_CUES: Partial<Record<`${Phase}>${Phase}`, Cue[]>> = {
  "secret>r1": [{ id: "rd-01", atMs: 0 }],
  "r1>r2": [
    { id: "rd-05", atMs: 0 },
    { id: "rd-01", atMs: 800 }, // 0.8초
    { id: "r2-01", atMs: 2000 }, // 2초
  ],
  "r2>r3": [
    { id: "rd-05", atMs: 0 },
    { id: "rd-01", atMs: 800 }, // 0.8초
    { id: "r3-01", atMs: 2000 }, // 2초
  ],
  "r3>vote": [{ id: "rd-05", atMs: 0 }],
};

// RD-04 째깍을 시작하는 라운드 남은 시간 (sound.md RD-04)
export const LAST_SECONDS_MS = 30 * 1000; // 30초

// BGM/앰비언스가 바뀔 때 줄이고 키우는 시간(초)
export const FADE_S = 1.5; // 1.5초

// 기본 크기(0~1). 앰비언스, BGM 은 효과음보다 작게 (sound.md §3)
export const EFFECT_VOLUME = 1;
export const LAYER_VOLUME = 0.5;

// 소리마다 크기. 하나만 크게/작게 하려면 그 id 값을 바꾼다. 모든 id 를 적어야 한다 (빠지면 타입 오류)
export const SOUND_VOLUME: Record<SoundId, number> = {
  "bg-01": LAYER_VOLUME,
  "bg-02": LAYER_VOLUME,
  "ch-01": EFFECT_VOLUME,
  "cl-01": EFFECT_VOLUME,
  "gh-01": EFFECT_VOLUME,
  "gh-02": LAYER_VOLUME,
  "gh-03": EFFECT_VOLUME,
  "gh-04": EFFECT_VOLUME,
  "lb-01": EFFECT_VOLUME,
  "lb-02": EFFECT_VOLUME,
  "op-01": LAYER_VOLUME,
  "op-02": LAYER_VOLUME,
  "op-04": EFFECT_VOLUME,
  "op-05": EFFECT_VOLUME,
  "op-06": LAYER_VOLUME,
  "op-08": EFFECT_VOLUME,
  "r1-01": LAYER_VOLUME,
  "r2-01": EFFECT_VOLUME,
  "r2-02": LAYER_VOLUME,
  "r2-04": EFFECT_VOLUME,
  "r3-01": EFFECT_VOLUME,
  "r3-01-alt": EFFECT_VOLUME,
  "r3-02": 0.25, // 지지직 잡음이 커서 R3 내내 깔리기엔 거슬려 줄임 (#100)
  "rd-01": EFFECT_VOLUME,
  "rd-02": EFFECT_VOLUME,
  "rd-03": EFFECT_VOLUME,
  "rd-04": EFFECT_VOLUME,
  "rd-05": EFFECT_VOLUME,
  "rv-01": EFFECT_VOLUME,
  "rv-02": EFFECT_VOLUME,
  "rv-03": LAYER_VOLUME,
  "rv-04": EFFECT_VOLUME,
  "vt-01": LAYER_VOLUME,
  "vt-01-alt": LAYER_VOLUME,
  "vt-02": EFFECT_VOLUME,
  "vt-03": EFFECT_VOLUME,
};

// 누가 소리를 내는지 (sound.md §1 "어느 폰" 칸). host=방장 폰만(규칙 1), self=부른 그 폰만(규칙 2),
// all=모든 폰(규칙 3, 폰마다 시작이 조금 달라 짧은 효과음에만)
export type SoundTarget = "host" | "self" | "all";
export const SOUND_TARGET: Record<SoundId, SoundTarget> = {
  "bg-01": "host",
  "bg-02": "host",
  "ch-01": "self",
  "cl-01": "self",
  "gh-01": "self",
  "gh-02": "self",
  "gh-03": "self",
  "gh-04": "all",
  "lb-01": "host",
  "lb-02": "host",
  "op-01": "host",
  "op-02": "host",
  "op-04": "host",
  "op-05": "host",
  "op-06": "host",
  "op-08": "host",
  "r1-01": "host",
  "r2-01": "host",
  "r2-02": "host",
  "r2-04": "self",
  "r3-01": "host",
  "r3-01-alt": "host",
  "r3-02": "host",
  "rd-01": "host",
  "rd-02": "self",
  "rd-03": "host",
  "rd-04": "host",
  "rd-05": "host",
  "rv-01": "host",
  "rv-02": "host",
  "rv-03": "host",
  "rv-04": "self",
  "vt-01": "host",
  "vt-01-alt": "host",
  "vt-02": "self",
  "vt-03": "host",
};

// ---- 표를 읽는 함수 --------------------------------------------------------------

/** 지금 깔아 둘 BGM/앰비언스 하나. 없으면 null. `openingVideoDone` 은 V-01 이 끝났거나 건너뛴 뒤 true */
export function pickLayer(
  phase: string | null,
  remainingMs: number | null,
  openingVideoDone: boolean,
): SoundId | null {
  if (!phase || (phase === "intro" && !openingVideoDone)) return null;
  const tail = ROUND_TAIL_LAYER[phase as Round];
  if (tail && remainingMs !== null && remainingMs <= BG_TAIL_MS) return tail;
  return PHASE_LAYER[phase as Phase] ?? null;
}

/** 이 폰에서 이 소리를 낼지. host 소리는 방장 폰만 */
export function shouldPlay(id: SoundId, isHost: boolean): boolean {
  return SOUND_TARGET[id] === "host" ? isHost : true;
}

export function volumeFor(id: SoundId): number {
  return SOUND_VOLUME[id];
}

/** 단계가 prev → next 로 바뀔 때 낼 효과음과 시각 */
export function phaseCues(prev: string, next: string): Cue[] {
  return TRANSITION_CUES[`${prev}>${next}` as `${Phase}>${Phase}`] ?? [];
}

/** 약 -45dB. 이보다 작은 소리는 무음으로 본다 */
export const SILENCE_LEVEL = 0.0056;
const LOOP_TAIL_S = 0.05; // 0.05초

/** 모든 채널에서 마지막으로 소리가 나는 시각(초) + 짧은 여유. 반복할 때 끝 무음을 건너뛰는 데 쓴다 (#100) */
export function loopEndSeconds(channels: ArrayLike<number>[], sampleRate: number): number {
  let last = -1;
  for (const ch of channels) {
    for (let i = ch.length - 1; i > last; i--) {
      if (Math.abs(ch[i]) > SILENCE_LEVEL) {
        last = i;
        break;
      }
    }
  }
  const length = Math.max(0, ...channels.map((c) => c.length));
  if (last < 0) return length / sampleRate;
  return Math.min(length / sampleRate, (last + 1) / sampleRate + LOOP_TAIL_S);
}

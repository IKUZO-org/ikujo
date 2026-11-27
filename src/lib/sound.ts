"use client";
// 소리 재생 바탕 (docs/sound.md §0, §3, PRD §24, FR-091, #100).
// - 파일은 public/sounds/<id>.mp3. 없거나 못 틀면 조용히 건너뛴다 (화면은 그대로 진행)
// - 모바일은 사용자가 누르기 전에 소리를 못 낸다. 첫 탭에서 소리를 연다 (규칙 6)
// - 설정에서 소리를 끄면 내지 않고, 끄는 순간 깔린 BGM 도 멈춘다
// - BGM/앰비언스는 한 번에 하나. 바뀔 때 앞 것을 줄이고 다음 것을 키운다 (sound.md §1 끝)
// 누가 내는지는 sound-cues.ts 의 SOUND_TARGET 표를 따른다 (host 방장 폰만, self 그 폰만, all 모든 폰)
import { isOn, SETTINGS_EVENT } from "@/lib/settings";
import { FADE_S, loopEndSeconds, shouldPlay, volumeFor, type SoundId } from "@/lib/sound-cues";

let ctx: AudioContext | null = null;
const buffers = new Map<SoundId, Promise<AudioBuffer | null>>();
type Playing = { source: AudioBufferSourceNode; gain: GainNode };
let layer: { id: SoundId; playing: Playing | null } | null = null;
let wantedLayer: SoundId | null = null;
const effects = new Set<Playing>();
let listening = false;
// 반복 BGM 파일 끝에 무음(최대 8초쯤)이 있어 그대로 돌리면 긴 텀이 생긴다. 버퍼마다 소리 끝을 한 번 구해 둔다 (#100)
const loopEnds = new WeakMap<AudioBuffer, number>();

function loopEnd(buffer: AudioBuffer): number {
  let end = loopEnds.get(buffer);
  if (end === undefined) {
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
      buffer.getChannelData(i),
    );
    end = loopEndSeconds(channels, buffer.sampleRate);
    loopEnds.set(buffer, end);
  }
  return end;
}
// iOS Safari 는 pointerdown 으로는 AudioContext 가 안 열리는 경우가 있어 셋을 같이 듣는다
const TAP_EVENTS = ["pointerdown", "touchend", "click"] as const;

function context(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
  } catch {
    return null;
  }
  return ctx;
}

function unlocked() {
  return ctx?.state === "running";
}

function load(id: SoundId): Promise<AudioBuffer | null> {
  let p = buffers.get(id);
  if (!p) {
    p = fetch(`/sounds/${id}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (b && ctx ? ctx.decodeAudioData(b) : null))
      .catch(() => null);
    buffers.set(id, p);
  }
  return p;
}

function start(
  buffer: AudioBuffer,
  volume: number,
  loop: boolean,
  fadeIn: boolean,
  trimTail = false,
): Playing | null {
  if (!ctx) return null;
  try {
    const gain = ctx.createGain();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    if (trimTail) source.loopEnd = loopEnd(buffer);
    source.connect(gain).connect(ctx.destination);
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(fadeIn ? 0 : volume, t);
    if (fadeIn) gain.gain.linearRampToValueAtTime(volume, t + FADE_S);
    source.start();
    return { source, gain };
  } catch {
    return null;
  }
}

function stop(p: Playing, fade: boolean) {
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0, t + (fade ? FADE_S : 0.05));
    p.source.stop(t + (fade ? FADE_S : 0.05));
  } catch {
    // 이미 멈춘 소리에 stop 을 부르면 오류가 난다
  }
}

/** 첫 탭에서 소리를 연다. 방 화면이 열릴 때 한 번 부른다 */
export function listenFirstTap() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  const open = () => {
    const c = context();
    if (!c) return;
    void c
      .resume()
      .then(() => {
        if (!unlocked()) return;
        for (const e of TAP_EVENTS) window.removeEventListener(e, open, true);
        applyLayer(); // 열리기 전에 정해 둔 BGM 을 이제 튼다
      })
      .catch(() => {});
  };
  for (const e of TAP_EVENTS) window.addEventListener(e, open, true);
  window.addEventListener(SETTINGS_EVENT, () => {
    if (isOn("sound")) return applyLayer();
    stopAll();
  });
}

function stopAll() {
  if (layer?.playing) stop(layer.playing, false);
  layer = null;
  for (const p of effects) stop(p, false);
  effects.clear();
}

/**
 * 효과음 한 번. 누가 내는지는 SOUND_TARGET 표를 따른다 (host 소리는 방장 폰만).
 * loop 이면 돌려준 함수로 멈출 때까지 반복한다
 */
export function playSound(id: SoundId, opts: { isHost: boolean; loop?: boolean }): () => void {
  let playing: Playing | null = null;
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
    if (playing) {
      stop(playing, false);
      effects.delete(playing);
    }
  };
  if (!shouldPlay(id, opts.isHost)) return cancel;
  if (!isOn("sound") || !unlocked()) return cancel;
  void load(id).then((buffer) => {
    if (!buffer || cancelled || !isOn("sound")) return;
    const p = start(buffer, volumeFor(id), !!opts.loop, false);
    if (!p) return;
    playing = p;
    effects.add(p);
    p.source.onended = () => effects.delete(p);
  });
  return cancel;
}

/**
 * 깔아 둘 BGM/앰비언스를 정한다 (null 이면 줄여서 끈다). 같은 것이면 그대로 둔다.
 * 아직 소리가 안 열렸으면 기억해 두었다가 첫 탭 뒤에 튼다 (새로 고침, 재접속 뒤에도 지금 단계 것)
 */
export function setLayer(id: SoundId | null, isHost: boolean) {
  wantedLayer = id && shouldPlay(id, isHost) ? id : null;
  applyLayer();
}

function applyLayer() {
  const id = isOn("sound") && unlocked() ? wantedLayer : null;
  if ((layer?.id ?? null) === id) return;
  if (layer?.playing) stop(layer.playing, true);
  layer = id ? { id, playing: null } : null;
  if (!id) return;
  const mine = layer;
  void load(id).then((buffer) => {
    if (!buffer || layer !== mine || !mine) return;
    mine.playing = start(buffer, volumeFor(id), true, true, true);
  });
}

"use client";
// 단계가 바뀔 때 나는 소리를 고르고 튼다 (docs/sound.md §1, #100).
// 누가 낼지는 sound-cues.ts 의 SOUND_TARGET 표가 정한다. 방장이 바뀌면(BR-012) 새 방장 폰이 지금 단계 BGM 을 이어 튼다.
// 단계 전환 효과음은 이 폰이 전환을 직접 본 때만 낸다: 새로 고침, 재접속 뒤 처음 읽은 단계에는 BGM 만 다시 깐다
import { useEffect, useRef } from "react";
import { listenFirstTap, playSound, setLayer } from "@/lib/sound";
import { LAST_SECONDS_MS, phaseCues, pickLayer } from "@/lib/sound-cues";
import type { RoomState } from "@/server/rooms/core";

// OP-02 는 V-01 이 끝나고 OP-08 뒤부터다 (sound.md 1.1). V-01 재생은 따로 만든다.
// 그 전까지는 오프닝 진입 때 바로 튼다. V-01 이 생기면 영상이 끝난 신호로 이 값을 바꾼다 (#100)
const OPENING_VIDEO_DONE = true;

export function useRoomSound(state: RoomState | null, remainingMs: number | null) {
  const isHost = !!state?.me.isHost;
  const game = state?.status === "lobby" ? null : (state?.game ?? null);
  const gameId = game?.id ?? null;
  const phase = game?.phase ?? null;

  useEffect(() => listenFirstTap(), []);

  // 깔아 둘 BGM/앰비언스. 바뀔 때만 setLayer 가 실제로 바꾼다
  const layer = pickLayer(phase, remainingMs, OPENING_VIDEO_DONE);
  useEffect(() => setLayer(layer, isHost), [layer, isHost]);
  useEffect(() => () => setLayer(null, false), []);

  // 단계 전환 효과음 (TRANSITION_CUES)
  const seen = useRef<{ gameId: string; phase: string } | null>(null);
  useEffect(() => {
    if (!gameId || !phase) return;
    const prev = seen.current;
    seen.current = { gameId, phase };
    if (!prev || prev.gameId !== gameId) return;
    const timers = phaseCues(prev.phase, phase).map(({ id, atMs }) =>
      setTimeout(() => playSound(id, { isHost }), atMs),
    );
    return () => timers.forEach(clearTimeout); // 단계가 또 바뀌거나 화면이 사라지면 아직 안 낸 소리는 취소
  }, [gameId, phase, isHost]);

  // RD-04 남은 30초: 라운드에서 30초를 넘어가는 순간을 본 때만, 단계가 끝날 때까지 째깍
  const round = phase === "r1" || phase === "r2" || phase === "r3";
  const key = round && gameId ? `${gameId}:${phase}` : null;
  const zone =
    remainingMs === null
      ? null
      : remainingMs > LAST_SECONDS_MS
        ? "before"
        : remainingMs > 0
          ? "last"
          : "done";
  const sawBefore = useRef<string | null>(null); // 30초 전을 본 (gameId:phase)
  useEffect(() => {
    if (!key) return;
    if (zone === "before") sawBefore.current = key;
    if (zone !== "last" || sawBefore.current !== key) return;
    return playSound("rd-04", { isHost, loop: true });
  }, [key, zone, isHost]);
}

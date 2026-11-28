"use client";
// 방 상태 훅 (#21, data §5, NFR-001/002). 서버 상태(getRoomState)를 따라간다.
// 다시 읽는 때: 화면을 열 때, room:{roomId} 신호를 받을 때(count 는 빼고), 남은 시간이 0 이 될 때.
// 0 이 되면 advance 를 부르고 다시 읽는다. 단계를 실제로 넘길지는 서버가 정한다.
import { useCallback, useEffect, useRef, useState } from "react";
import { runCoalesced, type CoalesceSlot } from "@/lib/coalesce";
import { clockOffsetMs, remainingMs as calcRemaining } from "@/lib/room-clock";
import { roomChannel, SIGNAL_EVENT, type RoomSignal } from "@/lib/realtime";
import { createClient } from "@/lib/supabase/client";
import { getRoomState } from "@/server/actions/get-room-state";
import { advance } from "@/server/actions/phase";
import type { RoomState } from "@/server/rooms/core";

const TICK_MS = 1000;
const RETRY_MS = 1500; // advance 가 아직 이르다고 하면 잠시 뒤 다시 읽는다

export function useRoomState(code: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [now, setNow] = useState(0); // 폰 시각. 읽을 때와 1초마다 바꾼다

  const alive = useRef(true);
  const advanced = useRef(new Set<string>()); // 이 폰에서 advance 를 부른 (gameId, phase)
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 읽는 중에 또 부르면 끝난 뒤 한 번만 더 읽는다 (#135). 읽기가 겹치지 않아 옛 응답이 새 응답을 덮지 않는다
  const load = useCallback(async () => {
    const r = await getRoomState({ code });
    if (!alive.current) return;
    if ("error" in r) return setError(r.error);
    const phoneNow = Date.now();
    setError(null);
    setOffsetMs(clockOffsetMs(r.serverNow, phoneNow));
    setNow(phoneNow);
    setState(r.state);
  }, [code]);
  const reading: CoalesceSlot = useRef({ inflight: null, dirty: false });
  const reload = useCallback(() => runCoalesced(reading, load), [load]);

  useEffect(() => {
    alive.current = true;
    const t = setTimeout(() => void reload(), 0); // 화면을 열 때 읽는다 (NFR-002)
    return () => {
      alive.current = false;
      clearTimeout(t);
      if (retry.current) clearTimeout(retry.current);
    };
  }, [reload]);

  // 신호를 받을 때 다시 읽는다 (NFR-001). count 는 실린 수만 바꾸고 다시 읽지 않는다 (#135)
  const roomId = state?.roomId;
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(roomChannel(roomId))
      .on("broadcast", { event: SIGNAL_EVENT }, ({ payload }) => {
        const signal = payload as RoomSignal;
        if (signal?.type === "count") setState((s) => applyCount(s, signal));
        else void reload();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, reload]);

  // 남은 시간: 대기실이거나 마감이 없으면 타이머 없음
  const gameId = state?.status === "lobby" ? undefined : state?.game?.id;
  const phase = state?.game?.phase;
  const endsAt = gameId ? (state?.game?.phaseEndsAt ?? null) : null;
  const remainingMs = gameId && phase ? calcRemaining(endsAt, now, offsetMs) : null;
  useEffect(() => {
    if (!gameId || !phase || endsAt === null) return;
    const key = `${gameId}:${phase}`;
    const tick = () => {
      const phoneNow = Date.now();
      setNow(phoneNow);
      const left = calcRemaining(endsAt, phoneNow, offsetMs);
      if (left !== 0 || advanced.current.has(key)) return;
      advanced.current.add(key); // 같은 (gameId, phase) 로는 한 번만
      void advance(gameId, phase).then((r) => {
        if (!alive.current) return;
        if ("ok" in r && r.reason === "too_early") {
          // 아직 이르다: 잠시 뒤 다시 읽고, 그때 한 번 더 부를 수 있게 푼다.
          // no_next(vote, revote 등), stale 은 다시 시도하지 않고 한 번 다시 읽기만 한다
          retry.current = setTimeout(() => {
            advanced.current.delete(key);
            void reload();
          }, RETRY_MS);
          return;
        }
        void reload();
      });
    };
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [gameId, phase, endsAt, offsetMs, reload]);

  return { state, error, remainingMs, reload };
}

/** count 신호의 준비 수(ready)나 투표 수(votes)만 바꾼다. 내가 눌렀는지 등은 다음 읽기에서 바뀐다 */
function applyCount(
  state: RoomState | null,
  signal: Extract<RoomSignal, { type: "count" }>,
): RoomState | null {
  const game = state?.game;
  if (!state || !game) return state;
  if (signal.ready !== undefined) {
    return { ...state, game: { ...game, ready: { ...game.ready, count: signal.ready } } };
  }
  if (signal.votes !== undefined && game.vote) {
    return { ...state, game: { ...game, vote: { ...game.vote, count: signal.votes } } };
  }
  return state;
}

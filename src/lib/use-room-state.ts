"use client";
// 방 상태 훅 (#21, data §5, NFR-001/002). 서버 상태(getRoomState)를 따라간다.
// 다시 읽는 때: 화면을 열 때, room:{roomId} 신호를 받을 때, 남은 시간이 0 이 될 때.
// 0 이 되면 advance 를 부르고 다시 읽는다. 단계를 실제로 넘길지는 서버가 정한다.
import { useCallback, useEffect, useRef, useState } from "react";
import { clockOffsetMs, remainingMs as calcRemaining } from "@/lib/room-clock";
import { roomChannel, SIGNAL_EVENT } from "@/lib/realtime";
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
  const seq = useRef(0); // 늦게 온 옛 응답은 버린다
  const advanced = useRef(new Set<string>()); // 이 폰에서 advance 를 부른 (gameId, phase)
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(() => {
    const mine = ++seq.current;
    return getRoomState({ code }).then((r) => {
      if (!alive.current || mine !== seq.current) return;
      if ("error" in r) return setError(r.error);
      const phoneNow = Date.now();
      setError(null);
      setOffsetMs(clockOffsetMs(r.serverNow, phoneNow));
      setNow(phoneNow);
      setState(r.state);
    });
  }, [code]);

  useEffect(() => {
    alive.current = true;
    const t = setTimeout(() => void reload(), 0); // 화면을 열 때 읽는다 (NFR-002)
    return () => {
      alive.current = false;
      clearTimeout(t);
      if (retry.current) clearTimeout(retry.current);
    };
  }, [reload]);

  // 신호를 받을 때 다시 읽는다 (NFR-001)
  const roomId = state?.roomId;
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(roomChannel(roomId))
      .on("broadcast", { event: SIGNAL_EVENT }, () => void reload())
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
        if ("ok" in r && !r.advanced) {
          // 아직 이르다(too_early): 잠시 뒤 다시 읽고, 그때 한 번 더 부를 수 있게 푼다
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

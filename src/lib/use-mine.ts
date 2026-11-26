"use client";
// 내 것 읽기 훅 (spec §4 getMine). 비밀은 신호로 오지 않으므로, 방 상태를 다시 읽을 때마다 같이 다시 읽는다
// (spec §4 "받으면 getRoomState/getMine 를 다시 부른다"). version 은 useRoomState 의 state 객체.
import { useEffect, useRef, useState } from "react";
import { getMine } from "@/server/actions/get-mine";
import type { MineState } from "@/server/reads";

export function useMine(gameId: string | null, version: unknown) {
  const [mine, setMine] = useState<{ gameId: string; value: MineState } | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!gameId) return;
    const my = ++seq.current;
    void getMine({ gameId }).then((r) => {
      // 늦게 온 옛 응답, 오류는 버린다. 오류면 다음 다시 읽기 때 다시 시도한다
      if (my !== seq.current || "error" in r) return;
      setMine({ gameId, value: r.mine });
    });
  }, [gameId, version]);

  // 다른 판의 것이 남아 있으면 보여 주지 않는다
  return mine && mine.gameId === gameId ? mine.value : null;
}

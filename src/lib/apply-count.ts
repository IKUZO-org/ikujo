// count 신호 반영 (#135). 다시 읽지 않고 수만 바꾼다
import type { RoomSignal } from "@/lib/realtime";
import type { RoomState } from "@/server/rooms/core";

/**
 * count 신호의 준비 수(ready)나 투표 수(votes)만 바꾼다. 내가 눌렀는지 등은 다음 읽기에서 바뀐다.
 * 거의 동시에 누르면 신호가 4 → 3 처럼 거꾸로 올 수 있어 지금보다 클 때만 반영한다 (#135).
 * 줄어드는 경우(나감)는 players 신호 뒤 다시 읽기로 바로잡힌다
 */
export function applyCount(
  state: RoomState | null,
  signal: Extract<RoomSignal, { type: "count" }>,
): RoomState | null {
  const game = state?.game;
  if (!state || !game) return state;
  // 앞 판/단계의 늦은 신호는 버린다. max 로 다음 단계에 남지 않게 (#135)
  if (signal.gameId !== game.id || signal.phase !== game.phase) return state;
  if (signal.ready !== undefined) {
    return {
      ...state,
      game: { ...game, ready: { ...game.ready, count: Math.max(game.ready.count, signal.ready) } },
    };
  }
  if (signal.votes !== undefined && game.vote) {
    return {
      ...state,
      game: { ...game, vote: { ...game.vote, count: Math.max(game.vote.count, signal.votes) } },
    };
  }
  return state;
}

/**
 * 다시 읽기 응답에, 그 읽기가 출발한 뒤 받은 count 신호를 다시 얹는다 (#135).
 * 응답이 마지막 준비 저장 전에 읽은 것이면 먼저 받은 큰 수를 내리지 않게. 다른 판/단계 신호는 applyCount 가 버린다
 */
export function keepHeardCounts(
  state: RoomState,
  heard: Extract<RoomSignal, { type: "count" }>[],
): RoomState {
  return heard.reduce<RoomState>((s, signal) => applyCount(s, signal) ?? s, state);
}

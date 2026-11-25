// 방 채널 `room:{roomId}` 로 "바뀌었다" 신호만 보낸다 (data §5, ARCHITECTURE.md §2-4).
// 비밀은 절대 싣지 않는다. 폰은 신호를 받으면 다시 읽는다.
// 단계 4(#17)의 신호도 이 도우미를 같이 쓴다.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Phase } from "./phase";

export type RoomSignal =
  | { type: "phase"; phase: Phase; endsAt: string | null }
  | { type: "count"; phase: Phase; ready: number; total: number }
  | { type: "players" };

export function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

// 구독 없이 REST 로 보낸다. 신호는 놓쳐도 되게 만들었으므로 실패해도 동작을 막지 않는다.
export async function broadcast(db: SupabaseClient, roomId: string, signal: RoomSignal) {
  const channel = db.channel(roomChannel(roomId));
  try {
    await channel.httpSend(signal.type, signal);
  } catch {
    // 폰은 타이머 0, 화면 열기 때도 다시 읽는다 (NFR-001)
  } finally {
    await db.removeChannel(channel);
  }
}

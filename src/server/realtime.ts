// 방 채널 `room:{roomId}` 로 "바뀌었다" 신호만 보낸다 (data §5, ARCHITECTURE.md §2-4).
// 비밀은 절대 싣지 않는다. 폰은 신호를 받으면 다시 읽는다.
// 신호 모양과 이름은 @/lib/realtime 것을 쓴다.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { roomChannel, SIGNAL_EVENT, type RoomSignal } from "@/lib/realtime";

// 구독 없이 REST 로 보낸다. 신호는 놓쳐도 되게 만들었으므로 실패해도 동작을 막지 않는다.
export async function broadcast(db: SupabaseClient, roomId: string, signal: RoomSignal) {
  const channel = db.channel(roomChannel(roomId));
  try {
    await channel.httpSend(SIGNAL_EVENT, signal);
  } catch {
    // 폰은 타이머 0, 화면 열기 때도 다시 읽는다 (NFR-001)
  } finally {
    await db.removeChannel(channel);
  }
}

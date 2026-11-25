// Server Action 이 매번 쓰는 것: 이 요청의 세션 사용자, service role 저장소, 실시간 신호 (SECURITY.md §3).
import "server-only";
import { roomChannel, SIGNAL_EVENT, type RoomSignal } from "@/lib/realtime";
import { ensureSession } from "@/lib/supabase/ensure-session";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "./db";
import type { Deps } from "./rooms/core";
import { supabaseRoomStore } from "./rooms/supabase-store";
import { loadScenario } from "./scenario";

export async function actionDeps(): Promise<Deps> {
  // 세션이 없으면 익명으로 만든다 (FR-003). 누구인지는 이 세션으로만 정한다
  const session = await createClient();
  const user = await ensureSession(session.auth);
  const db = createServiceClient();

  return {
    store: supabaseRoomStore(db),
    user: { id: user.id, isGuest: user.is_anonymous ?? true },
    broadcast: async (roomId: string, signal: RoomSignal) => {
      // 신호만 보낸다. 실패해도 폰은 화면을 열 때와 타이머 0일 때 다시 읽는다 (NFR-001)
      const channel = db.channel(roomChannel(roomId));
      try {
        await channel.httpSend(SIGNAL_EVENT, signal);
      } catch {
        // 무시
      } finally {
        await db.removeChannel(channel);
      }
    },
    scenario: loadScenario(),
    random: Math.random,
    now: () => new Date(),
  };
}

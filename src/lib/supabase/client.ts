// 브라우저용 클라이언트 (anon 키). 읽기와 Realtime 구독에만 쓴다.
// 쓰기는 Server Action 을 거친다 (ARCHITECTURE.md §2).
import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "./env";

export function createClient() {
  const { url, anonKey } = publicSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

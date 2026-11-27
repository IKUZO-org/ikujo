// service role 클라이언트. RLS 를 무시하므로 서버에서만, 이 파일에서만 만든다 (SECURITY.md §1, ARCHITECTURE.md §3).
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "@/lib/supabase/env";

export function createServiceClient() {
  const { url } = publicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 가 없어요. .env.local 을 확인해 주세요.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

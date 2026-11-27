// 세션 보장 (FR-003): 세션이 없으면 익명 로그인으로 만든다.
// 손님도 auth.uid() 를 가져야 RLS 로 "본인 것만" 읽을 수 있다 (data §1, AC-030).
// 같은 폰은 쿠키에 남은 세션으로 같은 사용자로 돌아온다 (NFR-002).
// 손님을 익명 로그인으로 처리하는 방식은 spec §1, data §1 에서 아직 `제안` 이다.
import type { SupabaseClient, User } from "@supabase/supabase-js";

type AuthLike = Pick<SupabaseClient["auth"], "getUser" | "signInAnonymously">;

export async function ensureSession(auth: AuthLike): Promise<User> {
  const { data } = await auth.getUser();
  if (data.user) return data.user;

  const signIn = await auth.signInAnonymously();
  if (signIn.error || !signIn.data.user) {
    throw new Error("손님 세션을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  }
  return signIn.data.user;
}

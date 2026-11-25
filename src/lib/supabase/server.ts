// 서버에서 지금 요청의 세션을 읽는 클라이언트 (anon 키 + 쿠키).
// Server Component 에서는 쿠키를 쓸 수 없어서 setAll 이 실패해도 무시한다.
// 세션 쿠키를 새로 만들고 갱신하는 일은 src/proxy.ts 가 맡는다.
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "./env";

export async function createClient() {
  const { url, anonKey } = publicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component 에서 불리면 여기로 온다. proxy 가 쿠키를 맞춘다.
        }
      },
    },
  });
}

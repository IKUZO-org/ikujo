// 모든 화면 요청 앞에서 세션 쿠키를 보장하고 갱신한다 (FR-003, NFR-002).
// Next.js 16 에서 middleware 는 proxy 로 이름이 바뀌었다.
// 권한 판단은 여기서 하지 않는다. Server Action 이 매번 서버에서 다시 확인한다 (SECURITY.md §3).
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import { ensureSession } from "@/lib/supabase/ensure-session";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = publicSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  try {
    await ensureSession(supabase.auth);
  } catch {
    // 세션을 못 만들어도 화면은 연다. 동작은 Server Action 에서 세션을 다시 확인하며 막힌다.
  }

  return response;
}

export const config = {
  // 정적 파일과 이미지는 건너뛴다
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

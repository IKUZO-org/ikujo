// 브라우저에 가도 되는 값만 둔다 (SECURITY.md §1).
// service role 키는 src/server/ 에서만 읽는다.
export function publicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없어요. .env.example 을 보고 .env.local 을 채워 주세요.",
    );
  }
  return { url, anonKey };
}

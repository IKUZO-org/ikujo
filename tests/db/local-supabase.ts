// 로컬 Supabase(`supabase start`)에 붙는 테스트 도우미.
// 키는 로컬 개발용 값이라 `supabase status` 에서 그때그때 읽는다. 원격 키를 쓰지 않는다.
import { execFileSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type LocalEnv = { url: string; anonKey: string; serviceRoleKey: string };

let cached: LocalEnv | undefined;

export function localEnv(): LocalEnv {
  if (cached) return cached;
  let raw: string;
  try {
    raw = execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8" });
  } catch {
    throw new Error("로컬 Supabase 가 꺼져 있어요. `supabase start` 를 먼저 실행해 주세요.");
  }
  const s = JSON.parse(raw) as Record<string, string>;
  const url = s.API_URL;
  const anonKey = s.ANON_KEY ?? s.PUBLISHABLE_KEY;
  const serviceRoleKey = s.SERVICE_ROLE_KEY ?? s.SECRET_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("`supabase status` 에서 API_URL, 키를 찾지 못했어요.");
  }
  cached = { url, anonKey, serviceRoleKey };
  return cached;
}

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } };

// RLS 를 무시하는 서버 클라이언트. 테스트 데이터 넣기에만 쓴다
export function serviceClient(): SupabaseClient {
  const { url, serviceRoleKey } = localEnv();
  return createClient(url, serviceRoleKey, noPersist);
}

// 손님 한 명: 익명 로그인한 세션의 클라이언트와 사용자 id
export async function guest(): Promise<{ client: SupabaseClient; userId: string }> {
  const { url, anonKey } = localEnv();
  const client = createClient(url, anonKey, noPersist);
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) throw new Error(`익명 로그인 실패: ${error?.message}`);
  return { client, userId: data.user.id };
}

// 서비스 클라이언트로 넣고 에러면 바로 실패
export async function insert<T>(
  db: SupabaseClient,
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
): Promise<T[]> {
  const { data, error } = await db.from(table).insert(rows).select();
  if (error) throw new Error(`${table} 넣기 실패: ${error.message}`);
  return data as T[];
}

import { describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { ensureSession } from "@/lib/supabase/ensure-session";

const user = { id: "user-1", is_anonymous: true } as User;

function fakeAuth(existing: User | null, signInResult?: { user: User | null; error: unknown }) {
  return {
    getUser: vi.fn().mockResolvedValue({ data: { user: existing }, error: null }),
    signInAnonymously: vi.fn().mockResolvedValue({
      data: { user: signInResult?.user ?? null, session: null },
      error: signInResult?.error ?? null,
    }),
  };
}

describe("ensureSession", () => {
  it("세션이 있으면 그 사용자를 돌려주고 새로 만들지 않는다", async () => {
    const auth = fakeAuth(user);
    await expect(ensureSession(auth as never)).resolves.toBe(user);
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("세션이 없으면 익명 로그인으로 만든다", async () => {
    const auth = fakeAuth(null, { user, error: null });
    await expect(ensureSession(auth as never)).resolves.toBe(user);
    expect(auth.signInAnonymously).toHaveBeenCalledOnce();
  });

  it("익명 로그인이 실패하면 한 줄 안내로 실패한다", async () => {
    const auth = fakeAuth(null, { user: null, error: new Error("disabled") });
    await expect(ensureSession(auth as never)).rejects.toThrow("손님 세션을 만들지 못했어요");
  });
});

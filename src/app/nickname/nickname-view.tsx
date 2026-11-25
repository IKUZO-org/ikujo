"use client";
// S-03 닉네임: 1~10자, 앞뒤 공백 제거. 같은 이름이 있으면 서버가 숫자를 붙인다
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { ErrorLine, Screen } from "@/components/Screen";
import { createRoom } from "@/server/actions/create-room";
import { joinRoom } from "@/server/actions/join-room";

export function NicknameView() {
  const router = useRouter();
  const code = useSearchParams().get("code");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const trimmed = nickname.trim();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = code ? await joinRoom({ code, nickname: trimmed }) : await createRoom({ nickname: trimmed });
      if ("error" in r) return setError(r.error);
      router.replace(`/room/${r.code}`);
    });
  }

  return (
    <Screen>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-(--space-3)">
        <label htmlFor="nickname" className="text-(length:--text-lg)">
          닉네임
        </label>
        <input
          id="nickname"
          autoComplete="nickname"
          maxLength={10}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="min-h-11 rounded-(--radius-md) bg-(--color-surface) px-(--space-3) text-(length:--text-lg)"
        />
        <p className="text-(length:--text-sm) text-(--color-text-muted)">1~10자</p>
        <ErrorLine message={error} />
        <div className="mt-auto">
          <Button type="submit" disabled={pending || trimmed.length === 0 || trimmed.length > 10}>
            {code ? "들어가기" : "방 만들기"}
          </Button>
        </div>
      </form>
    </Screen>
  );
}

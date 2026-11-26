"use client";
// S-02 홈: 방 만들기 / 코드 입력. 처음 연 사람에게는 온보딩(S-01)을 먼저 덮어 띄운다. 입장 오류는 spec S-02 표 문구 그대로 (AC-011)
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { ErrorLine, Screen } from "@/components/Screen";
import { FirstOnboarding } from "@/components/settings";
import { joinRoom } from "@/server/actions/join-room";

export function HomeView() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // 닉네임 없이 먼저 들어갈 수 있는지 본다. 이미 들어간 방이면 바로 대기실 (S-02)
      const r = await joinRoom({ code });
      if ("error" in r) return setError(r.error);
      if (r.needNickname) router.push(`/nickname?code=${r.code}`);
      else router.push(`/room/${r.code}`);
    });
  }

  return (
    <Screen
      bottom={
        <Button onClick={() => router.push("/nickname")} disabled={pending}>
          방 만들기
        </Button>
      }
    >
      <FirstOnboarding />
      <h1 className="text-(length:--text-xl)">LAST ONE</h1>

      <form onSubmit={enter} className="flex flex-col gap-(--space-3)">
        <label htmlFor="code" className="text-(length:--text-md)">
          방 코드
        </label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="숫자 6자리"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
          className="min-h-11 rounded-(--radius-md) bg-(--color-surface) px-(--space-3) text-(length:--text-lg) tracking-widest"
        />
        <ErrorLine message={error} />
        <Button type="submit" variant="secondary" disabled={pending || code.length !== 6}>
          들어가기
        </Button>
      </form>
    </Screen>
  );
}

"use client";
// S-02 홈: 방 만들기 / 코드 입력. 처음 연 사람에게는 온보딩(S-01)을 먼저 덮어 띄운다. 입장 오류는 spec S-02 표 문구 그대로 (AC-011)
// 그 앞에 켤 때마다 로고 랜딩 2초 (#146, docs 에 없는 화면을 요청에 따라 더함)
// 위쪽 그래픽 영역에 키 비주얼과 로고 (DESIGN.md §3, ART.md §10, #126). 그림을 못 불러와도 검정 바탕 그대로 동작한다 (PRD §24)
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { ErrorLine, Screen } from "@/components/Screen";
import { FirstOnboarding } from "@/components/settings";
import { Splash } from "@/components/splash";
import { joinRoom } from "@/server/actions/join-room";

export function HomeView() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // 어셋을 못 불러오면 깨진 그림 표시 대신 검정 바탕 그대로, 로고는 글자로 (DESIGN.md §3, PRD §24)
  const [visualFailed, setVisualFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

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
      {/* 켤 때마다 로고 2초 (#146). 온보딩보다 위에 덮고, 닫히면 온보딩이나 홈이 보인다 */}
      <Splash />
      {/* 그래픽 영역: 남는 높이를 다 쓰고 화면 양옆까지 채운다. 그림은 가운데 기준으로 위아래만 잘린다 (ART.md §11) */}
      <div className="relative -mx-(--space-4) -mt-(--space-6) min-h-60 flex-1 overflow-hidden bg-(--color-bg)">
        {!visualFailed && (
          <Image
            src="/images/key-visual-home.webp"
            alt=""
            fill
            sizes="430px"
            loading="eager"
            onError={() => setVisualFailed(true)}
            className="object-cover object-center"
          />
        )}
        {/* 로고는 그림 위쪽 빈 하늘에. 폭 300 (390 기준). 좁은 폰은 영역 폭의 77%, 낮은 폰은 영역 높이의 34% 안으로
            줄어 해와 섬을 덮지 않는다. 비율은 object-contain 으로 지키고 위에 붙인다 */}
        <h1 className="absolute inset-x-0 top-(--space-5) flex h-[34%] justify-center">
          {logoFailed ? (
            <span className="text-(length:--text-xl) font-extrabold">LAST ONE</span>
          ) : (
            <Image
              src="/logo-last-one.svg"
              alt="LAST ONE"
              width={1190}
              height={568}
              unoptimized
              loading="eager"
              onError={() => setLogoFailed(true)}
              className="h-full w-auto max-w-[min(300px,77%)] object-contain object-top"
            />
          )}
        </h1>
      </div>

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

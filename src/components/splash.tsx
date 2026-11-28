"use client";
// 랜딩 (#146): 앱을 켤 때마다(홈을 새로 열 때) LAST ONE 로고만 2초 보여 주고 홈으로 넘어간다.
// docs(PRD, spec)에 없는 화면을 요청에 따라 더했다. 흐름은 "랜딩 → (처음 연 사람은 온보딩) → 홈".
// - 앱 안에서 홈으로 돌아올 때(해설 끝 "홈으로" 등)는 다시 띄우지 않는다: 이 페이지를 연 동안 한 번만 (모듈 변수)
// - 방 링크(/room/…, /nickname?code=…)로 바로 들어오면 홈을 거치지 않으므로 뜨지 않는다
// - 로고는 검정 바탕 위, 폭 150px 이상 (ART.md §12). 못 불러오면 글자로
// - 움직임 줄이기 설정이면 서서히 사라지지 않고 바로 닫힌다 (DESIGN.md §7)
// - 꾸밈이라 화면 읽기 프로그램에는 읽히지 않게 한다 (홈 내용이 바로 읽힌다)
import Image from "next/image";
import { useEffect, useState } from "react";

export const SPLASH_MS = 2000;
const FADE_MS = 240; // --duration-base

// 이 페이지를 연 동안 이미 보여 줬는지. 새로 고치거나 다시 켜면 처음부터
let splashDone = false;

export function Splash() {
  const [step, setStep] = useState<"show" | "fade" | "gone">(() => (splashDone ? "gone" : "show"));
  const [logoFailed, setLogoFailed] = useState(false);

  // 처음 그릴 때 띄웠는지로 정한다. 모듈 변수로 정하면 개발 모드에서 effect 를 두 번 돌릴 때
  // 두 번째에 이미 본 것으로 보고 타이머를 안 걸어 로고가 안 사라진다
  const [showing] = useState(step !== "gone");
  useEffect(() => {
    if (!showing) return;
    splashDone = true;
    const fade = setTimeout(() => setStep("fade"), SPLASH_MS);
    const gone = setTimeout(() => setStep("gone"), SPLASH_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, [showing]);

  if (step === "gone") return null;
  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex items-center justify-center bg-(--color-bg) transition-opacity duration-(--duration-base) motion-reduce:transition-none ${step === "fade" ? "opacity-0" : "opacity-100"}`}
    >
      {logoFailed ? (
        <span className="text-(length:--text-2xl) font-extrabold text-(--color-text)">
          LAST ONE
        </span>
      ) : (
        <Image
          src="/logo-last-one.svg"
          alt=""
          width={1190}
          height={568}
          unoptimized
          priority
          onError={() => setLogoFailed(true)}
          className="h-auto w-[min(260px,70%)]"
        />
      )}
    </div>
  );
}

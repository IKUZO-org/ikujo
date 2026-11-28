"use client";
// 라운드에서 모두 준비 완료를 누르면 "이제 이야기를 나눠 보세요" 토스트를 3초 띄우고,
// 토스트가 사라지면 모든 폰이 같이 "토론 중"이 된다 (#138, docs 에 없는 동작을 요청에 따라 더함).
// 모든 폰은 준비 신호(room:{id} count)를 받고 같은 상태를 다시 읽으므로 거의 같은 순간에 바뀐다.
// 이 폰에서 "아직 다 안 됨"을 본 적이 있을 때만 토스트를 띄운다: 새로 고침 뒤 이미 모두 준비했으면 바로 "토론 중"
import { useEffect, useRef, useState } from "react";

export const TALK_TOAST_MS = 3000; // DESIGN.md §6 Toast "3초 뒤 사라짐"

type Step = { key: string; step: "toast" | "talk" };

/**
 * key: 라운드일 때만 `${gameId}:${phase}`, 아니면 null.
 * allReady: 이번 라운드에 살아 있는 사람이 모두 준비 완료를 눌렀는지
 */
export function useTalk(
  key: string | null,
  allReady: boolean,
): { toast: boolean; talking: boolean } {
  const [step, setStep] = useState<Step | null>(null);
  // 이 라운드에서 "아직 다 안 됨"을 본 적이 있는지
  const waited = useRef<string | null>(null);

  useEffect(() => {
    if (key && !allReady) waited.current = key;
  }, [key, allReady]);

  useEffect(() => {
    if (!key || !allReady) return;
    const fresh = waited.current === key;
    // 상태는 타이머 안에서만 바꾼다 (effect 본문에서 바로 바꾸지 않게)
    const first = setTimeout(() => setStep({ key, step: fresh ? "toast" : "talk" }), 0);
    const done = fresh ? setTimeout(() => setStep({ key, step: "talk" }), TALK_TOAST_MS) : null;
    return () => {
      clearTimeout(first);
      if (done) clearTimeout(done);
    };
  }, [key, allReady]);

  const now = key && allReady && step?.key === key ? step.step : null;
  return { toast: now === "toast", talking: now === "talk" };
}

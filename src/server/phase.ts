// 단계 표와 넘기기 규칙 (spec §1.1). DB, 시계를 모르는 순수 함수라 서버와 테스트가 같이 쓴다.
// 판단에 쓰는 "지금"은 항상 서버 시각을 넘긴다 (폰 시계를 믿지 않는다).

export const PHASES = [
  "intro",
  "secret",
  "r1",
  "r2",
  "r3",
  "vote",
  "revote",
  "reveal",
  "ended",
] as const;
export type Phase = (typeof PHASES)[number];

const MINUTE = 60_000;

// 길이가 있는 단계만. reveal, ended 는 시간으로 넘어가지 않는다
export const PHASE_MS: Partial<Record<Phase, number>> = {
  intro: 3 * MINUTE, // `제안`
  secret: 2 * MINUTE, // `제안`
  r1: 8 * MINUTE,
  r2: 10 * MINUTE,
  r3: 8 * MINUTE,
  vote: 3 * MINUTE,
  revote: 1 * MINUTE, // `제안`
};

// advance 로 넘길 수 있는 다음 단계.
// vote, revote 다음(재투표 / 해설)은 투표 판정이 정한다. 단계 9에서 붙이기 전까지 여기서는 넘기지 않는다.
const NEXT: Partial<Record<Phase, Phase>> = {
  intro: "secret",
  secret: "r1",
  r1: "r2",
  r2: "r3",
  r3: "vote",
};

export function nextPhase(phase: Phase): Phase | null {
  return NEXT[phase] ?? null;
}

export function isPhase(value: unknown): value is Phase {
  return typeof value === "string" && (PHASES as readonly string[]).includes(value);
}

// 모두 누르면 시간 전에도 넘어가는 단계 (intro: 모두 "다음", secret: 모두 "확인했어요").
// r1~r3 는 모두 준비해도 시간으로만 넘어간다: OQ-007 임시 결정 "타이머로만" (spec §9).
const EARLY_ON_ALL_READY: ReadonlySet<Phase> = new Set<Phase>(["intro", "secret"]);

export function roundOf(phase: Phase): 1 | 2 | 3 | null {
  return phase === "r1" ? 1 : phase === "r2" ? 2 : phase === "r3" ? 3 : null;
}

export function endsAtFor(phase: Phase, now: Date): Date | null {
  const ms = PHASE_MS[phase];
  return ms === undefined ? null : new Date(now.getTime() + ms);
}

export type AdvanceInput = {
  current: Phase;
  from: Phase;
  endsAt: Date | null;
  now: Date;
  readyCount: number;
  playerCount: number;
};

export type AdvanceDecision =
  { ok: true; to: Phase } | { ok: false; reason: "stale" | "no_next" | "too_early" };

export function canAdvance(input: AdvanceInput): AdvanceDecision {
  const { current, from, endsAt, now, readyCount, playerCount } = input;
  if (current !== from) return { ok: false, reason: "stale" };
  const to = nextPhase(current);
  if (!to) return { ok: false, reason: "no_next" };
  const timeUp = endsAt !== null && now.getTime() >= endsAt.getTime();
  const allReady = EARLY_ON_ALL_READY.has(current) && playerCount > 0 && readyCount >= playerCount;
  return timeUp || allReady ? { ok: true, to } : { ok: false, reason: "too_early" };
}

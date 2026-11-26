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
// vote, revote 의 reveal 은 기본값이다. 실제로 갈 곳(revote 또는 reveal)은 decideTally 가 정한다
const NEXT: Partial<Record<Phase, Phase>> = {
  intro: "secret",
  secret: "r1",
  r1: "r2",
  r2: "r3",
  r3: "vote",
  vote: "reveal",
  revote: "reveal",
};

export function nextPhase(phase: Phase): Phase | null {
  return NEXT[phase] ?? null;
}

export function isPhase(value: unknown): value is Phase {
  return typeof value === "string" && (PHASES as readonly string[]).includes(value);
}

// 모두 누르면 시간 전에도 넘어가는 단계 (intro: 모두 "다음", secret: 모두 "확인했어요").
// r1~r3 는 모두 준비해도 시간으로만 넘어간다: OQ-007 임시 결정 "타이머로만" (spec §9).
// vote, revote 는 모두 투표하면 넘어간다 (spec §1.1). 이때 readyCount 는 투표 수, playerCount 는 투표할 사람 수
const EARLY_ON_ALL_READY: ReadonlySet<Phase> = new Set<Phase>([
  "intro",
  "secret",
  "vote",
  "revote",
]);

export const isVotePhase = (phase: Phase): phase is "vote" | "revote" =>
  phase === "vote" || phase === "revote";

/** votes.round: 1 투표, 2 재투표 (data §2) */
export const voteRound = (phase: "vote" | "revote"): 1 | 2 => (phase === "vote" ? 1 : 2);

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

export type TallyDecision =
  { to: "revote"; candidates: string[] } | { to: "reveal"; accused: string | null };

/**
 * 판정 (spec S-11). top 은 tally 가 돌려준 최다 득표자 (동점이면 여럿, 아무도 안 찍었으면 빈 배열).
 * - 최다 1명: 그 사람을 지목하고 reveal
 * - vote 에서 동점: 동점자만 후보로 revote (AC-060-2)
 * - revote 에서도 동점, 또는 아무도 안 찍음: 지목 없이 reveal = "방송 중단" (OQ-008 임시 결정)
 */
export function decideTally(phase: "vote" | "revote", top: string[]): TallyDecision {
  if (top.length === 1) return { to: "reveal", accused: top[0] };
  if (top.length > 1 && phase === "vote") return { to: "revote", candidates: [...top] };
  return { to: "reveal", accused: null };
}

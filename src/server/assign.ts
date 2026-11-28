// 배정 (spec §5, FR-020). 규칙 배정, AI 배정(CAG), 서버 규칙 검사.
// 배정은 먼저 "인물 기준 계획(Plan)"으로 만들고, 검사를 통과하면 플레이어 행으로 바꾼다.
// Plan 모양은 spec §5 의 LLM 출력과 같다: { culprit, victim, seats, clues } 모두 시나리오 안의 ID.
import { z } from "zod";
import { charactersFor, unsupportedCulprits, type PlayerCount } from "@/lib/scenario/check";
import type { Scenario } from "@/lib/scenario/schema";
import type { NewGame } from "./rooms/store";

export const ROUNDS = ["r1", "r2", "r3"] as const;
export type RoundKey = (typeof ROUNDS)[number];

export type SeatedPlayer = { id: string; seat: number };

/** 라운드별 개인 단서: { 인물 ID: [단서 ID] } */
const roundClues = z.record(z.string(), z.array(z.string()));

/** spec §5-3: LLM 이 돌려주는 JSON (스키마 고정). 규칙 배정도 같은 모양 */
export const planSchema = z.object({
  culprit: z.string(),
  victim: z.string(),
  seats: z.array(z.object({ playerSeat: z.number().int(), character: z.string() })),
  clues: z.object({ r1: roundClues, r2: roundClues, r3: roundClues }).strict(),
});
export type Plan = z.infer<typeof planSchema>;

export type Assignment = Pick<NewGame, "secret" | "assignments">;

// 이 인원에서 고를 수 있는 범인 (BR-003 핵심 인물 + BR-006, OQ-013: 특징 해당 2명 미만이면 제외)
export function culpritCandidates(scenario: Scenario, n: PlayerCount) {
  const blocked = new Set(
    unsupportedCulprits(scenario)
      .filter((u) => u.players === n)
      .map((u) => u.culprit),
  );
  const core = new Set(scenario.characters.filter((c) => c.core).map((c) => c.id));
  return scenario.culprits.filter((c) => core.has(c.character) && !blocked.has(c.character));
}

/**
 * 다시 하기 때 지난 판 범인은 고르지 않는다. 다른 후보가 없으면 그대로 둔다.
 * spec §5-2 "지난 판 범인(같은 무리 연속이면 피하기 `제안`)" 을 따른다
 */
export function avoidPrevious<T extends { character: string }>(
  candidates: T[],
  previous: string | null,
): T[] {
  const rest = candidates.filter((c) => c.character !== previous);
  return rest.length > 0 ? rest : candidates;
}

// 규칙 배정 -------------------------------------------------------------------

/** 규칙만으로 무작위 배정 (BR-002~006). AI 가 실패하거나 느릴 때도 쓴다 (NFR-003) */
export function assignByRule(
  scenario: Scenario,
  players: SeatedPlayer[],
  random: () => number,
  previousCulprit: string | null = null,
): Plan {
  const n = players.length as PlayerCount;
  // 등장인물: 핵심 4 + (n≥5 인플) + (n=6 의료) (BR-002)
  const characters = charactersFor(scenario, n);
  const candidates = avoidPrevious(culpritCandidates(scenario, n), previousCulprit);
  if (candidates.length === 0) throw new Error(`인원 ${n}명에서 고를 수 있는 범인이 없어요`);
  const culprit = pick(candidates, random).character;

  // 희생자는 범인이 아닌 핵심 인물 중 무작위 (BR-004)
  const victim = pick(
    characters.filter((c) => c.core && c.id !== culprit),
    random,
  ).id;

  // 자리 배정(누가 어느 인물)은 무작위 (spec §5-6)
  const shuffled = shuffle(characters, random);
  const seats = players.map((p, i) => ({ playerSeat: p.seat, character: shuffled[i].id }));

  const present = new Set(characters.map((c) => c.id));
  return {
    culprit,
    victim,
    seats,
    clues: distributeClues(scenario, present, culprit, victim, random),
  };
}

/**
 * 개인 단서 배분 (spec §5-4 "개인 단서는 그 라운드에 정해진 수만큼, 레드 헤링 포함").
 * "정해진 수"는 문서에 없다 → 임시: 이번 판에 맞는 개인 단서를 전부 쓰고, 단서 하나에 받는 사람 1명.
 *   - 맞는 단서: 이번 범인을 가리키는 단서(레드 헤링 아님) + 이 판에 있는 인물을 가리키는 레드 헤링
 *   - 받는 사람: 단서의 for 중 이 판에 있는 인물. r2 부터 희생자(유령)는 빼고, 덜 받은 사람부터
 */
function distributeClues(
  scenario: Scenario,
  present: Set<string>,
  culprit: string,
  victim: string,
  random: () => number,
): Plan["clues"] {
  const out = { r1: {}, r2: {}, r3: {} } as Plan["clues"];
  const given = new Map<string, number>();
  for (const [i, key] of ROUNDS.entries()) {
    const round = i + 1;
    const clues = shuffle(
      scenario.clues.filter(
        (c) => c.round === round && c.visibility === "private" && fitsGame(c, present, culprit),
      ),
      random,
    );
    for (const clue of clues) {
      const recipients = (clue.for ?? []).filter(
        (ch) => present.has(ch) && !(round >= 2 && ch === victim),
      );
      if (recipients.length === 0) continue;
      const least = Math.min(...recipients.map((ch) => given.get(ch) ?? 0));
      const to = pick(
        recipients.filter((ch) => (given.get(ch) ?? 0) === least),
        random,
      );
      given.set(to, least + 1);
      (out[key][to] ??= []).push(clue.id);
    }
  }
  return out;
}

/**
 * 이 판에 줘도 되는 단서인가: 레드 헤링은 있는 인물을 가리켜야, 아니면 이번 범인을 가리켜야.
 * 알리바이 증거(clears, D-032)는 그 인물이 이 판에 있고 범인이 아닐 때만
 */
function fitsGame(clue: Scenario["clues"][number], present: Set<string>, culprit: string): boolean {
  if (clue.clears) return clue.clears.every((c) => present.has(c) && c !== culprit);
  const points = clue.pointsTo ?? [];
  if (clue.redHerring) return points.some((p) => present.has(p));
  // 다른 범인일 때의 증거를 주면 틀린 사실이 된다 `제안` (공정, PRD G-4)
  return points.length === 0 || points.includes(culprit);
}

// 검사 ------------------------------------------------------------------------

/**
 * 서버 규칙 검사 (BR-014). 통과한 배정만 쓴다. 문제를 한국어 목록으로 돌려준다 (빈 목록이면 통과).
 * BR-002 인물 구성, BR-003 범인, BR-004 희생자, BR-006 특징, AC-020-4 없는 ID
 */
export function validateAssignment(
  scenario: Scenario,
  players: SeatedPlayer[],
  input: unknown,
): string[] {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return [`형식: ${parsed.error.issues[0].message}`];
  const plan = parsed.data;
  const errors: string[] = [];
  const n = players.length;
  if (n < 4 || n > 6) return [`인원: ${n}`];

  const all = new Map(scenario.characters.map((c) => [c.id, c]));
  const present = new Set(charactersFor(scenario, n as PlayerCount).map((c) => c.id));

  // 자리: 모든 플레이어 자리에 한 번씩, 인물은 이 인원의 등장인물과 정확히 같게 (BR-002)
  const seats = new Set(players.map((p) => p.seat));
  const planSeats = plan.seats.map((s) => s.playerSeat);
  if (
    planSeats.length !== n ||
    new Set(planSeats).size !== n ||
    planSeats.some((s) => !seats.has(s))
  )
    errors.push("자리: 플레이어 자리와 맞지 않음");
  for (const s of plan.seats) if (!all.has(s.character)) errors.push(`없는 인물: ${s.character}`);
  const seated = new Set(plan.seats.map((s) => s.character));
  if (seated.size !== plan.seats.length || [...present].some((c) => !seated.has(c)))
    errors.push("인물: 이 인원의 등장인물과 맞지 않음");

  // 범인: 핵심 인물, 이 판에 있음, 특징 해당 2명 이상 (BR-003, BR-006)
  if (!all.has(plan.culprit)) errors.push(`없는 인물: ${plan.culprit}`);
  else if (!culpritCandidates(scenario, n as PlayerCount).some((c) => c.character === plan.culprit))
    errors.push(`범인: ${plan.culprit} 은 이 인원에서 고를 수 없음`);

  // 희생자: 범인이 아닌 핵심 인물 (BR-004)
  if (!all.has(plan.victim)) errors.push(`없는 인물: ${plan.victim}`);
  else if (!all.get(plan.victim)!.core || plan.victim === plan.culprit || !present.has(plan.victim))
    errors.push(`희생자: ${plan.victim} 은 범인이 아닌 핵심 인물이어야 함`);

  // 단서: 있는 ID, 개인 단서, 그 라운드, 받는 사람이 있는 인물이고 for 에 있음, 한 번만 (AC-020-4)
  const clues = new Map(scenario.clues.map((c) => [c.id, c]));
  const used = new Set<string>();
  for (const [i, key] of ROUNDS.entries()) {
    for (const [ch, ids] of Object.entries(plan.clues[key])) {
      if (!present.has(ch)) errors.push(`단서 받는 인물이 이 판에 없음: ${ch}`);
      for (const id of ids) {
        const clue = clues.get(id);
        if (!clue) {
          errors.push(`없는 단서: ${id}`);
          continue;
        }
        if (clue.visibility !== "private" || clue.round !== i + 1)
          errors.push(`단서 ${id}: ${key} 개인 단서가 아님`);
        if (!(clue.for ?? []).includes(ch)) errors.push(`단서 ${id}: ${ch} 가 받을 수 없음`);
        if (!fitsGame(clue, present, plan.culprit)) errors.push(`단서 ${id}: 이번 판과 맞지 않음`);
        if (used.has(id)) errors.push(`단서 ${id}: 두 번 줌`);
        used.add(id);
      }
    }
  }
  return errors;
}

/** 검사를 통과한 Plan 을 플레이어 행(assignments, game_secrets)으로 */
export function toAssignment(scenario: Scenario, players: SeatedPlayer[], plan: Plan): Assignment {
  const bySeat = new Map(players.map((p) => [p.seat, p.id]));
  const assignments = plan.seats.map((s) => {
    const secret = scenario.secrets.find((x) => x.character === s.character);
    const alibi = scenario.alibis.find((x) => x.character === s.character);
    if (!secret || !alibi) throw new Error(`${s.character} 의 비밀이나 알리바이가 없어요`);
    return {
      playerId: bySeat.get(s.playerSeat)!,
      characterId: s.character,
      secretId: secret.id,
      alibiId: alibi.id,
      isCulprit: s.character === plan.culprit,
      clueIds: Object.fromEntries(
        ROUNDS.map((r) => [r, plan.clues[r][s.character] ?? []]),
      ) as Record<RoundKey, string[]>,
    };
  });
  const playerOf = (ch: string) => assignments.find((a) => a.characterId === ch)!.playerId;
  return {
    secret: {
      culpritPlayerId: playerOf(plan.culprit),
      victimPlayerId: playerOf(plan.victim),
      culpritCharacter: plan.culprit,
      ghostTrait: scenario.culprits.find((c) => c.character === plan.culprit)!.trait,
      llmRaw: null,
    },
    assignments,
  };
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

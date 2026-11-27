// AI 배정 (spec §5, CAG, D-011, D-020) 과 AI → 규칙 배정 흐름 (NFR-003).
// 모델은 인터페이스로 받는다. 실제 LLM 연결(SDK, 키)은 OQ-003(모델 미정)이 정해진 뒤 llm.ts 에서.
import { charactersFor, type PlayerCount } from "@/lib/scenario/check";
import {
  assignByRule,
  avoidPrevious,
  culpritCandidates,
  planSchema,
  toAssignment,
  validateAssignment,
  type Assignment,
  type SeatedPlayer,
} from "./assign";
import type { Scenario } from "@/lib/scenario/schema";

export type ModelRequest = {
  /** 규칙 요약 (고정) */
  system: string;
  /** 고정 맥락: 시나리오 JSON 전체. 판마다 같아서 프롬프트 캐시 대상 */
  context: string;
  /** 가변 입력: 인원, 등장인물 ID, 자리 번호 */
  input: string;
  signal: AbortSignal;
};

/** LLM 한 번 부르기. 글(JSON 이어야 함)을 돌려준다 */
export type AssignModel = { name: string; complete(req: ModelRequest): Promise<string> };

export const ASSIGN_SYSTEM = [
  "너는 머더 미스터리 「LAST ONE」의 진행자다. 아래 시나리오 JSON 안의 ID만 골라 이번 판 배정을 정한다.",
  "새 인물, 새 단서, 새 사실을 지어내지 않는다 (CAG).",
  "규칙: 등장인물은 입력의 characters 전부, 자리(playerSeat)마다 한 명씩.",
  "범인(culprit)은 입력의 culpritCandidates 중 하나. 희생자(victim)는 범인이 아닌 핵심 인물(core).",
  "clues 는 r1, r2, r3 마다 { 인물 ID: [개인 단서 ID] }. 그 라운드의 개인(private) 단서만, 단서의 for 에 있는 인물에게만, 한 단서는 한 번만.",
  "레드 헤링(redHerring)은 이 판에 있는 인물을 가리키는 것만, 그 밖의 단서는 이번 범인을 가리키는 것만.",
  '출력은 JSON 하나만: {"culprit":"","victim":"","seats":[{"playerSeat":1,"character":""}],"clues":{"r1":{},"r2":{},"r3":{}}}',
].join("\n");

/**
 * AI 한 번: 프롬프트를 만들고, 응답을 Plan 으로 읽고, 서버 규칙 검사를 한다.
 * 플레이어 닉네임 같은 사용자 글은 넣지 않는다 (프롬프트 주입, SECURITY.md §3)
 */
export async function assignByAI(
  scenario: Scenario,
  players: SeatedPlayer[],
  model: AssignModel,
  signal: AbortSignal,
  culpritCandidates: string[],
): Promise<{ assignment: Assignment | null; raw: string; errors: string[] }> {
  const input = JSON.stringify({
    players: players.length,
    seats: players.map((p) => p.seat),
    characters: charactersFor(scenario, players.length as PlayerCount).map((c) => c.id),
    culpritCandidates,
  });
  const raw = await model.complete({
    system: ASSIGN_SYSTEM,
    context: JSON.stringify(scenario),
    input,
    signal,
  });

  let json: unknown;
  try {
    json = JSON.parse(stripFence(raw));
  } catch {
    return { assignment: null, raw, errors: ["형식: JSON 이 아님"] };
  }
  const errors = validateAssignment(scenario, players, json);
  if (errors.length > 0) return { assignment: null, raw, errors };
  return { assignment: toAssignment(scenario, players, planSchema.parse(json)), raw, errors };
}

export type Chosen = { assignment: Assignment; source: "ai" | "rule" };

/**
 * startGame 의 배정 (spec §5-5, NFR-003):
 * AI 1번 → 검사 실패면 1번 더 → 2번 실패 또는 15초 초과면 규칙 배정.
 * 모델이 없으면(키 없음, OQ-003) 바로 규칙 배정.
 */
export async function chooseAssignment(opts: {
  scenario: Scenario;
  players: SeatedPlayer[];
  model: AssignModel | null;
  random: () => number;
  timeoutMs?: number;
  /** 다시 하기의 지난 판 범인 인물 ID. 이번 판 범인 후보에서 뺀다 (spec §5-2) */
  previousCulprit?: string | null;
}): Promise<Chosen> {
  const { scenario, players, model, random, timeoutMs = 15_000, previousCulprit = null } = opts;
  const rule = (): Chosen => ({
    assignment: toAssignment(
      scenario,
      players,
      assignByRule(scenario, players, random, previousCulprit),
    ),
    source: "rule",
  });
  if (!model) return rule();

  const candidates = culpritIds(scenario, players, previousCulprit);
  const controller = new AbortController();
  const attempts: { raw: string | null; errors: string[] }[] = [];

  const tryAi = async (): Promise<Chosen | null> => {
    for (let i = 0; i < 2 && !controller.signal.aborted; i++) {
      try {
        const r = await assignByAI(scenario, players, model, controller.signal, candidates);
        attempts.push({ raw: r.raw, errors: r.errors });
        if (r.assignment) return { assignment: r.assignment, source: "ai" };
      } catch (e) {
        attempts.push({
          raw: null,
          errors: [`호출 실패: ${e instanceof Error ? e.name : "error"}`],
        });
      }
    }
    return null;
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      attempts.push({ raw: null, errors: [`시간 초과 ${timeoutMs}ms`] });
      resolve(null);
    }, timeoutMs);
  });

  const chosen = await Promise.race([tryAi(), timeout]);
  clearTimeout(timer);
  const result = chosen ?? rule();
  // 검사 실패 원인을 보려고 AI 응답 원문을 남긴다 (data §2 game_secrets.llm_raw). 서버만 읽는다
  result.assignment.secret.llmRaw = { model: model.name, attempts };
  return result;
}

// 규칙 배정, 검사와 같은 범인 후보 (BR-003, BR-006, OQ-013)
function culpritIds(
  scenario: Scenario,
  players: SeatedPlayer[],
  previousCulprit: string | null,
): string[] {
  return avoidPrevious(
    culpritCandidates(scenario, players.length as PlayerCount),
    previousCulprit,
  ).map((c) => c.character);
}

/** ```json ... ``` 으로 감싸 오면 벗긴다 */
function stripFence(raw: string): string {
  const m = raw.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : raw.trim();
}

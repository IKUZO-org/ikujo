// 해설 카드 만들기 (spec S-12, FR-070). DB 를 모르는 순수 함수라 서버와 테스트가 같이 쓴다.
// 카드 1~7, 9 는 시나리오와 판정으로만 만든다 (LLM 없이도 나옴). 8 맞춤 해설만 LLM (D-014)
import type { Scenario } from "@/lib/scenario/schema";
import type { AssignModel } from "./assign-ai";

/** 해설에서 사람을 부르는 이름: 닉네임 + 이번 판 인물 이름 */
export type Who = { nickname: string; character: string };

/** reveals.body (data §2). 카드 번호는 S-12 순서 */
export type RevealBody = {
  /**
   * 1 엔딩 (FR-061). culpritLeft: 범인이 나가 판정 없이 온 해설 (D-025). 이때 votes, solvers 는 비고
   * 화면이 카드 3, 9 를 뺀다. 이 값이 생기기 전에 만든 해설에는 없다
   */
  ending: { outcome: "caught" | "aired_off"; text: string; culpritLeft?: boolean };
  /** 2 범인과 동기 */
  culprit: { who: Who; motive: string };
  /** 3 투표 결과. 재투표가 있으면 둘 다, round 순서 */
  votes: { round: 1 | 2; picks: { voter: Who; target: Who }[] }[];
  /** 4 진실 타임라인과 범인의 결정적 실수 */
  timeline: { at: string; text: string }[];
  mistake: string;
  /** 5 유령이 본 장면: 범인 특징과 그 특징이 해당한 이번 판 인물 */
  ghost: { trait: string; matches: Who[]; seenBy: Who | null };
  /** 6 레드 헤링 전부 (BR-010) */
  redHerrings: { clue: string; suspect: string; truth: string }[];
  /** 7 과거 사고의 진실 */
  pastTruth: string;
  /** 9 정확히 추리한 사람 = 마지막 투표에서 범인을 지목한 사람 (D-015, AC-071). 없으면 빈 배열 */
  solvers: Who[];
};

export type RevealInput = {
  outcome: "caught" | "aired_off";
  culpritPlayerId: string;
  culpritCharacter: string;
  ghostTrait: string;
  /** 이번 판 배정 받은 사람. left: 지금 나가 있음 */
  players: { id: string; nickname: string; characterId: string; isGhost: boolean; left: boolean }[];
  votes: { round: 1 | 2; voterId: string; targetId: string }[];
  /** 재투표가 있었는지 (games.revote_candidates) */
  revoted: boolean;
  /** 범인이 나가 판정 전에 끝났는지 (games.ended_reason = culprit_left, D-025) */
  culpritLeft: boolean;
};

export function buildReveal(scenario: Scenario, input: RevealInput): RevealBody {
  const charName = new Map(scenario.characters.map((c) => [c.id, c.name]));
  const byId = new Map(input.players.map((p) => [p.id, p]));
  const who = (id: string): Who | null => {
    const p = byId.get(id);
    return p ? { nickname: p.nickname, character: charName.get(p.characterId) ?? "" } : null;
  };
  const culprit = scenario.culprits.find((c) => c.character === input.culpritCharacter);
  if (!culprit) throw new Error(`시나리오에 없는 범인: ${input.culpritCharacter}`);

  // 판정과 같은 기준: 판정 순간 접속한 사람의 표만 (D-022). reveal 은 판정 바로 뒤에 만든다
  // 범인이 판정 전에 나갔으면 투표 결과와 맞힌 사람은 없다. vote, revote 중이라 낸 표가 있어도 판정이
  // 나지 않았으니 뺀다 (D-025 는 "투표 전"까지만 정함, #72 `제안`)
  const counted = input.culpritLeft
    ? []
    : input.votes.filter((v) => byId.has(v.voterId) && !byId.get(v.voterId)!.left);
  const rounds: (1 | 2)[] = input.culpritLeft ? [] : input.revoted ? [1, 2] : [1];
  const votes = rounds.map((round) => ({
    round,
    picks: counted
      .filter((v) => v.round === round)
      .flatMap((v) => {
        const voter = who(v.voterId);
        const target = who(v.targetId);
        return voter && target ? [{ voter, target }] : [];
      }),
  }));
  // 재투표가 있었으면 마지막 투표 기준 (FR-071, AC-071)
  const lastRound = rounds.at(-1);
  const solvers = counted
    .filter((v) => v.round === lastRound && v.targetId === input.culpritPlayerId)
    .flatMap((v) => who(v.voterId) ?? []);

  // 시나리오에 "의미" 설명 글이 없어 특징 글과 해당 인물로만 만든다
  const trait = scenario.traits.find((t) => t.id === input.ghostTrait);
  // 유령은 자기 자신을 스칠 수 없다 (D-030 으로 특징을 나눠 가진 인물이 늘어 유령도 해당할 수 있다)
  const matches = input.players
    .filter((p) => !p.isGhost && trait?.characters.includes(p.characterId))
    .flatMap((p) => who(p.id) ?? []);
  const ghost = input.players.find((p) => p.isGhost);

  const clueText = new Map(scenario.clues.map((c) => [c.id, c.text]));
  return {
    ending: {
      outcome: input.outcome,
      text: scenario.reveal.endings[input.outcome],
      culpritLeft: input.culpritLeft,
    },
    culprit: { who: who(input.culpritPlayerId)!, motive: culprit.motive },
    votes,
    timeline: scenario.timeline,
    mistake: culprit.mistake,
    ghost: { trait: trait?.text ?? "", matches, seenBy: ghost ? who(ghost.id) : null },
    redHerrings: scenario.redHerrings.map((r) => ({
      clue: clueText.get(r.clue) ?? "",
      suspect: charName.get(r.suspect) ?? "",
      truth: r.truth,
    })),
    pastTruth: scenario.reveal.pastTruth,
    solvers,
  };
}

// 8 맞춤 해설 (D-014, spec §5) -------------------------------------------------------

export const PERSONAL_MAX = 400; // `제안` (spec §5)

export const PERSONAL_SYSTEM = [
  "너는 머더 미스터리 「LAST ONE」의 진행자다. 판이 끝났고 모두에게 해설을 들려준다.",
  "아래 시나리오 JSON 과 이번 판 배정, 투표만 근거로, 이번 판에서 누가 무엇을 숨겼고 왜 의심받았는지 이야기한다.",
  "시나리오와 입력에 없는 사실, 인물, 사건을 지어내지 않는다.",
  "사람은 인물 이름으로만 부른다.",
  `한국어 평서문, ${PERSONAL_MAX}자 이내, 글만 (머리말, 목록, 마크다운 없이).`,
].join("\n");

/**
 * 맞춤 해설 입력. 고정 맥락(시나리오 전체)은 배정과 같다 (CAG).
 * 닉네임 같은 사용자 글은 넣지 않고 인물 ID 로만 (프롬프트 주입, SECURITY.md §3)
 */
export function personalInput(
  input: RevealInput,
  secrets: { characterId: string; secretId: string }[],
): string {
  const ch = new Map(input.players.map((p) => [p.id, p.characterId]));
  return JSON.stringify({
    culprit: input.culpritCharacter,
    outcome: input.outcome,
    ghost: input.players.find((p) => p.isGhost)?.characterId ?? null,
    characters: secrets,
    votes: input.votes.map((v) => ({
      round: v.round,
      voter: ch.get(v.voterId),
      target: ch.get(v.targetId),
    })),
  });
}

/** LLM 한 번. 실패, 빈 글, 400자 초과는 null (화면에서 카드 8을 뺀다) */
export async function writePersonal(
  scenario: Scenario,
  model: AssignModel | null,
  input: string,
  timeoutMs = 20_000,
): Promise<string | null> {
  if (!model) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const raw = await model.complete({
      system: PERSONAL_SYSTEM,
      context: JSON.stringify(scenario),
      input,
      signal: controller.signal,
    });
    const text = raw.trim();
    return text.length > 0 && text.length <= PERSONAL_MAX ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

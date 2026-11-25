// 규칙 배정 스텁 (단계 4). spec §5 의 LLM 배정, 단서 배분, 재시도는 단계 5에서 만든다.
// 지금은 startGame 이 판을 만들 수 있을 만큼만: 인물, 범인, 희생자, 비밀, 알리바이.
import { charactersFor, unsupportedCulprits, type PlayerCount } from "@/lib/scenario/check";
import type { Scenario } from "@/lib/scenario/schema";
import type { NewGame } from "./rooms/store";

export type Assignment = Pick<NewGame, "secret" | "assignments">;

export function ruleAssignStub(
  scenario: Scenario,
  playerIds: string[],
  random: () => number,
): Assignment {
  const n = playerIds.length as PlayerCount;
  // 등장인물: 핵심 4 + (n≥5 인플) + (n=6 의료) (BR-002)
  const characters = charactersFor(scenario, n);
  if (characters.length !== n) throw new Error(`인원 ${n}명에 맞는 인물이 없어요`);

  // OQ-013: 특징 해당 인원이 2명 미만인 범인은 이 인원에서 고르지 않는다 (spec §9)
  const blocked = new Set(
    unsupportedCulprits(scenario)
      .filter((u) => u.players === n)
      .map((u) => u.culprit),
  );
  const candidates = scenario.culprits.filter((c) => !blocked.has(c.character));
  if (candidates.length === 0) throw new Error(`인원 ${n}명에서 고를 수 있는 범인이 없어요`);
  const culprit = pick(candidates, random);

  // 희생자는 범인이 아닌 핵심 인물 (BR-004)
  const victimCharacter = pick(
    characters.filter((c) => c.core && c.id !== culprit.character),
    random,
  ).id;

  // 자리 배정(누가 어느 인물)은 무작위 (spec §5-6)
  const shuffled = shuffle(characters, random);
  const assignments = playerIds.map((playerId, i) => {
    const characterId = shuffled[i].id;
    const secret = scenario.secrets.find((s) => s.character === characterId);
    const alibi = scenario.alibis.find((a) => a.character === characterId);
    if (!secret || !alibi) throw new Error(`${characterId} 의 비밀이나 알리바이가 없어요`);
    return {
      playerId,
      characterId,
      secretId: secret.id,
      alibiId: alibi.id,
      isCulprit: characterId === culprit.character,
    };
  });

  const playerOf = (characterId: string) =>
    assignments.find((a) => a.characterId === characterId)!.playerId;

  return {
    secret: {
      culpritPlayerId: playerOf(culprit.character),
      victimPlayerId: playerOf(victimCharacter),
      culpritCharacter: culprit.character,
      ghostTrait: culprit.trait,
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

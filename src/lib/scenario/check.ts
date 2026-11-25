import { scenarioSchema, type Character, type Scenario } from "./schema";

export const PLAYER_COUNTS = [4, 5, 6] as const;
export type PlayerCount = (typeof PLAYER_COUNTS)[number];

/** 이 인원 판에 나오는 인물: 핵심 전부 + minPlayers 가 인원 이하인 인물 (BR-002) */
export function charactersFor(scenario: Scenario, n: PlayerCount): Character[] {
  return scenario.characters
    .filter((c) => c.core || (c.minPlayers !== undefined && c.minPlayers <= n))
    .sort((a, b) => a.order - b.order);
}

/** 이 인원에서 고를 수 없는 범인. 특징 해당 인원이 2명 미만 (BR-006) */
export type UnsupportedCulprit = {
  players: PlayerCount;
  culprit: string;
  trait: string;
  holders: string[];
};

export type ScenarioCheck = {
  ok: boolean;
  /** 고쳐야 머지되는 문제 (형식, ID 겹침, 없는 ID 참조) */
  errors: string[];
  /**
   * 인원별로 고를 수 없는 범인 조합. 오류가 아니다:
   * OQ-013 임시 결정(spec §9)대로 배정에서 그 범인을 빼면 된다
   */
  unsupported: UnsupportedCulprit[];
};

export function checkScenario(input: unknown): ScenarioCheck {
  const parsed = scenarioSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `형식: ${i.path.join(".") || "(루트)"} ${i.message}`,
    );
    return { ok: false, errors, unsupported: [] };
  }
  const s = parsed.data;
  const errors: string[] = [];

  // ID 겹침
  const seen = new Set<string>();
  const ids = [
    ...s.characters.map((c) => c.id),
    ...s.secrets.map((x) => x.id),
    ...s.alibis.map((x) => x.id),
    ...s.traits.map((x) => x.id),
    ...s.clues.map((x) => x.id),
  ];
  for (const x of ids) {
    if (seen.has(x)) errors.push(`ID 겹침: ${x}`);
    seen.add(x);
  }
  dupes(
    s.culprits.map((c) => c.character),
    "범인 겹침",
    errors,
  );
  dupes(
    s.rounds.map((r) => String(r.round)),
    "라운드 겹침",
    errors,
  );
  dupes(
    s.redHerrings.map((r) => r.clue),
    "레드 헤링 겹침",
    errors,
  );

  // 없는 ID 참조
  const chars = new Set(s.characters.map((c) => c.id));
  const traits = new Set(s.traits.map((t) => t.id));
  const clues = new Map(s.clues.map((c) => [c.id, c]));
  const rounds = new Set(s.rounds.map((r) => r.round));
  const char = (ref: string, where: string) => {
    if (!chars.has(ref)) errors.push(`없는 인물: ${ref} (${where})`);
  };

  for (const x of s.secrets) char(x.character, `secrets ${x.id}`);
  for (const x of s.alibis) char(x.character, `alibis ${x.id}`);
  for (const t of s.traits) for (const c of t.characters) char(c, `traits ${t.id}`);
  for (const p of s.pairs) {
    char(p.a, `pairs ${p.a}-${p.b}`);
    char(p.b, `pairs ${p.a}-${p.b}`);
  }
  for (const c of s.culprits) {
    char(c.character, "culprits");
    if (!traits.has(c.trait)) errors.push(`없는 특징: ${c.trait} (culprits ${c.character})`);
    // 범인은 핵심 인물 중에서 (BR-003)
    const ch = s.characters.find((x) => x.id === c.character);
    if (ch && !ch.core) errors.push(`범인은 핵심 인물만: ${c.character}`);
  }
  for (const c of s.clues) {
    for (const f of c.for ?? []) char(f, `clues ${c.id} for`);
    for (const p of c.pointsTo ?? []) char(p, `clues ${c.id} pointsTo`);
    if (!rounds.has(c.round)) errors.push(`없는 라운드: ${c.round} (clues ${c.id})`);
  }
  for (const r of s.redHerrings) {
    char(r.suspect, `redHerrings ${r.clue}`);
    const clue = clues.get(r.clue);
    if (!clue) errors.push(`없는 단서: ${r.clue} (redHerrings)`);
    else if (!clue.redHerring) errors.push(`레드 헤링 표시 없음: ${r.clue}`);
  }
  // 해설에서 레드 헤링을 전부 설명한다 (BR-010)
  const explained = new Set(s.redHerrings.map((r) => r.clue));
  for (const c of s.clues) {
    if (c.redHerring && !explained.has(c.id)) errors.push(`레드 헤링 해설 없음: ${c.id}`);
  }

  // 비밀은 인물마다 기본 1개 (D-016)
  for (const c of s.characters) {
    if (!s.secrets.some((x) => x.character === c.id)) errors.push(`비밀 없음: ${c.id}`);
  }

  return { ok: errors.length === 0, errors, unsupported: unsupportedCulprits(s) };
}

// OQ-013: 4~5명 판에서 특징이 1명에게만 해당하는 범인은 그 인원에서 고르지 않는다 (spec §9 임시 결정)
export function unsupportedCulprits(s: Scenario): UnsupportedCulprit[] {
  const out: UnsupportedCulprit[] = [];
  for (const n of PLAYER_COUNTS) {
    const present = new Set(charactersFor(s, n).map((c) => c.id));
    for (const c of s.culprits) {
      if (!present.has(c.character)) continue;
      const trait = s.traits.find((t) => t.id === c.trait);
      const holders = (trait?.characters ?? []).filter((x) => present.has(x));
      if (holders.length < 2) {
        out.push({ players: n, culprit: c.character, trait: c.trait, holders });
      }
    }
  }
  return out;
}

function dupes(values: string[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) errors.push(`${label}: ${v}`);
    seen.add(v);
  }
}

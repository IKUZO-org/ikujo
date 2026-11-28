import { describe, expect, it, vi } from "vitest";
import liveDeath from "../scenarios/live-death.json";
import { scenarioSchema } from "@/lib/scenario/schema";
import {
  assignByRule,
  toAssignment,
  validateAssignment,
  type Plan,
  type SeatedPlayer,
} from "@/server/assign";
import { chooseAssignment, type AssignModel } from "@/server/assign-ai";

const scenario = scenarioSchema.parse(liveDeath);
const CORE = ["fav", "villain", "athlete", "writer"];

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

const playersOf = (n: number): SeatedPlayer[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, seat: i + 1 }));

/** 가짜 모델: 정해 둔 응답을 차례로 돌려준다 */
function fakeModel(...replies: (string | Error | (() => Promise<string>))[]): AssignModel & {
  calls: number;
} {
  const m = {
    name: "fake",
    calls: 0,
    async complete() {
      const r = replies[Math.min(m.calls++, replies.length - 1)];
      if (r instanceof Error) throw r;
      return typeof r === "function" ? r() : r;
    },
  };
  return m;
}

const goodPlan = (n: number, seed = 1): Plan => assignByRule(scenario, playersOf(n), seeded(seed));

describe("assignByRule: 인원별 100판 (AC-020-1~3)", () => {
  it.each([4, 5, 6])("%i명", (n) => {
    const before = JSON.stringify(scenario);
    const players = playersOf(n);
    const culprits = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const plan = assignByRule(scenario, players, seeded(seed));
      expect(validateAssignment(scenario, players, plan)).toEqual([]);

      const chars = plan.seats.map((s) => s.character);
      // AC-020-1: 4명이면 핵심 4명만, 범인은 그중 하나
      if (n === 4) expect(chars.sort()).toEqual([...CORE].sort());
      expect(CORE).toContain(plan.culprit);
      // AC-020-2: 희생자는 범인이 아닌 핵심 인물 (추가 인물은 희생자가 아님)
      expect(CORE).toContain(plan.victim);
      expect(plan.victim).not.toBe(plan.culprit);
      culprits.add(plan.culprit);
    }
    // AC-020-3: 100판을 배정해도 사건 뼈대(시각, 수법)는 그대로
    expect(JSON.stringify(scenario)).toBe(before);
    expect(scenario.timeline.map((t) => t.at)).toEqual([
      "21:30",
      "21:50",
      "22:00",
      "22:00~22:10",
      "22:12",
      "22:30",
      "R2",
    ]);
    // D-030: 특징 해당자를 늘려 4~6명 모두 범인 넷 다 고를 수 있다
    expect([...culprits].sort()).toEqual([...CORE].sort());
  });

  it("개인 단서: 범인을 가리키는 단서와 레드 헤링만, r2부터 희생자는 안 받음", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const plan = goodPlan(6, seed);
      for (const [i, key] of (["r1", "r2", "r3"] as const).entries()) {
        for (const [ch, ids] of Object.entries(plan.clues[key])) {
          if (i >= 1) expect(ch).not.toBe(plan.victim);
          for (const id of ids) {
            const clue = scenario.clues.find((c) => c.id === id)!;
            expect(clue.redHerring || clue.pointsTo?.includes(plan.culprit) || !!clue.clears).toBe(
              true,
            );
          }
        }
      }
    }
  });

  it.each([4, 5, 6])(
    "D-032 알리바이 퍼즐 %i명: 범인이 아닌 사람의 증거만, 본인 말고 다른 사람에게",
    (n) => {
      for (let seed = 1; seed <= 100; seed++) {
        const plan = goodPlan(n, seed);
        const present = new Set(plan.seats.map((s) => s.character));
        const given = new Map<string, string>();
        for (const r of Object.values(plan.clues))
          for (const [ch, ids] of Object.entries(r)) for (const id of ids) given.set(id, ch);
        for (const clue of scenario.clues.filter((c) => c.clears)) {
          const who = clue.clears![0];
          if (who === plan.culprit || !present.has(who)) expect(given.has(clue.id)).toBe(false);
          else {
            expect(given.has(clue.id)).toBe(true);
            expect(given.get(clue.id)).not.toBe(who);
          }
        }
      }
    },
  );

  it("4명 판에는 빠진 인물(인플, 의료)을 가리키는 레드 헤링을 주지 않는다", () => {
    const plan = goodPlan(4, 3);
    const ids = Object.values(plan.clues).flatMap((r) => Object.values(r).flat());
    expect(ids).not.toContain("c-r1-05"); // 인플
    expect(ids).not.toContain("c-r1-07"); // 의료
  });
});

describe("validateAssignment: 잘못된 배정 거절 (AC-020-4)", () => {
  const players = playersOf(5);

  it("없는 인물, 없는 단서 ID", () => {
    const plan = goodPlan(5);
    plan.seats[0].character = "pd";
    plan.clues.r1 = { villain: ["c-r9-99"] };
    const errors = validateAssignment(scenario, players, plan);
    expect(errors).toContain("없는 인물: pd");
    expect(errors).toContain("없는 단서: c-r9-99");
  });

  it("BR-003: 범인은 핵심 인물", () => {
    expect(
      validateAssignment(scenario, players, { ...goodPlan(5), culprit: "influencer" }).join(),
    ).toContain("범인:");
    // BR-006(이 인원에서 못 고르는 범인)은 D-030 으로 4명 모두 가능해져 위 "4명 모두 범인 가능" 테스트가 맡는다
  });

  it("BR-004: 희생자가 범인이거나 추가 인물이면 거절", () => {
    const plan = goodPlan(5);
    expect(
      validateAssignment(scenario, players, { ...plan, victim: plan.culprit }).join(),
    ).toContain("희생자");
    expect(
      validateAssignment(scenario, players, { ...plan, victim: "influencer" }).join(),
    ).toContain("희생자");
  });

  it("BR-002: 인물 구성이나 자리가 맞지 않으면 거절", () => {
    const plan = goodPlan(5);
    expect(
      validateAssignment(scenario, players, { ...plan, seats: plan.seats.slice(1) }).join(),
    ).toContain("자리");
    const dup = { ...plan, seats: plan.seats.map((s) => ({ ...s, character: "fav" })) };
    expect(validateAssignment(scenario, players, dup).join()).toContain("인물");
  });

  it("단서: 공용 단서, 다른 라운드, 받을 수 없는 사람, 두 번 주기", () => {
    const base = goodPlan(5);
    const bad = (clues: Plan["clues"]) => validateAssignment(scenario, players, { ...base, clues });
    expect(bad({ r1: { fav: ["c-r1-01"] }, r2: {}, r3: {} }).join()).toContain("개인 단서가 아님");
    expect(bad({ r1: {}, r2: { villain: ["c-r1-04"] }, r3: {} }).join()).toContain(
      "개인 단서가 아님",
    );
    expect(bad({ r1: { athlete: ["c-r1-04"] }, r2: {}, r3: {} }).join()).toContain("받을 수 없음");
    expect(
      bad({ r1: { fav: ["c-r1-04"], villain: ["c-r1-04"] }, r2: {}, r3: {} }).join(),
    ).toContain("두 번");
    // D-032: 범인의 증거(clears)를 주면 범인이 아닌 게 된다
    const culpritClear = scenario.clues.find((c) => c.clears?.includes(base.culprit))!;
    const to = culpritClear.for!.find((ch) => ch !== base.victim)!;
    const key = (["r1", "r2", "r3"] as const)[culpritClear.round - 1];
    expect(bad({ r1: {}, r2: {}, r3: {}, [key]: { [to]: [culpritClear.id] } }).join()).toContain(
      "이번 판과 맞지 않음",
    );
  });

  it("형식이 틀리면 거절", () => {
    expect(validateAssignment(scenario, players, { culprit: 1 })[0]).toMatch(/^형식/);
  });
});

describe("toAssignment: 플레이어 행으로", () => {
  it("자리 → 플레이어, 범인 표시, 특징, 개인 단서", () => {
    const players = playersOf(6);
    const plan = goodPlan(6);
    const a = toAssignment(scenario, players, plan);
    expect(a.assignments).toHaveLength(6);
    expect(a.assignments.filter((x) => x.isCulprit)).toHaveLength(1);
    const culprit = a.assignments.find((x) => x.isCulprit)!;
    expect(a.secret.culpritPlayerId).toBe(culprit.playerId);
    expect(a.secret.ghostTrait).toBe(
      scenario.culprits.find((c) => c.character === plan.culprit)!.trait,
    );
    for (const row of a.assignments) expect(Object.keys(row.clueIds)).toEqual(["r1", "r2", "r3"]);
  });
});

describe("chooseAssignment: AI → 다시 → 규칙 (NFR-003)", () => {
  const players = playersOf(6);
  const good = JSON.stringify(goodPlan(6, 7));

  it("모델이 없으면(OQ-003) 바로 규칙 배정", async () => {
    const r = await chooseAssignment({ scenario, players, model: null, random: seeded(1) });
    expect(r.source).toBe("rule");
    expect(r.assignment.secret.llmRaw).toBeNull();
  });

  it("AI 응답이 맞으면 AI 배정", async () => {
    const model = fakeModel(good);
    const r = await chooseAssignment({ scenario, players, model, random: seeded(1) });
    expect(r.source).toBe("ai");
    expect(model.calls).toBe(1);
    expect(r.assignment.secret.culpritCharacter).toBe(JSON.parse(good).culprit);
  });

  it("```json 으로 감싸도 읽는다", async () => {
    const r = await chooseAssignment({
      scenario,
      players,
      model: fakeModel("```json\n" + good + "\n```"),
      random: seeded(1),
    });
    expect(r.source).toBe("ai");
  });

  it("첫 응답이 검사 실패면 한 번 더", async () => {
    const wrong = JSON.stringify({ ...JSON.parse(good), culprit: "pd" });
    const model = fakeModel(wrong, good);
    const r = await chooseAssignment({ scenario, players, model, random: seeded(1) });
    expect(r.source).toBe("ai");
    expect(model.calls).toBe(2);
  });

  it("2번 실패하면 규칙 배정, 실패 원인을 llm_raw 에 남김", async () => {
    const model = fakeModel("범인은 호감입니다", "{}");
    const r = await chooseAssignment({ scenario, players, model, random: seeded(1) });
    expect(r.source).toBe("rule");
    expect(model.calls).toBe(2);
    const raw = r.assignment.secret.llmRaw as { attempts: { errors: string[] }[] };
    expect(raw.attempts).toHaveLength(2);
    expect(raw.attempts[0].errors).toEqual(["형식: JSON 이 아님"]);
  });

  it("호출이 실패(오류)해도 규칙 배정", async () => {
    const r = await chooseAssignment({
      scenario,
      players,
      model: fakeModel(new Error("network")),
      random: seeded(1),
    });
    expect(r.source).toBe("rule");
  });

  it("15초를 넘기면 규칙 배정 (짧게 흉내)", async () => {
    vi.useFakeTimers();
    try {
      const slow = fakeModel(() => new Promise<string>(() => {})); // 끝나지 않음
      const p = chooseAssignment({ scenario, players, model: slow, random: seeded(1) });
      await vi.advanceTimersByTimeAsync(15_000);
      const r = await p;
      expect(r.source).toBe("rule");
      const raw = r.assignment.secret.llmRaw as { attempts: { errors: string[] }[] };
      expect(raw.attempts.at(-1)!.errors[0]).toContain("시간 초과");
    } finally {
      vi.useRealTimers();
    }
  });

  it("프롬프트: 고정 맥락은 시나리오 전체, 입력에 닉네임 같은 사용자 글 없음", async () => {
    const seen: { context: string; input: string }[] = [];
    const model: AssignModel = {
      name: "spy",
      async complete(req) {
        seen.push(req);
        return good;
      },
    };
    await chooseAssignment({ scenario, players, model, random: seeded(1) });
    expect(JSON.parse(seen[0].context)).toEqual(scenario);
    expect(Object.keys(JSON.parse(seen[0].input)).sort()).toEqual(
      ["characters", "culpritCandidates", "players", "seats"].sort(),
    );
  });
});

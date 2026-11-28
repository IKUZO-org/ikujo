import { describe, expect, it } from "vitest";
import liveDeath from "../scenarios/live-death.json";
import { charactersFor, checkScenario } from "@/lib/scenario/check";
import { scenarioSchema, type Scenario } from "@/lib/scenario/schema";

const clone = (): Scenario => structuredClone(scenarioSchema.parse(liveDeath));

describe("scenarios/live-death.json", () => {
  it("형식과 ID 참조 검사를 통과한다", () => {
    const result = checkScenario(liveDeath);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("인원별 등장인물: 핵심 4 + 5명부터 인플 + 6명이면 의료 (BR-002)", () => {
    const s = clone();
    expect(charactersFor(s, 4).map((c) => c.id)).toEqual(["fav", "villain", "athlete", "writer"]);
    expect(charactersFor(s, 5).map((c) => c.id)).toContain("influencer");
    expect(charactersFor(s, 5).map((c) => c.id)).not.toContain("medic");
    expect(charactersFor(s, 6)).toHaveLength(6);
  });

  it("D-030: 특징 해당자를 늘려 4명 판에서도 모든 범인을 고를 수 있다 (OQ-013 닫음)", () => {
    expect(checkScenario(liveDeath).unsupported).toEqual([]);
  });

  it("D-032 알리바이 퍼즐: 모든 인물에게 증거(clears)가 하나씩 있다", () => {
    const s = scenarioSchema.parse(liveDeath);
    for (const c of s.characters) {
      expect(s.clues.filter((x) => x.clears?.includes(c.id))).toHaveLength(1);
    }
  });

  it("6명 판은 모든 범인을 고를 수 있다 (BR-006)", () => {
    expect(checkScenario(liveDeath).unsupported.filter((u) => u.players === 6)).toEqual([]);
  });
});

describe("checkScenario 오류", () => {
  it("형식이 틀리면 형식 오류를 돌려준다", () => {
    const result = checkScenario({ id: "x" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.startsWith("형식:"))).toBe(true);
  });

  it("개인 단서에 for 가 없으면 형식 오류", () => {
    const s = clone();
    delete s.clues.find((c) => c.visibility === "private")!.for;
    expect(checkScenario(s).ok).toBe(false);
  });

  it("ID 겹침을 찾는다", () => {
    const s = clone();
    s.clues[1].id = s.clues[0].id;
    expect(checkScenario(s).errors).toContain(`ID 겹침: ${s.clues[0].id}`);
  });

  it("없는 인물, 없는 특징, 없는 단서 참조를 찾는다", () => {
    const s = clone();
    s.secrets[0].character = "ghost";
    s.culprits[0].trait = "t-none";
    s.redHerrings[0].clue = "c-none";
    const { errors } = checkScenario(s);
    expect(errors).toContain("없는 인물: ghost (secrets s-fav-1)");
    expect(errors).toContain("없는 특징: t-none (culprits fav)");
    expect(errors).toContain("없는 단서: c-none (redHerrings)");
  });

  it("범인은 핵심 인물만 (BR-003)", () => {
    const s = clone();
    s.culprits.push({ character: "medic", motive: "m", mistake: "m", trait: "t-radio" });
    expect(checkScenario(s).errors).toContain("범인은 핵심 인물만: medic");
  });

  it("해설이 없는 레드 헤링을 찾는다 (BR-010)", () => {
    const s = clone();
    s.redHerrings = s.redHerrings.filter((r) => r.clue !== "c-r2-02");
    expect(checkScenario(s).errors).toContain("레드 헤링 해설 없음: c-r2-02");
  });

  it("D-032: 증거가 없는 인물, 증거를 본인이 받는 단서를 찾는다", () => {
    const s = clone();
    s.clues = s.clues.filter((c) => !c.clears?.includes("fav"));
    const wrong = s.clues.find((c) => c.clears?.includes("villain"))!;
    wrong.for = [...wrong.for!, "villain"];
    const { errors } = checkScenario(s);
    expect(errors).toContain("증거 없음: fav");
    expect(errors.join()).toContain(`증거를 본인이 받음: ${wrong.id}`);
  });

  it("D-032: 증거(clears)는 개인 단서만", () => {
    const s = clone();
    const c = s.clues.find((x) => x.clears)!;
    c.visibility = "public";
    delete c.for;
    expect(checkScenario(s).ok).toBe(false);
  });

  it("비밀이 없는 인물을 찾는다 (D-016)", () => {
    const s = clone();
    s.secrets = s.secrets.filter((x) => x.character !== "medic");
    expect(checkScenario(s).errors).toContain("비밀 없음: medic");
  });
});

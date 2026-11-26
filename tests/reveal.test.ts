// 해설 카드 (spec S-12, FR-070, FR-071)
import { describe, expect, it } from "vitest";
import liveDeath from "../scenarios/live-death.json";
import { scenarioSchema } from "@/lib/scenario/schema";
import { buildReveal, writePersonal, type RevealInput } from "@/server/reveal";

const scenario = scenarioSchema.parse(liveDeath);

// 4명 판: a 범인(fav), d 희생자(writer, 유령)
const input: RevealInput = {
  outcome: "caught",
  culpritPlayerId: "a",
  culpritCharacter: "fav",
  ghostTrait: "t-citrus",
  players: [
    { id: "a", nickname: "A", characterId: "fav", isGhost: false, left: false },
    { id: "b", nickname: "B", characterId: "villain", isGhost: false, left: false },
    { id: "c", nickname: "C", characterId: "athlete", isGhost: false, left: false },
    { id: "d", nickname: "D", characterId: "writer", isGhost: true, left: false },
  ],
  // 첫 투표 a, b 동점 → 재투표에서 c 만 범인 a 를 지목
  votes: [
    { round: 1, voterId: "a", targetId: "b" },
    { round: 1, voterId: "b", targetId: "a" },
    { round: 1, voterId: "c", targetId: "a" },
    { round: 2, voterId: "a", targetId: "b" },
    { round: 2, voterId: "b", targetId: "b" },
    { round: 2, voterId: "c", targetId: "a" },
  ],
  revoted: true,
};

describe("buildReveal", () => {
  it("재투표가 있으면 투표 결과는 둘 다, 정확히 추리한 사람은 마지막 투표 기준 (AC-071, D-015)", () => {
    const body = buildReveal(scenario, input);
    expect(body.votes.map((v) => [v.round, v.picks.length])).toEqual([
      [1, 3],
      [2, 3],
    ]);
    // 첫 투표에서는 b, c 가 범인을 찍었지만 재투표에서는 c 만
    expect(body.solvers.map((w) => w.nickname)).toEqual(["C"]);
  });

  it("아무도 범인을 못 찍으면 정확히 추리한 사람이 없다", () => {
    const body = buildReveal(scenario, {
      ...input,
      outcome: "aired_off",
      votes: input.votes.filter((v) => v.targetId !== "a"),
    });
    expect(body.solvers).toEqual([]);
    expect(body.ending.text).toBe(scenario.reveal.endings.aired_off);
  });
});

describe("writePersonal", () => {
  it("LLM 이 실패하면 null 이고, 나머지 카드는 LLM 없이 다 나온다 (AC-070)", async () => {
    const failing = {
      name: "test",
      complete: async () => {
        throw new Error("down");
      },
    };
    expect(await writePersonal(scenario, failing, "{}")).toBeNull();
    const body = buildReveal(scenario, input);
    expect(body.culprit.who.character).toBe("국민 호감 1위");
    expect(body.timeline).toHaveLength(scenario.timeline.length);
    expect(body.redHerrings).toHaveLength(scenario.redHerrings.length);
    expect(body.ghost.matches.map((w) => w.nickname)).toEqual(["A"]);
    expect(body.pastTruth).toBe(scenario.reveal.pastTruth);
  });
});

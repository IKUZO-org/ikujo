import { describe, expect, it } from "vitest";

import {
  aggregate,
  parseUsageComment,
  rateRange,
  slugOf,
  summarize,
  toMarkdown,
} from "../scripts/usage/lib.mjs";

// Claude Code 기록 한 줄 (필요한 칸만)
const asst = (o: {
  id: string;
  session?: string;
  branch?: string;
  model?: string;
  side?: boolean;
  usage?: Partial<Record<string, number>>;
  blocks?: unknown[];
  cwd?: string;
}) =>
  JSON.stringify({
    type: "assistant",
    sessionId: o.session ?? "s1",
    gitBranch: o.branch ?? "hyeon/feat-12-room",
    cwd: o.cwd ?? "/repo",
    isSidechain: o.side ?? false,
    timestamp: "2026-11-25T01:00:00Z",
    message: {
      id: o.id,
      model: o.model ?? "claude-opus-5-5",
      usage: { input_tokens: 10, output_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, ...o.usage },
      content: o.blocks ?? [{ type: "text", text: "비밀 프롬프트" }],
    },
  });
const cost = (session: string, usd: number) => JSON.stringify({ type: "cost-state", sessionId: session, totalCostUSD: usd });
const tool = (name: string, input: object = {}) => ({ type: "tool_use", name, input });

describe("slugOf", () => {
  it("Claude Code 기록 폴더 이름 규칙 (글자, 숫자 말고는 -)", () => {
    expect(slugOf("/Users/a/ted.urssu/ikujo")).toBe("-Users-a-ted-urssu-ikujo");
  });
});

describe("summarize", () => {
  const BR = "hyeon/feat-12-room";

  it("같은 메시지가 여러 줄(내용 조각마다)이어도 한 번만 세고, 도구는 모두 모은다", () => {
    const lines = [
      asst({ id: "m1", blocks: [{ type: "text", text: "x" }], usage: { output_tokens: 5 } }),
      asst({ id: "m1", blocks: [tool("Read")], usage: { output_tokens: 100 } }),
      asst({ id: "m1", blocks: [tool("Bash")], usage: { output_tokens: 100 } }),
    ];
    const s = summarize(lines, { branch: BR, roots: ["/repo"] });
    expect(s.messages).toBe(1);
    expect(s.tokens).toEqual({ input: 10, output: 100, cacheWrite: 0, cacheRead: 0 });
    expect(s.tools).toEqual({ Read: 1, Bash: 1 });
  });

  it("다른 브랜치, 레포 밖 폴더의 메시지는 뺀다", () => {
    const lines = [
      asst({ id: "m1" }),
      asst({ id: "m2", branch: "develop" }),
      asst({ id: "m3", cwd: "/other" }),
      asst({ id: "m4", cwd: "/repo/src" }),
    ];
    expect(summarize(lines, { branch: BR, roots: ["/repo"] }).messages).toBe(2);
  });

  it("메인 대화와 서브에이전트, 모델별로 나눈다. skill과 에이전트 이름을 센다", () => {
    const lines = [
      asst({ id: "m1", blocks: [tool("Skill", { skill: "worklog" }), tool("Agent", { subagent_type: "Explore" })] }),
      asst({ id: "m2", side: true, model: "claude-haiku-5-5", usage: { output_tokens: 40 } }),
    ];
    const s = summarize(lines, { branch: BR, roots: ["/repo"] });
    expect(s.where).toEqual({ main: { messages: 1, output: 100 }, subagent: { messages: 1, output: 40 } });
    expect(Object.keys(s.models)).toEqual(["claude-opus-5-5", "claude-haiku-5-5"]);
    expect(s.skills).toEqual({ worklog: 1 });
    expect(s.agents).toEqual({ Explore: 1 });
  });

  it("세션 비용은 마지막 값을 쓰고, 세션이 여러 브랜치에 걸치면 토큰 무게로 나눈다", () => {
    const lines = [
      asst({ id: "m1", usage: { input_tokens: 0, output_tokens: 100 } }),
      asst({ id: "m2", branch: "develop", usage: { input_tokens: 0, output_tokens: 300 } }),
      cost("s1", 1),
      cost("s1", 2),
    ];
    const s = summarize(lines, { branch: BR, roots: ["/repo"] });
    expect(s.costUSD).toBeCloseTo(0.5);
  });

  it("비용 기록이 없는 세션은 비용을 모른다고(null) 한다", () => {
    expect(summarize([asst({ id: "m1" })], { branch: BR, roots: ["/repo"] }).costUSD).toBeNull();
  });

  it("깨진 줄과 다른 종류 줄은 건너뛴다", () => {
    const lines = ["{깨짐", JSON.stringify({ type: "user", message: { content: "x" } }), asst({ id: "m1" })];
    expect(summarize(lines, { branch: BR, roots: ["/repo"] }).messages).toBe(1);
  });

  it("결과에 프롬프트, 경로가 들어가지 않는다", () => {
    const s = summarize([asst({ id: "m1" })], { branch: BR, roots: ["/repo"] });
    expect(JSON.stringify(s)).not.toMatch(/비밀 프롬프트|\/repo/);
  });
});

describe("rateRange", () => {
  it("이 브랜치 세션의 사용률 처음과 마지막", () => {
    const log = [
      { t: 1, session: "s1", five_hour: 10, seven_day: 30 },
      { t: 2, session: "other", five_hour: 50, seven_day: 60 },
      { t: 3, session: "s1", five_hour: 25, seven_day: 34 },
    ].map((x) => JSON.stringify(x));
    expect(rateRange(log, new Set(["s1"]))).toEqual({ five_hour: { from: 10, to: 25 }, seven_day: { from: 30, to: 34 } });
    expect(rateRange(log, new Set(["none"]))).toBeNull();
  });
});

describe("작업 기록 칸과 팀 합계", () => {
  const s = summarize(
    [asst({ id: "m1", blocks: [tool("Read")] }), cost("s1", 0.25)],
    { branch: "hyeon/feat-12-room", roots: ["/repo"] },
  );

  it("## 사용량 칸에 표와 다시 읽을 숫자 한 줄이 있다", () => {
    const md = toMarkdown({ ...s, rate: { five_hour: { from: 10, to: 25 }, seven_day: { from: 30, to: 34 } } });
    expect(md).toMatch(/^## 사용량/);
    expect(md).toContain("$0.25");
    expect(md).toContain("주간 30% → 34%");
    expect(parseUsageComment(md)).toMatchObject({ branch: "hyeon/feat-12-room", issue: 12, costUSD: 0.25 });
  });

  it("사람, 이슈, 모델, 도구별로 더한다", () => {
    const a = { ...s, rate: null };
    const t = aggregate([
      { person: "hyeon", date: "2026-11-25", usage: a },
      { person: "hyeon", date: "2026-11-26", usage: a },
      { person: "jy", date: "2026-12-01", usage: { ...a, issue: 20, costUSD: null } },
    ]);
    expect(t.people.hyeon).toMatchObject({ prs: 2, costUSD: 0.5, output: 200 });
    expect(t.people.jy).toMatchObject({ prs: 1, costUSD: 0, unknownCost: 1 });
    expect(t.issues["12"].prs).toBe(2);
    expect(t.weeks["2026-11-23"].prs).toBe(2);
    expect(t.tools.Read).toBe(3);
  });
});

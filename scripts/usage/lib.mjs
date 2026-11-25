// Claude 사용량 계산 (이슈 #13). 파일을 읽지 않는 순수 함수만. 읽기는 scripts/usage.mjs, scripts/usage-report.mjs
// 결과에는 숫자와 이름(모델, 도구, skill, 에이전트)만 남긴다. 프롬프트, 내용, 경로, 계정 정보는 꺼내지 않는다 (SECURITY.md)

// 세션 비용을 브랜치별로 나눌 때 쓰는 토큰 무게. Claude 모델들의 정가 비율(입력 1, 출력 5, 캐시 쓰기 1.25, 캐시 읽기 0.1)
// 갈아탈 신호: Claude Code가 메시지마다 비용을 남기기 시작하면 무게 대신 그 값을 더한다
const WEIGHT = { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 };

/** Claude Code가 ~/.claude/projects/ 아래 폴더 이름을 만드는 규칙 */
export const slugOf = (dir) => dir.replace(/[^A-Za-z0-9]/g, "-");

/** 브랜치 이름 `<나>/<종류>-<이슈번호>-<주제>` 에서 이슈 번호 */
export const issueOf = (branch) => Number(/^[^/]+\/[a-z]+-(\d+)-/.exec(branch ?? "")?.[1]) || null;

const zero = () => ({ input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });
const tokensOf = (u = {}) => ({
  input: u.input_tokens ?? 0,
  output: u.output_tokens ?? 0,
  cacheWrite: u.cache_creation_input_tokens ?? 0,
  cacheRead: u.cache_read_input_tokens ?? 0,
});
const weight = (t) => t.input * WEIGHT.input + t.output * WEIGHT.output + t.cacheWrite * WEIGHT.cacheWrite + t.cacheRead * WEIGHT.cacheRead;
const add = (a, b) => ({ input: a.input + b.input, output: a.output + b.output, cacheWrite: a.cacheWrite + b.cacheWrite, cacheRead: a.cacheRead + b.cacheRead });
const bump = (o, k, n = 1) => {
  if (typeof k === "string" && k) o[k] = (o[k] ?? 0) + n;
};
const inside = (cwd, roots) => typeof cwd === "string" && roots.some((r) => cwd === r || cwd.startsWith(r.endsWith("/") ? r : `${r}/`));
const day = (ts) => (typeof ts === "string" ? ts.slice(0, 10) : null);

function parse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

/**
 * 기록 줄들(메인 대화, 서브에이전트 파일 모두)에서 브랜치 하나의 사용량
 * @param {string[]} lines
 * @param {{ branch: string, roots: string[] }} opt roots: 이 레포 폴더(워크트리 포함). 그 밖에서 쓴 것은 세지 않는다
 */
export function summarize(lines, { branch, roots }) {
  /** @type {Map<string, {session: string, mine: boolean, side: boolean, model: string, tokens: ReturnType<typeof zero>, tools: string[], skills: string[], agents: string[], ts: string}>} */
  const msgs = new Map();
  /** @type {Map<string, number>} */
  const sessionCost = new Map();

  for (const line of lines) {
    const d = parse(line);
    if (!d || typeof d !== "object") continue;
    if (d.type === "cost-state" && typeof d.totalCostUSD === "number") {
      sessionCost.set(d.sessionId, Math.max(sessionCost.get(d.sessionId) ?? 0, d.totalCostUSD));
      continue;
    }
    const m = d.message;
    if (d.type !== "assistant" || !m?.usage) continue;
    // 한 메시지가 내용 조각마다 한 줄씩 기록된다. 같은 id는 하나로, 사용량은 가장 큰 출력, 도구는 모두 모은다
    const key = m.id ?? d.uuid;
    const t = tokensOf(m.usage);
    const prev = msgs.get(key);
    const cur = prev ?? {
      session: d.sessionId,
      mine: d.gitBranch === branch && inside(d.cwd, roots),
      side: d.isSidechain === true,
      model: typeof m.model === "string" ? m.model : "unknown",
      tokens: t,
      tools: [],
      skills: [],
      agents: [],
      ts: d.timestamp,
    };
    if (prev && t.output > prev.tokens.output) cur.tokens = t;
    for (const b of Array.isArray(m.content) ? m.content : []) {
      if (b?.type !== "tool_use" || typeof b.name !== "string") continue;
      cur.tools.push(b.name);
      if (b.name === "Skill" && typeof b.input?.skill === "string") cur.skills.push(b.input.skill);
      if ((b.name === "Agent" || b.name === "Task") && typeof b.input?.subagent_type === "string") cur.agents.push(b.input.subagent_type);
    }
    msgs.set(key, cur);
  }

  // 세션마다 전체 무게 (브랜치와 상관없이) → 이 브랜치 몫의 비용
  /** @type {Map<string, number>} */
  const sessionWeight = new Map();
  for (const x of msgs.values()) sessionWeight.set(x.session, (sessionWeight.get(x.session) ?? 0) + weight(x.tokens));

  const s = {
    branch,
    issue: issueOf(branch),
    sessions: 0,
    messages: 0,
    first: null,
    last: null,
    tokens: zero(),
    costUSD: /** @type {number | null} */ (null),
    where: { main: { messages: 0, output: 0 }, subagent: { messages: 0, output: 0 } },
    /** @type {Record<string, {messages: number, output: number}>} */
    models: {},
    /** @type {Record<string, number>} */
    tools: {},
    /** @type {Record<string, number>} */
    skills: {},
    /** @type {Record<string, number>} */
    agents: {},
  };
  /** @type {Set<string>} */
  const sessions = new Set();
  /** @type {Map<string, number>} */
  const mineWeight = new Map();
  for (const x of msgs.values()) {
    if (!x.mine) continue;
    sessions.add(x.session);
    mineWeight.set(x.session, (mineWeight.get(x.session) ?? 0) + weight(x.tokens));
    s.messages++;
    s.tokens = add(s.tokens, x.tokens);
    const w = x.side ? s.where.subagent : s.where.main;
    w.messages++;
    w.output += x.tokens.output;
    const mm = (s.models[x.model] ??= { messages: 0, output: 0 });
    mm.messages++;
    mm.output += x.tokens.output;
    x.tools.forEach((n) => bump(s.tools, n));
    x.skills.forEach((n) => bump(s.skills, n));
    x.agents.forEach((n) => bump(s.agents, n));
    const dd = day(x.ts);
    if (dd && (!s.first || dd < s.first)) s.first = dd;
    if (dd && (!s.last || dd > s.last)) s.last = dd;
  }
  s.sessions = sessions.size;
  for (const [id, w] of mineWeight) {
    const total = sessionWeight.get(id);
    const usd = sessionCost.get(id);
    if (usd == null || !total) continue;
    s.costUSD = (s.costUSD ?? 0) + (usd * w) / total;
  }
  // 상태줄 사용률 기록과 맞출 세션 id. JSON(작업 기록)에는 나가지 않게 숨긴다
  Object.defineProperty(s, "sessionIds", { value: sessions, enumerable: false });
  return s;
}

/**
 * 상태줄이 남긴 사용률 기록에서 이 세션들의 처음과 마지막 %
 * @param {string[]} lines `{t, session, five_hour, seven_day}` 한 줄씩
 * @param {Set<string>} sessions
 */
export function rateRange(lines, sessions) {
  const rows = lines.map(parse).filter((r) => r && sessions.has(r.session)).sort((a, b) => a.t - b.t);
  if (!rows.length) return null;
  const pick = (k) => {
    const xs = rows.filter((r) => typeof r[k] === "number");
    return xs.length ? { from: xs[0][k], to: xs.at(-1)[k] } : null;
  };
  return { five_hour: pick("five_hour"), seven_day: pick("seven_day") };
}

const num = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));
export const usd = (n) => (n == null ? "모름 (비용 기록 없음)" : n > 0 && n < 0.01 ? "<$0.01" : `$${n.toFixed(2)}`);
const top = (o, k = 8) =>
  Object.entries(o)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([n, c]) => `${n} ${c}`)
    .join(", ") || "없음";
const pct = (r) => (r ? `${r.from}% → ${r.to}%` : "기록 없음");

/** 작업 기록의 `## 사용량` 칸. 맨 끝 주석 한 줄은 팀 합계(usage-report)가 다시 읽는다 */
export function toMarkdown(s, today = new Date().toISOString().slice(0, 10)) {
  const rate = s.rate ? `5시간 ${pct(s.rate.five_hour)} · 주간 ${pct(s.rate.seven_day)}` : "기록 없음 (상태줄 사용률이 켜진 뒤부터 남는다)";
  const body = {
    branch: s.branch,
    issue: s.issue,
    sessions: s.sessions,
    messages: s.messages,
    first: s.first,
    last: s.last,
    tokens: s.tokens,
    costUSD: s.costUSD == null ? null : Math.round(s.costUSD * 10000) / 10000,
    where: s.where,
    models: s.models,
    tools: s.tools,
    skills: s.skills,
    agents: s.agents,
    rate: s.rate ?? null,
  };
  return [
    "## 사용량",
    `\`node scripts/usage.mjs --md\` 로 만든 값 (${today}). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다`,
    "",
    "| 항목 | 값 |",
    "| --- | --- |",
    `| 비용 | ${usd(body.costUSD)} (세션 ${s.sessions}개) |`,
    `| 토큰 | 입력 ${num(s.tokens.input)} · 출력 ${num(s.tokens.output)} · 캐시 쓰기 ${num(s.tokens.cacheWrite)} · 캐시 읽기 ${num(s.tokens.cacheRead)} |`,
    `| 메시지 | ${s.messages} (메인 ${s.where.main.messages}, 서브에이전트 ${s.where.subagent.messages}) |`,
    `| 모델 | ${top(Object.fromEntries(Object.entries(s.models).map(([k, v]) => [k, v.messages])))} |`,
    `| 사용률 | ${rate} |`,
    `| 많이 쓴 도구 | ${top(s.tools)} |`,
    `| skill | ${top(s.skills)} |`,
    `| 에이전트 | ${top(s.agents)} |`,
    "",
    `<!-- usage ${JSON.stringify(body)} -->`,
    "",
  ].join("\n");
}

/** 작업 기록에서 숫자 한 줄을 다시 읽는다. 없거나 깨졌으면 null */
export function parseUsageComment(md) {
  const m = /<!-- usage (\{.*?\}) -->/.exec(md);
  return m ? parse(m[1]) : null;
}

/** 그 날짜가 든 주의 월요일 (YYYY-MM-DD) */
export function weekOf(date) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * 작업 기록 여러 개를 사람, 주, 이슈, 모델, 도구별로 더한다
 * @param {{ person: string, date: string, usage: any }[]} entries
 */
export function aggregate(entries) {
  const row = () => ({ prs: 0, costUSD: 0, unknownCost: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });
  const t = {
    /** @type {Record<string, ReturnType<typeof row>>} */ people: {},
    /** @type {Record<string, ReturnType<typeof row>>} */ weeks: {},
    /** @type {Record<string, ReturnType<typeof row>>} */ issues: {},
    /** @type {Record<string, {messages: number, output: number}>} */ models: {},
    /** @type {Record<string, number>} */ tools: {},
    /** @type {Record<string, number>} */ skills: {},
    /** @type {Record<string, number>} */ agents: {},
    total: row(),
  };
  const into = (r, u) => {
    r.prs++;
    if (typeof u.costUSD === "number") r.costUSD += u.costUSD;
    else r.unknownCost++;
    for (const k of ["input", "output", "cacheWrite", "cacheRead"]) r[k] += u.tokens?.[k] ?? 0;
  };
  for (const { person, date, usage: u } of entries) {
    into((t.people[person] ??= row()), u);
    into((t.weeks[weekOf(date)] ??= row()), u);
    into((t.issues[String(u.issue ?? "없음")] ??= row()), u);
    into(t.total, u);
    for (const [m, v] of Object.entries(u.models ?? {})) {
      const mm = (t.models[m] ??= { messages: 0, output: 0 });
      mm.messages += v.messages ?? 0;
      mm.output += v.output ?? 0;
    }
    for (const [k, n] of Object.entries(u.tools ?? {})) bump(t.tools, k, n);
    for (const [k, n] of Object.entries(u.skills ?? {})) bump(t.skills, k, n);
    for (const [k, n] of Object.entries(u.agents ?? {})) bump(t.agents, k, n);
  }
  return t;
}

/** 팀 합계 문서 docs/usage.md */
export function reportMarkdown(t, today = new Date().toISOString().slice(0, 10)) {
  const table = (title, o, key) => [
    `## ${title}`,
    "",
    `| ${key} | PR | 비용 | 출력 토큰 | 입력 토큰 | 캐시 읽기 |`,
    "| --- | --- | --- | --- | --- | --- |",
    ...Object.entries(o)
      .sort((a, b) => b[1].costUSD - a[1].costUSD)
      .map(([k, r]) => `| ${k} | ${r.prs} | ${usd(r.costUSD)}${r.unknownCost ? ` (비용 모름 ${r.unknownCost})` : ""} | ${num(r.output)} | ${num(r.input)} | ${num(r.cacheRead)} |`),
    "",
  ];
  return [
    "# Claude 사용량 (팀 합계)",
    "",
    `> \`node scripts/usage-report.mjs --write\` 로 만든 문서 (${today}). 손으로 고치지 않는다.`,
    "> 근거: 각 PR 작업 기록(`docs/work/`)의 `## 사용량` 칸. 비용은 정가 기준 추정이다. 사용률 %는 사람마다 계정이 달라 더하지 않는다",
    "",
    `전체: PR ${t.total.prs}개 · ${usd(t.total.costUSD)} · 출력 토큰 ${num(t.total.output)}`,
    "",
    ...table("사람별", t.people, "사람"),
    ...table("주별 (월요일)", t.weeks, "주"),
    ...table("이슈별", t.issues, "이슈"),
    "## 모델",
    "",
    "| 모델 | 메시지 | 출력 토큰 |",
    "| --- | --- | --- |",
    ...Object.entries(t.models).map(([k, v]) => `| ${k} | ${v.messages} | ${num(v.output)} |`),
    "",
    "## 어떻게 썼나",
    "",
    `- 많이 쓴 도구: ${top(t.tools, 15)}`,
    `- skill: ${top(t.skills, 15)}`,
    `- 에이전트: ${top(t.agents, 15)}`,
    "",
  ].join("\n");
}

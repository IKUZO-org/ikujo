#!/usr/bin/env node
// 내 컴퓨터의 Claude Code 기록에서 브랜치 하나의 사용량 (이슈 #13). 네트워크는 쓰지 않는다
// 쓰는 법: node scripts/usage.mjs [--branch <브랜치>] [--md | --json]
//   --md   작업 기록의 `## 사용량` 칸 (worklog skill이 붙인다)
//   --json 숫자 그대로
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { rateRange, slugOf, summarize, toMarkdown, usd } from "./usage/lib.mjs";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();

const branch = opt("--branch") ?? git("branch", "--show-current");
// 이 레포 폴더와 워크트리 폴더 (Claude Code 기록의 cwd가 이 안이어야 센다)
const roots = git("worktree", "list", "--porcelain")
  .split("\n")
  .filter((l) => l.startsWith("worktree "))
  .map((l) => l.slice(9));
const config = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
const projects = join(config, "projects");

const files = [];
if (existsSync(projects)) {
  const slugs = roots.map(slugOf);
  for (const dir of readdirSync(projects)) {
    if (!slugs.some((s) => dir === s || dir.startsWith(`${s}-`))) continue;
    const base = join(projects, dir);
    for (const f of readdirSync(base, { withFileTypes: true })) {
      if (f.isFile() && f.name.endsWith(".jsonl")) files.push(join(base, f.name));
      // 서브에이전트 기록: <세션>/subagents/*.jsonl
      const sub = join(base, f.name, "subagents");
      if (f.isDirectory() && existsSync(sub)) for (const g of readdirSync(sub)) if (g.endsWith(".jsonl")) files.push(join(sub, g));
    }
  }
}
const lines = files.flatMap((f) => readFileSync(f, "utf8").split("\n"));
const s = summarize(lines, { branch, roots });
const rateLog = join(config, "ikujo-usage", "rate.jsonl");
s.rate = existsSync(rateLog) ? rateRange(readFileSync(rateLog, "utf8").split("\n"), s.sessionIds) : null;

if (args.includes("--json")) console.log(JSON.stringify(s, null, 2));
else if (args.includes("--md")) process.stdout.write(toMarkdown(s));
else {
  console.log(`브랜치 ${branch}: 세션 ${s.sessions}개, 메시지 ${s.messages}개, 비용 ${usd(s.costUSD)}`);
  console.log(`토큰 입력 ${s.tokens.input}, 출력 ${s.tokens.output}, 캐시 쓰기 ${s.tokens.cacheWrite}, 캐시 읽기 ${s.tokens.cacheRead}`);
  if (!s.messages) console.log("이 브랜치에서 이 레포 폴더로 쓴 Claude Code 기록이 없어요.");
}

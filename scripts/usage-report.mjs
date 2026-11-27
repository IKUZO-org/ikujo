#!/usr/bin/env node
// 팀 합계 (이슈 #13): docs/work/<사람>/*.md 의 `## 사용량` 숫자를 모아 docs/usage.md 를 만든다
// 쓰는 법: node scripts/usage-report.mjs          → 화면에 출력
//          node scripts/usage-report.mjs --write  → docs/usage.md 에 저장 (PR로 올린다)
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { aggregate, parseUsageComment, reportMarkdown } from "./usage/lib.mjs";

const root = join(import.meta.dirname, "..");
const work = join(root, "docs", "work");
const entries = [];
for (const person of readdirSync(work)) {
  const dir = join(work, person);
  if (!statSync(dir).isDirectory()) continue;
  for (const f of readdirSync(dir)) {
    const date = /^(\d{4}-\d{2}-\d{2})-/.exec(f)?.[1];
    if (!date || !f.endsWith(".md")) continue;
    const usage = parseUsageComment(readFileSync(join(dir, f), "utf8"));
    if (usage) entries.push({ person, date, usage });
  }
}
const md = reportMarkdown(aggregate(entries));
if (process.argv.includes("--write")) {
  writeFileSync(join(root, "docs", "usage.md"), md);
  console.log(`docs/usage.md 저장 (작업 기록 ${entries.length}개)`);
} else process.stdout.write(md);

#!/usr/bin/env node
// Claude Code 상태줄 (이슈 #13, .claude/settings.json 의 statusLine)
// 5시간, 주간 사용률 %를 보여 주고, 값이 바뀔 때만 레포 밖(~/.claude/ikujo-usage/rate.jsonl)에 남긴다
// 남기는 것: 시각, 세션 id, 두 %. 상태줄이 깨지면 Claude Code 화면이 지저분해지므로 어떤 오류도 밖으로 내지 않는다
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let d = {};
  try {
    d = JSON.parse(raw);
  } catch {}
  const five = d.rate_limits?.five_hour?.used_percentage;
  const week = d.rate_limits?.seven_day?.used_percentage;
  const ctx = d.context_window?.used_percentage;
  const r = (n) => (typeof n === "number" ? `${Math.round(n)}%` : "-");
  const parts = [d.model?.display_name ?? "Claude", `5시간 ${r(five)}`, `주간 ${r(week)}`];
  if (typeof ctx === "number") parts.push(`맥락 ${r(ctx)}`);
  process.stdout.write(parts.join(" · "));

  if (typeof five !== "number" && typeof week !== "number") return;
  try {
    const dir = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "ikujo-usage");
    mkdirSync(dir, { recursive: true });
    const lastFile = join(dir, "last.json");
    const now = { session: d.session_id ?? null, five_hour: five ?? null, seven_day: week ?? null };
    let last = null;
    try {
      last = readFileSync(lastFile, "utf8");
    } catch {}
    if (last === JSON.stringify(now)) return;
    writeFileSync(lastFile, JSON.stringify(now));
    appendFileSync(join(dir, "rate.jsonl"), `${JSON.stringify({ t: Date.now(), ...now })}\n`);
  } catch {}
});

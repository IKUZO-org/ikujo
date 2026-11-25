// 시나리오는 모든 인물의 비밀을 담고 있어서 서버에서만 읽는다 (SECURITY.md §2).
import "server-only";
import liveDeath from "../../scenarios/live-death.json";
import { scenarioSchema, type Scenario } from "@/lib/scenario/schema";

let cached: Scenario | null = null;

export function loadScenario(): Scenario {
  cached ??= scenarioSchema.parse(liveDeath);
  return cached;
}

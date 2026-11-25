// LLM 연결 자리. 모델 이름은 환경 변수 LLM_MODEL (spec §9, OQ-003).
// OQ-003(어느 모델, 비용)이 정해지지 않아 아직 실제 SDK 를 붙이지 않는다 → 늘 null → 규칙 배정.
// 정해지면 여기서 AssignModel 을 만들어 돌려준다. 키는 서버 환경 변수에만 (SECURITY.md §1)
import "server-only";
import type { AssignModel } from "./assign-ai";

export function getAssignModel(): AssignModel | null {
  const model = process.env.LLM_MODEL;
  if (!model) return null;
  // TODO(OQ-003): 모델이 정해지면 SDK 로 complete() 를 만든다
  return null;
}

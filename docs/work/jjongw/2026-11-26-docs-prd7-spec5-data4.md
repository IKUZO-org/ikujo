# PRD 7판, 기능명세 5판, 데이터 4판 사본 맞추기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @JJongW |
| 브랜치 | jjongw/docs-prd7-spec5-data4 |
| 이슈 | #68 |
| 문서 번호 | OQ-006, D-025, D-026, D-027, BR-011, D-019 |

## 할 일
Hatch 문서 댓글 3개(@uyeon0)에서 정한 것을 레포 사본(`docs/prd.md`, `docs/spec.md`, `docs/data.md`)에 맞춘다.

## 한 일
- PRD 6판 → 7판: 범인 이탈(D-025, OQ-006 닫음). 추리 전이면 판 취소 → 대기실, r1 이후면 해설로, 엔딩은 방송 중단 재사용, 우승자 없음, 투표 전이면 카드 3, 9 건너뜀, 다시 들어와도 되돌리지 않음. 익명 사용자도 30일(D-026). 24시간 활동 없는 방과 판은 ended(D-027)
- 기능명세 4판 → 5판: §1.1 ended 줄과 범인 이탈 처리, S-12 카드 1, 3, 9, §4 leaveRoom, §6, §9
- 데이터 3판 → 4판: `ended_reason`에 `cancelled`, `stale` 추가, §6 보관 표와 하루 한 번 정리 작업
- 개발 프롬프트 5판 → 6판: 10단계 범인 이탈(D-025), 11단계 정리 작업(D-026, D-027), TTS 줄(D-024). 로드맵 3판 → 4판: 닫힌 OQ-006, OQ-011 줄

## 프롬프트 요약
1. Hatch 새 댓글 확인 → 윤 질문 3개
2. 제안을 보여 주고 PO가 제안대로 확정 → Hatch에 새 판 저장, 댓글 답과 해결 표시, 사본 PR

## 사용한 skill
- 없음. Hatch 문서는 save_team_doc으로 저장하고 다시 읽어 본문이 같은지 확인
- 이 작업은 ikujo 폴더 밖(다른 레포 세션)에서 해서 아래 사용량이 0으로 나온다

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 122 테스트 통과

## 남은 일
- 없음 (개발 프롬프트, 로드맵도 같이 맞춤)

## 사용량
## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-26). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 0개) |
| 토큰 | 입력 0 · 출력 0 · 캐시 쓰기 0 · 캐시 읽기 0 |
| 메시지 | 0 (메인 0, 서브에이전트 0) |
| 모델 | 없음 |
| 사용률 | 기록 없음 (상태줄 사용률이 켜진 뒤부터 남는다) |
| 많이 쓴 도구 | 없음 |
| skill | 없음 |
| 에이전트 | 없음 |

<!-- usage {"branch":"jjongw/docs-prd7-spec5-data4","issue":null,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

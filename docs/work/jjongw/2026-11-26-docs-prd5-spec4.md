# PRD 5판, 기능명세 4판 사본 맞추기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @JJongW |
| 브랜치 | jjongw/docs-prd5-spec4 |
| 이슈 | #57 |
| 문서 번호 | FR-060, FR-070, BR-011, S-12, D-021~D-023 |

## 할 일
Hatch에서 정한 PRD 5판, 기능명세 4판을 레포 사본(`docs/prd.md`, `docs/spec.md`)에 맞춘다.

## 한 일
- `docs/prd.md` 4판 → 5판: 게임 중 나간 사람 처리 3가지 (D-021 후보에 남김, D-022 판정은 그 순간 접속한 사람의 표만, D-023 다시 하기는 누른 순간 접속한 사람 4명 이상), AC 3줄
- `docs/prd.md` 5판 → 6판: TTS를 쓰지 않는다, 대사는 자막과 글로 (D-024, OQ-011 닫음). FR-080, NFR-007, §27 같이 고침
- `docs/spec.md` 3판 → 4판: 해설 화면 "다시 하기 / 홈으로", 방장의 홈으로 = `endRoom`(ended), 참가자의 홈으로 = 나만 나가기, §4에 `endRoom` 추가

## 프롬프트 요약
1. Hatch 소통에 올라온 윤 댓글(PRD 3개, 기능명세 S-12 1개) 분석
2. PO가 제안대로 확정 → Hatch PRD 5판, 기능명세 4판 저장, 댓글 답과 해결 표시
3. 레포 사본도 맞춰서 PR

## 사용한 skill
- 없음 (Hatch 문서는 Supabase REST로 읽고 씀, 운영 DB 쓰기는 PO 승인 후)
- 이 작업은 ikujo 폴더 밖(다른 레포 세션)에서 해서 아래 사용량이 0으로 나온다

## 확인
- 사본 본문이 Hatch 최신판(PRD 5, 기능명세 4)과 같음 (diff)
- `npm run typecheck`, `npm run lint`, `npm test` → 아래 PR 확인 칸

## 남은 일
- 없음

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

<!-- usage {"branch":"jjongw/docs-prd5-spec4","issue":null,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

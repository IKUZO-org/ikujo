# CONTRIBUTING, CLAUDE 문서 표에 ART.md 넣기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @JJongW |
| 브랜치 | jjongw/docs-art-in-tables |
| 이슈 | #92 |
| 문서 번호 | PRD §28.10, FR-081 |

## 할 일
PR #81 에서 상경이 부탁한 대로, 새 규칙 문서 `ART.md` 를 PO 담당 파일의 문서 표에 넣는다.

## 한 일
- `CONTRIBUTING.md`: "어떤 문서를 따르나" 표에 ART.md 줄 (담당 상경, 영상은 지영과 같이). 리뷰 줄에 "이미지와 영상이면 ART.md §13 체크"
- `CLAUDE.md`: 먼저 읽을 것 표에 "이미지, 영상 → ART.md" 줄, 규칙 문서 목록에 ART 추가

## 프롬프트 요약
1. PR #81 확인 → 상경 요청(문서 표에 ART.md) 정리
2. PO가 "응, 넣어" → 두 파일 고치고 PR

## 사용한 skill
- 없음
- 이 작업은 ikujo 폴더 밖(다른 레포 세션)에서 해서 아래 사용량이 0으로 나올 수 있다

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 133 테스트 통과
- ART.md §13 "그래픽 PR 체크"가 있는 것 확인

## 남은 일
- 없음

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-27). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

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

<!-- usage {"branch":"jjongw/docs-art-in-tables","issue":null,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

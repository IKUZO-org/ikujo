# 로드맵: 단계 이슈는 각자 만든다

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-25 |
| 사람 | @JJongW |
| 브랜치 | jjongw/docs-33-roadmap-issues |
| 이슈 | #33 |
| 문서 번호 | 로드맵 사람별 흐름 |

## 할 일
단계 이슈는 맡은 사람이 각자 만드는데 로드맵에는 신(PO)이 만든다고 적혀 있어서 실제와 맞춘다.

## 한 일
- 로드맵 사람별 흐름의 신 칸에서 "이슈 만들기"를 뺐다
- "단계 이슈는 맡은 사람이 시작할 때 각자 만든다" 한 줄을 넣었다
- 운영 Hatch 로드맵 3판으로 저장하고 `docs/roadmap.md` 사본 첫 줄을 3판으로 바꿨다

## 프롬프트 요약
1. 이슈는 각자 만들게 해 놨으니 로드맵도 고쳐 달라
2. 로드맵도 Hatch에 저장하고 PR 올려 달라

## 사용한 skill
- 없음 (gh CLI로 이슈 #33, PR. 운영 Hatch 저장과 사본 확인은 스크립트)

## 확인
- 사본 5개 = 운영 Hatch 최신 판 (`check` 모드, 모두 같음)
- 앱 코드를 건드리지 않아 typecheck, lint, test는 돌리지 않음

## 남은 일
- 없음

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-25). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

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

<!-- usage {"branch":"jjongw/docs-33-roadmap-issues","issue":33,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

사용량이 0인 까닭: 이 작업은 다른 폴더(7조 레포)에서 연 Claude 세션으로 해서 이 레포 기록에 잡히지 않는다.

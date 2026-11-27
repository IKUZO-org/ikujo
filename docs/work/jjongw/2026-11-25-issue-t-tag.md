# 이슈 제목에 과제 체크리스트 번호 [T번호]

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-25 |
| 사람 | @JJongW |
| 브랜치 | jjongw/chore-30-issue-t-tag |
| 이슈 | #30 |
| 문서 번호 | CONTRIBUTING 이슈, CLAUDE.md 2번 |

## 할 일
팀 Hatch 체크리스트가 깃허브 이슈, PR과 이어지게 한다. Hatch는 이슈 제목 앞 `[T번호]`(또는 그 이슈를 `Closes` 하는 PR)로 항목에 붙이는데, 지금 이슈 제목에 번호가 없어 하나도 이어지지 않았다.

## 한 일
- 이미 있는 이슈 16개 제목 앞에 `[T번호]` 붙임 (예: #9 → `[T5][단계 2] DB와 권한`, #13 → `[T17]`, #25 → `[T16]`)
- 이슈 양식(할 일, 버그) 제목 틀을 `[T번호][단계 N]`, `[T번호][버그]`로, 번호 표 안내 추가
- CONTRIBUTING 이슈 절: 규칙과 체크리스트 번호 표(2026-11-25 기준, 원본은 Hatch), 딱 맞는 게 없을 때 고르는 법
- CLAUDE.md 이슈부터: 초안 제목의 `[T번호]`는 CONTRIBUTING 표에서 고른다
- PR 검사 `issue`(`scripts/check-issue.sh`): 이어진 이슈 제목이 `[T번호]`로 시작하지 않으면 막는다
- `scripts/test-check-issue.sh` 추가: 가짜 gh로 10가지 경우

## 프롬프트 요약
1. Hatch 체크리스트가 깃허브와 동기화가 안 되는 이유가 머지가 안 돼서인가
2. 맞는 이슈만 [T] 붙여
3. 나머지도 T 붙여서 올라오게 바꾸고, 이미 올라온 건 알아서 붙여

## 사용한 skill
- 없음 (gh CLI로 이슈 제목 수정, 이슈 #30, PR)

## 확인
- `bash scripts/test-check-issue.sh` 10개 통과. 바꾸기 전 검사로 돌리면 3개 틀림 (테스트가 차이를 잡는다)
- `bash scripts/test-check-worklog.sh`, `gitleaks dir .` → 결과는 PR 설명에
- 열린 PR #28, #29가 가리키는 이슈(#27, #11)도 번호가 붙어 새 검사를 통과한다

## 남은 일
- Hatch 체크리스트 화면에서 이어진 것 확인 (Hatch가 깃허브를 5분 동안 기억해 둔다)
- 체크리스트 항목이 바뀌면 CONTRIBUTING 표도 고친다
- 아래 사용량이 0인 것은 이번 작업 세션을 다른 폴더에서 열어서다 (이 레포 폴더에서 연 세션만 센다)


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

<!-- usage {"branch":"jjongw/chore-30-issue-t-tag","issue":30,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

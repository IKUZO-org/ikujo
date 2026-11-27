# 홈의 지워진 손님 안내 문구 빼기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-25 |
| 사람 | @roohyeon |
| 브랜치 | roohyeon/fix-24-home-guest-notice |
| 이슈 | #24 |
| 문서 번호 | S-02, D-018 |

## 할 일
spec 3판 S-02(D-018 로그인 없음)에서 지워진 "로그인하면 완료 기록이 남아요" 문구를 홈 화면에서 뺀다.

## 한 일
- `src/app/home-view.tsx`: 손님 안내 문구 한 줄 삭제
- `src/` 에 로그인, 완료 기록(FR-090) 관련 화면 문구가 더 없는지 찾아봄 → 없음

## 프롬프트 요약
1. PR #22 머지를 확인해 달라 → 머지됨, 같이 들어온 #19 문서 변경으로 홈 화면이 spec과 어긋난 것을 찾음
2. 제안대로 버그 이슈와 5단계 이슈 초안을 만들어 달라
3. 두 이슈를 만들고 버그부터 진행해 달라 → #24, #25

## 사용한 skill
- 없음 (`worklog` skill 양식대로 직접 씀)
- 서브에이전트, MCP: 없음

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 4개 파일, 57개 통과
- `prettier --check`(커밋될 내용) → 통과
- 화면 확인 → 안 돌림 (Supabase 없이 화면이 뜨지 않음)

## 남은 일
- #24 두 번째 항목: spec S-02 "닉네임이 없으면 S-03". 닉네임을 이 폰에 기억할지, 어디에 둘지(브라우저 저장소 또는 쿠키)는 문서에 없어 PO 결정 필요. PR 검사 `issue` 가 `Closes #N` 만 받아서 이 PR이 머지되면 #24가 닫힘 → 결정이 나면 새 이슈로 이어서 고침

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

<!-- usage {"branch":"roohyeon/fix-24-home-guest-notice","issue":24,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

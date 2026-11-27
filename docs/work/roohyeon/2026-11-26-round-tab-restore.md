# 라운드 화면 새로 고침 뒤 탭 복원

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @roohyeon |
| 브랜치 | roohyeon/fix-44-round-tab-restore |
| 이슈 | #44 |
| 문서 번호 | S-09, AC-NFR-002, spec §6 |

## 할 일
라운드 화면(S-09)에서 "내 단서" 탭을 고르고 새로 고치면 "모두의 단서"로 돌아가던 문제를 고친다. 개인 내용은 다시 가리고, 다음 라운드는 "모두의 단서"부터 연다.

## 한 일
- `src/app/(game)/room/[code]/round.tsx`
  - 고른 탭을 sessionStorage 의 `last-one:round-tab:<gameId>:<phase>` 에 저장하고, 처음 그릴 때 읽는다
  - 가리기(`usePrivateReveal`)는 그대로 닫힌 채 시작해서 새로 고쳐도 "눌러서 보기"가 다시 뜬다
  - sessionStorage 읽기, 쓰기를 `readItem`, `writeItem` 으로 묶었다. 저장소를 못 쓰는 브라우저에서는 오류 없이 "모두의 단서"로 연다 (본 단서 기록도 같은 함수를 쓴다)
- `src/app/(game)/room/[code]/room-view.tsx`
  - `Round` 의 key 를 `${game.id}:${game.phase}` 로 바꿔 라운드마다 새로 그린다. 탭, 가리기, 오류가 다음 라운드로 넘어가지 않는다

## 프롬프트 요약
1. 로컬 Supabase 상태를 보여 달라고 함
2. 그 결과로 무엇을 하라는 것인지 물음
3. 키를 `.env.local` 에 어떻게 옮기는지 물음 (사용자가 직접 `supabase status` 를 돌림. [가림] 로컬 전용 기본 키가 채팅에 나왔고, 실제 서비스 키는 이렇게 띄우지 말라고 안내함)
4. `npm run dev` 를 켜 달라고 함. 이미 돌던 서버를 끄고 새로 켜 달라고 함
5. 라운드 탭 복원이 잘 되는지 확인해 달라고 함
6. 다른 브라우저로 4명을 어떻게 만드는지 물음
7. 직접 확인했고 잘 된다며 작업 기록과 커밋을 요청함

## 사용한 skill
- `worklog`: 이 기록을 씀
- 서브에이전트, MCP: 없음

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 8개 파일, 97개 테스트 통과 (탭 복원을 직접 검사하는 테스트는 없음)
- 브라우저 확인 (사용자가 직접): 브라우저 창 4개로 4명을 만들어 판을 진행. 390×844에서 "내 단서" 탭을 고르고 새로 고치면 가린 채 그 탭으로 열리고, 다음 라운드는 "모두의 단서"로 열림. 사용자가 "잘 된다"고 알림
- Claude는 브라우저를 조작하는 도구가 없어 화면 확인을 직접 하지 않음

## 남은 일
- 탭 복원을 검사하는 자동 테스트가 없다 (컴포넌트 테스트 환경이 생기면 추가)

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

<!-- usage {"branch":"roohyeon/fix-44-round-tab-restore","issue":44,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

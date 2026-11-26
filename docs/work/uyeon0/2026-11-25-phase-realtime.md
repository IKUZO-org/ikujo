# 단계 진행과 실시간

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-25 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/feat-21-phase-realtime |
| 이슈 | #21 |
| 문서 번호 | 단계 6, spec §1.1, §4, §9(OQ-007), data §5, NFR-001, NFR-002, AC-NFR-002, BR-009 |

## 할 일
방의 폰들이 같은 단계와 남은 시간을 보고, 시간이 끝나거나 모두 준비하면 같이 다음 단계로 넘어가게 한다. 단계 규칙, `advance`/`ready` Server Action, 서버 시각 보정, `useRoomState` 훅, 상단 고정 바까지.

## 한 일
- `src/server/phase.ts`: spec §1.1 단계 표(길이, 다음 단계)와 `canAdvance`. intro, secret 은 모두 준비하면 미리 넘어감, r1~r3 은 시간으로만 (OQ-007). vote, revote 판정은 단계 9
- `src/server/game-phase.ts`, `src/server/actions/phase.ts`
  - `advance`: 참가자 확인, `update ... where phase = from` 으로 한 번만 넘김. 라운드 공용 단서 공개(r3 은 이번 판 범인을 가리키는 것 하나만), r2 진입 때 `is_ghost`, `phase` 신호. 안 넘어간 이유(`stale`, `no_next`, `too_early`)를 돌려줌
  - `ready`: `readies` 에 한 번만 넣고 `count` 신호, 모두 준비하면 그 자리에서 `advancePhase`
- 신호: PR #22 의 `src/lib/realtime.ts`(`SIGNAL_EVENT`)에 맞추고, `count` 는 data §5 모양(`votes` 는 투표 때만)
- `src/server/rooms/core.ts`: `getRoomState` 응답에 `serverNow`
- `src/lib/room-clock.ts`: 시계 차이 보정, 남은 시간, mm:ss 표시
- `src/lib/use-room-state.ts`: 열 때, 신호 받을 때, 0일 때 다시 읽기. 0이면 `advance` (한 폰이 단계마다 한 번, `too_early` 일 때만 1.5초 뒤 재시도)
- `phase-bar.tsx`, `page.tsx`: 상단 고정 바(사건 제목, 단계, 남은 시간). 제목은 서버에서 문자열만 넘김
- `room-view.tsx`: 읽기와 구독을 훅으로 옮기고 게임 중에 바를 끼움. `Screen.tsx`: 선택 항목 `top` (노치 여백 한 번, 한 화면 안)
- 테스트: `tests/phase.test.ts`, `tests/room-clock.test.ts`, `tests/db/phase.test.ts`, `tests/rooms.test.ts` 한 줄. `server-only` 스텁을 vitest 설정에 연결

## 프롬프트 요약
1. 단계 6이 무엇인지 확인하고, 시간 기준을 서버 시각으로 보정하는 내용을 이슈에 넣어 #21 을 올림
2. 코드 작업은 opus 에이전트(Orca 개발 세션)에 맡기고 한 단계씩 진행하기로 함
3. PR #22 리뷰 뒤 develop 에 rebase 하고, 신호 이름과 `count` 모양을 PR #22 와 data §5 에 맞춤 (`votes` 는 생략)
4. `getRoomState` 에 서버 시각을 넣고 `useRoomState` 훅을 만듦
5. 리뷰에서 찾은 두 가지(모두 준비해도 미리 안 넘어감, 투표 단계 반복 재시도)를 고침
6. 상단 고정 바를 만듦 (이슈 범위인지 확인함)
7. 브라우저 창 4개로 확인하고, 노치 여백 문제를 고침
8. PR #32 리뷰에서 나온 R3 공용 단서를 이번 판 범인 것만 열도록 고침
9. PR 에 넣을 시연 영상을 녹화함 (시크릿 창, 영역 녹화)
10. rebase 하고 작업 기록과 PR 본문 초안을 씀.

## 사용한 skill
- `devdocs:write` (개인 skill, 레포에 없음): 이슈 #21, PR 본문 초안
- `orca-cli`, `orchestration`: Orca 개발 세션(opus)에 작업을 나눠 맡김
- `worklog`: 이 기록

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과, Prettier 검사 통과
- `npm test` → 69개 통과
- `npm run test:db` → 20개 통과 (로컬 Supabase). 동시 `advance` 한 번만, r1 공용 단서, r3 범인 단서 하나만, intro 모두 준비(마지막 두 명 동시) → secret, r1 모두 준비해도 시간 전 그대로
- 브라우저 창 4개(390×844, 로컬 Supabase, 참가자 4명) → 시간이 끝나면 4창이 1초 안에 같이 intro → secret → r1, 새로 고침해도 같은 단계와 남은 시간(1초 안), `advance` 단계마다 한 번, 게임 중 스크롤 없음
- 모두 준비해서 미리 넘어가는 동작은 화면에서 안 봄 ("다음" 버튼은 단계 7). `test:db` 로만 확인

## 남은 일
- "다음"/"확인" 버튼과 단계별 화면 내용: 단계 7
- vote, revote 판정: 단계 9
- R3 공용 단서를 "범인 것만" 여는 규칙은 문서에 직접 없음. BR-009, spec §5-3, data `pointsTo` 로 판단함. PR #32 와 같이 확인
- 상단 바 사건 제목 위치: spec §2, PRD §13 은 상단 바, PR #29 DESIGN.md 는 등장인물 보기 안. 정해야 함
- PR #29 머지 뒤 상단 바 모양을 토큰 값에 맞추기
- PR #32 머지 뒤 rebase 때 테스트 `Deps` 에 `assignModel: null`
- AI 배정을 기다리는 동안(`playing` 인데 game 없음) 화면 처리는 PR #32 와 같이 확인

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-25). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | $3.73 (세션 2개) |
| 토큰 | 입력 1.3k · 출력 263.8k · 캐시 쓰기 1.1M · 캐시 읽기 64.1M |
| 메시지 | 503 (메인 330, 서브에이전트 173) |
| 모델 | claude-opus-5-5 503 |
| 사용률 | 5시간 18% → 8% · 주간 27% → 30% |
| 많이 쓴 도구 | Bash 350, Read 17, SubagentHandback 10, Write 8, SendMessage 7, Agent 6, Skill 5, Edit 2 |
| skill | orca-cli 3, devdocs:write 2 |
| 에이전트 | general-purpose 1 |

<!-- usage {"branch":"uyeon0/feat-21-phase-realtime","issue":21,"sessions":2,"messages":503,"first":"2026-11-25","last":"2026-11-25","tokens":{"input":1258,"output":263814,"cacheWrite":1055013,"cacheRead":64085785},"costUSD":3.7304,"where":{"main":{"messages":330,"output":174265},"subagent":{"messages":173,"output":89549}},"models":{"claude-opus-5-5":{"messages":503,"output":263814}},"tools":{"Bash":350,"SubagentHandback":10,"Agent":6,"Skill":5,"Write":8,"Edit":2,"Read":17,"ToolSearch":2,"TaskStop":2,"SendMessage":7},"skills":{"orca-cli":3,"devdocs:write":2},"agents":{"general-purpose":1},"rate":{"five_hour":{"from":18,"to":8},"seven_day":{"from":27,"to":30}}} -->

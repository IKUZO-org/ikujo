# 단계 7: 오프닝, 인물 카드, 라운드 화면

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @roohyeon |
| 브랜치 | roohyeon/feat-37-game-screens |
| 이슈 | #37 |
| 문서 번호 | 단계 7, S-06, S-07, S-08, S-09, FR-020, FR-021, FR-030, FR-040~044, NFR-006, NFR-007, AC-030, AC-NFR-002, OQ-007, OQ-011 |

## 할 일
배정이 끝난 뒤 오프닝 → 인물 카드 → 라운드 1~3 화면을 단계(games.phase)에 따라 그린다. 개인 내용은 getMine 으로만 받고, 범인 안내는 범인 폰에만 보인다 (AC-030).

## 한 일
- 서버
  - `src/server/reads.ts`, `src/server/actions/get-mine.ts`: `getMine(gameId)`. 세션으로 참가자 확인 후 내 인물, 비밀, 알리바이, 범인 여부, 내 단서만. 단서는 지금 라운드까지만 (다음 라운드 개인 단서를 미리 안 보냄)
  - `src/server/rooms/core.ts`: `getRoomState` 의 `game` 에 공용 정보 추가 (spec §4): 라운드 번호·장소·시점, 공용 단서, 준비 인원 n/N, 내가 눌렀는지. `revealed_clues` 에 개인 단서가 잘못 들어가도 공용 응답에는 안 싣게 한 번 더 거름
  - `src/server/rooms/store.ts`, `supabase-store.ts`, `tests/fakes/memory-store.ts`: `getGame`, `listRevealedClues`, `listReadyPlayerIds`, `getAssignment`
- 화면 (`src/app/(game)/room/[code]/`)
  - `room-view.tsx`: 단계에 따라 S-05 대기실 / S-06 배정 중 / S-07 / S-08 / S-09. vote 이후는 "다음 화면을 준비하고 있어요" 자리만 (단계 9)
  - S-06: "진행자가 사건을 준비하고 있어요", 15초 뒤 "조금만 더 기다려 주세요"
  - `opening.tsx` S-07: 방송 예고 → 단톡방 PD 메시지 → 정전 → 발견, 네 장면을 글로. 마지막 "다음"이 `ready(intro)`. 범인 행동(21:50, 22:00~22:10)은 넣지 않음. TTS 는 글로만 (OQ-011)
  - `character-card.tsx` S-08: "나만 보기" 띠 + 테두리, 처음엔 가림 → 눌러서 보기. 열어야 "확인했어요 n/N". 범인 안내도 같은 색, 같은 모양
  - `round.tsx` S-09: 모두의 단서 / 내 단서 탭. 새 개인 단서면 내 단서 탭에 점 + `navigator.vibrate`, 본 단서는 sessionStorage 에 기억. 준비 완료는 현황만, 넘어가기는 타이머로만 (OQ-007)
  - `phase-bar.tsx`: DESIGN.md TopBar 모양 (52px, 3칸, Timer 알약)
  - `src/lib/use-mine.ts`: 방 상태를 다시 읽을 때마다 getMine 도 다시 읽는 훅
- 컴포넌트
  - `src/components/game.tsx`: GameScreen(그래픽 영역 + 가운데 글 + 아래 버튼, 개인 화면 표시), Timer(60초부터 빨강), Tabs, Card, NewBadge, Chip, usePrivateReveal, EyeIcon
  - `src/components/Button.tsx`: DESIGN.md 확정 모양으로 (52px, 빨간 면 + 아이보리 글자, 꺼짐은 surface). 홈, 대기실 버튼 모양도 같이 바뀜
- 테스트 `tests/mine.test.ts` 9개
- 화면 캡처 (가짜 데이터, 390×844): [2026-11-26-game-screens/](2026-11-26-game-screens/)

## 프롬프트 요약
1. develop pull 하고 지금 상황 브리핑해 달라
2. 머지된 로컬 브랜치를 정리하고 7단계 이슈 초안을 써 달라 → 초안 승인, 이슈 #37 생성과 브랜치 생성
3. 공통 규칙 + 7단계 프롬프트(dev-prompt 7단계)를 붙여 S-07~S-09 화면을 만들어 달라. DESIGN.md 를 따라 UI 를 만들 것
4. 가짜 데이터 임시 미리보기를 나도 보여 달라
5. 미리보기를 지우고 작업 기록 쓰고 커밋해 달라. PR 에 미리보기 캡처로 화면 구성과 사용 시 주의를 같이 알려 주면 좋겠다

## 사용한 skill
- worklog: 이 기록
- 서브에이전트, MCP: 없음
- 화면 확인용으로 임시 경로 `src/app/zz-preview`(가짜 데이터)와 scratchpad 의 puppeteer-core + 설치된 Chrome 으로 캡처. 임시 경로는 지웠고 커밋에 없음. puppeteer-core 는 레포 패키지에 넣지 않음

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 8파일 99개 통과 (새 `tests/mine.test.ts` 9개: AC-030 공용·개인 응답에 범인 인물 id·이름 0건, 범인 폰만 isCulprit, 단서는 지금 라운드까지, 참가자 아님·잘못된 gameId 거절, getRoomState 공용 정보)
- 바꾼 파일 `prettier --check` → 통과
- 화면: 가짜 데이터 미리보기로 390×844, 360×740 캡처를 눈으로 확인. 안 깨짐
- `npm run test:db` → 안 돌림 (Docker 꺼짐, 로컬 Supabase 없음)
- 실제 Supabase 로 4명 한 판(intro → vote), 새로 고침 유지(AC-NFR-002), 실제 폰 진동 → 안 돌림 (`.env.local` 없음)

## 남은 일
- 이슈 #37 기준 중 "4명 판 intro → vote 까지 끊기지 않음", "r2 중 새로 고침해도 그대로(AC-NFR-002)" 는 로컬 Supabase 로 확인해야 함
- 사건 제목 자리: spec §2·PRD §13 은 상단 바, DESIGN.md §6 은 등장인물 보기 안. docs 를 따라 상단 바 왼쪽에 둠. 상경과 정해야 함
- 오프닝 문구는 PRD §28 에서 뽑아 `opening.tsx` 에 둠. 시나리오 파일(data §4)로 옮길지 시나리오 담당과 정할 것 (Hatch 문서)
- 공용 단서 일부가 시나리오에 `TODO(시나리오 담당)` 글이라 화면에 그대로 보임
- 등장인물 보기, 설정(S-13) 아이콘은 상단 바에 아직 없음
- 이벤트 덮는 화면(FR-044, S-14), 유령 모드(S-10)는 단계 8
- `scripts/usage/lib.mjs:26` 이 Windows 에서 기록 경로(`C:\...`)와 git 경로(`C:/...`)를 비교해 사용량이 늘 0으로 나옴. 사용량 담당(종원)에게 넘길 것

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

<!-- usage {"branch":"roohyeon/feat-37-game-screens","issue":37,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

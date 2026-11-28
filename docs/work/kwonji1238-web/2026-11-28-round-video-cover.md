# 라운드 2, 3 영상만 그래픽 영역에 꽉 채우기(cover), R3는 세로 47%

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-28 |
| 사람 | @kwonji1238-web |
| 브랜치 | kwonji1238-web/feat-143-round-video-cover |
| 이슈 | #143 |
| 문서 번호 | S-09, FR-081, PRD §28.9 / ART.md §12, docs/video/RULES.md §3 (#106 contain 결정) |

## 할 일
라운드 화면(S-09) 공용 탭의 영상(R2 V-02, R3 V-03)만 그래픽 영역에 `cover`(꽉 채우기)로 넣고, R3는 세로 47% 기준으로 자른다. 기본은 문서대로 `contain`(#106)이 맞고, 라운드 2, 3만 예외로 조정한다. 문서와 다른 화면은 건드리지 않는다.

## 한 일
- `src/components/GameVideo.tsx`: 선택 항목 `fit`(`"contain"` | `"cover"`, 기본 `"contain"`)과 `position`(CSS `object-position`)을 더했다. 값을 넘기지 않는 오프닝(V-01), 유령 연출(V-04, V-05), 해설(V-06, V-07, V-09)은 그대로 `contain`
- `src/app/(game)/room/[code]/round.tsx`: 라운드 영상에 `fit="cover"`, R3에 `position="50% 47%"`를 넘긴다. 문서의 `contain`이 기본이고 라운드 2, 3만 예외라는 것과 그 이유(단서 글 때문에 영역이 납작해 `contain`이면 영상이 너무 작아짐)를 주석에 남겼다
- 이슈 #143을 만들고 본문에 "기본은 `contain`, 라운드 2, 3만 예외로 조정, 문서는 고치지 않음"을 적었다. 최신 `develop`(d72b540)에서 브랜치를 땄다
- `ART.md` §12, `docs/video/RULES.md` §3은 고치지 않았다 (사용자 결정: 문서의 `contain`이 기본으로 맞다)
- 정하기 전에 DB 없이 화면을 보려고 확인용 임시 파일(미리보기 페이지 2개, `.claude/launch.json`, `out/video-preview/`)을 만들었고, 확인이 끝난 뒤 모두 지웠다. 커밋에 들어가지 않는다. 캡처와 비교 이미지, 비교 영상은 레포 밖 임시 폴더에만 있다

## 프롬프트 요약
1. Next.js 서비스를 로컬로 띄워 달라고 함 → Supabase 값이 없어 자리표시자 환경 변수로 화면만 보는 모드로 띄움
2. 라운드 2 화면을 보여 달라고 함 → DB 없이 임시 미리보기 페이지로 보여 줌
3. 영상 부분을 화면에 꽉 채우면 어떻게 보이는지 캡처해 달라고 함 (코드는 고치지 말 것) → 브라우저에서만 스타일을 바꿔 캡처
4. 다른 라운드와 화면의 영상은 어떻게 보이는지 캡처해 달라고 함
5. 영상들을 cover로 채우면 어디가 얼마나 잘리는지 캡처해 달라고 함 (코드는 절대 고치지 말 것)
6. 라운드 3 화면의 TODO 자리에 무엇이 들어가는지 물음 → PRD §28.13 단서 표를 안내하고, R3 공용 단서는 그 판 범인 것 1개만 열린다는 점으로 앞 캡처를 바로잡음
7. 라운드 2, 3만 cover로 키우면 어떻게 보이는지 캡처해 달라고 함 (코드는 절대 고치지 말 것)
8. cover일 때 세로로 긴 폰이면 영상이 더 보이는지 물음 → 폰 크기 6가지로 영상 칸을 잼
9. cover로 하면 컷별로 어떻게 보이는지 캡처해 달라고 함, 도중에 라운드 2, 3만 보면 된다고 좁힘
10. V-03 영상도 보여 달라고 함 → 원본과 cover 비교 영상을 만들어 보냄
11. 영상이 왜 재생되지 않는지 물음 → 앱의 로컬 파일 보기가 재생을 하지 않아서, http 주소로 다시 열어 줌
12. V-03을 cover일 때 가운데가 아니라 조금 아래로 내릴 수 있는지 물음 (질문만) → `object-position` 으로 된다고 답함
13. 세로 위치 50, 40, 30%로 보여 달라고 함 → 컷별 비교 이미지
14. 지금까지 코드 변경이 하나도 없는지 확인하고, 라운드 2, 3 영상만 `contain` → `cover`, R3는 세로 47%, 다른 곳은 절대 건드리지 말라고 함. 이슈 초안을 승인하며 "문서의 `contain`이 맞고 라운드 2, 3만 예외로 조정했다"고 기록해 달라고 함
15. 작업 기록을 써 달라고 함. 확인용 임시 파일은 깃에 올라가지 않게 해 달라고 함

## 사용한 skill
- `run` skill: 로컬 개발 서버 띄우기
- `worklog` skill: 이 기록
- MCP: Claude 브라우저(개발 서버 띄우기, 화면 캡처, 스타일을 브라우저에서만 바꿔 보기, 390×844 확인), Supabase MCP(프로젝트 목록만 조회, 키는 가져오지 않음)
- GitHub CLI(`gh`): 열린 이슈 확인, 이슈 #143 만들기
- 로컬 도구: `npm ci`, `ffmpeg`/`ffprobe`(컷별 프레임 뽑기, 비교 영상 만들기), 파이썬 PIL(비교 이미지 합치기)
- 서브에이전트: 없음

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 14개 파일, 153개 테스트 통과
- 390×844 브라우저 확인 (DB 없이 임시 미리보기 페이지로 실제 컴포넌트를 그림): R2 V-02 `cover` 50% 50%, R3 V-03 `cover` 50% 47%, 오프닝 V-01과 V-04, V-05, V-06, V-09는 `contain` 그대로. 라운드 2, 3 화면에서 영상이 양옆 띠 없이 칸을 채우는 것을 봄
- V-07은 V-06과 같은 해설 화면 코드라 따로 재지 않음
- 실제 방(Supabase 연결)에서는 확인 안 함 (`.env.local` 값이 없음)
- `npm run test:db` → 안 돌림

## 남은 일
- 커밋, push, PR (`develop` 으로, `Closes #143`)
- 실제 방에서 R2, R3 화면 확인 (Supabase 값 필요)
- cover로 잘리는 부분 (375×812, 실제 단서 문장을 넣어 잼): R2는 높이의 약 56%가 잘려 위쪽 출연진과 아래 편집툴이 대부분 안 보인다. R3는 약 72%가 잘려 모서리 녹화 표시(꺾쇠, REC 점, 배터리)가 안 보인다. 세로 47%는 50%보다 위쪽이 약 13px(390×844) 더 보인다
- 시나리오의 TODO 단서(c-r1-01, c-r1-02, c-r3-01~04 등)가 `scenarios/live-death.json` 에 들어오면 라운드 영상 칸이 더 작아질 수 있어 그때 다시 본다

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-28). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 44 · 출력 24.6k · 캐시 쓰기 45.9k · 캐시 읽기 10.4M |
| 메시지 | 19 (메인 19, 서브에이전트 0) |
| 모델 | claude-opus-5-5 19 |
| 사용률 | 기록 없음 (상태줄 사용률이 켜진 뒤부터 남는다) |
| 많이 쓴 도구 | Bash 10, mcp__ccd_turn__update_plan 6, Edit 5, Grep 2, mcp__Claude_Browser__browser_batch 2, mcp__Claude_Browser__tabs_close 2, mcp__Claude_Browser__navigate 2, Read 1 |
| skill | worklog 1 |
| 에이전트 | 없음 |

<!-- usage {"branch":"kwonji1238-web/feat-143-round-video-cover","issue":143,"sessions":1,"messages":19,"first":"2026-11-28","last":"2026-11-28","tokens":{"input":44,"output":24579,"cacheWrite":45853,"cacheRead":10449766},"costUSD":null,"where":{"main":{"messages":19,"output":24579},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":19,"output":24579}},"tools":{"Bash":10,"Read":1,"Grep":2,"mcp__ccd_turn__update_plan":6,"Edit":5,"mcp__Claude_Browser__tabs_create":1,"mcp__Claude_Browser__browser_batch":2,"mcp__Claude_Browser__preview_stop":1,"mcp__Claude_Browser__tabs_close":2,"mcp__Claude_Browser__navigate":2,"mcp__Claude_Browser__preview_list":1,"mcp__Claude_Browser__preview_logs":1,"mcp__ccd_turn__wrap_up":1,"Skill":1,"Write":1},"skills":{"worklog":1},"agents":{},"rate":null} -->

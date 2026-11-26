# 온보딩(S-01)과 설정(S-13)

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/feat-73-onboarding-settings |
| 이슈 | #73 |
| 문서 번호 | FR-002, FR-091, FR-081, D-018, NFR-006, NFR-007, S-01, S-13, 단계 11 |

## 할 일
단계 11 중 온보딩과 설정을 만든다. 하루 한 번 정리 작업은 #72(마이그레이션 008) 머지 뒤 다음 PR 에서 한다.

## 한 일
- `src/lib/settings.ts`: 소리, 진동 켜기/끄기와 온보딩 본 적을 이 폰의 localStorage 에 저장 (로그인 없음, D-018). 저장소를 못 쓰면 기본값(켜짐, 안 봄)으로 돌고 던지지 않음. `vibrate()` 는 진동 설정이 켜졌을 때만 떨림
- `round.tsx`: 새 개인 단서 진동이 `vibrate()` 를 거쳐 설정을 따름. 점 알림은 그대로 (DESIGN §7)
- `src/components/settings.tsx`: 설정 아이콘(44px, `aria-label`) → `Sheet` 에 소리, 진동 스위치(켜짐/꺼짐 글자도 같이), "온보딩 다시 보기". 온보딩 4장(건너뛰기, 마지막 장 "시작하기"), 글은 PRD §11 한 판 흐름으로 쓴 임시 문구, 그래픽 영역은 어셋 전이라 검정 그대로 (#23 전)
- 온보딩은 홈(S-02)에 들어올 때 처음 연 사람에게만 덮어 띄움 (PRD §12 "온보딩 → 홈"). 서버 그림에서는 본 것으로 두어 깜빡임 없음
- 설정 아이콘 자리: 게임 상단 바(`phase-bar.tsx`) 왼쪽, 사건 제목 앞. 상단 바가 없는 화면(홈, 닉네임, 대기실 등 `Screen`)에는 설정 아이콘만 있는 바를 둠. PRD §12 "상단 네비: 설정 (어느 화면에서나)" 를 따른 판단
- 설정 시트와 온보딩은 `createPortal` 로 `body` 에 그림. 게임 중 상단 바 안에 그리면 개인 화면 테두리(`fixed`)가 그 위에 겹쳐서
- `phase-bar.tsx` 머리 주석을 지금 상태로 (설정 아이콘은 생겼고 등장인물 보기만 없음)
- `tests/settings.test.ts`: 저장, 저장소가 막힌 경우, 진동 끄기

## 프롬프트 요약
1. #73 중 온보딩과 설정만 먼저 한다. 정리 작업은 #72 머지 뒤로 미룸 (008 의 `stale` 값이 필요해서)
2. 값은 이 폰에만, 새로 고침 뒤에도 남게. 저장소가 막혀도 화면이 깨지지 않게
3. 소리 재생은 새로 만들지 않음. 이미 있는 곳(진동)만 설정을 따르게 하고, 없는 곳은 읽는 도우미만 둠
4. 아이폰 진동 문제는 숨기지 않음 (PO 확인 예정)
5. 설정 아이콘은 PRD §12 "어느 화면에서나"에 따라 게임 화면뿐 아니라 홈, 닉네임, 대기실에도 둠
6. ponytail-review 가 찾은 "게임 중 설정 시트가 개인 화면 테두리 아래에 깔림"을 고치고, 게임 화면에서 다시 확인

## 사용한 skill
- hatch MCP `read_doc`: 문서 판 번호 확인 (PRD 7, 기능명세 5, 개발 프롬프트 6, 사본과 같음)
- `demo-record` (로컬 skill): 시크릿 창 열기, cliclick 으로 스크린샷 확인 (녹화 안 함)
- `worklog`: 이 기록
- 에이전트 test-pruner, comment-reviewer, ponytail-review: PR 전 목록 받기

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 11 파일, 125 테스트 통과
- `npm run test:db` → 안 돌림 (DB 변경 없음)
- 브라우저 (빌드 화면, 시크릿 창 390×844, 로컬 Supabase): 처음 열면 온보딩 1장, "다음"으로 2장, 건너뛰기 → 홈, 설정 시트 열기, 소리 끄고 새로 고침 → 온보딩이 다시 안 뜨고 소리 "꺼짐" 유지, "온보딩 다시 보기" → 1장부터. 모두 확인
- 브라우저 게임 화면 (같은 조건, 4명 중 3명은 로컬 DB 참가자, 라운드 1 개인 탭): 상단 바 설정 아이콘 → 시트가 "나만 보기" 테두리와 상단 바 위를 덮음, 소리/진동 토글, 닫기 → 테두리 그대로. 모두 확인
- 안 본 것: 360px, 430px 폭, 실제 폰 진동

## 남은 일
- 소리를 내는 코드가 아직 없음 (`public/sounds` 파일만 있음). 소리를 붙일 때 `isOn("sound")` 를 읽어야 함 (docs/sound.md "공용 소리는 방장 폰만", "첫 탭에서 소리 열기")
- 아이폰에서는 `navigator.vibrate` 가 없어 진동 설정이 효과가 없음. 지원 안 되는 폰에서 진동 칸을 숨길지 PO 확인
- 온보딩 그림(#23 뒤), 문구 확정
- 360px, 430px 확인
- 하루 한 번 정리 작업 (#72 머지 뒤 다음 PR)

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-26). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | $5.02 (세션 3개) |
| 토큰 | 입력 260 · 출력 50.4k · 캐시 쓰기 306.9k · 캐시 읽기 13.2M |
| 메시지 | 122 (메인 110, 서브에이전트 12) |
| 모델 | claude-opus-5-5 122 |
| 사용률 | 5시간 27% → 33% · 주간 37% → 38% |
| 많이 쓴 도구 | Bash 99, Read 21, SubagentHandback 3, Write 3, Agent 3, ToolSearch 1, mcp__hatch__read_doc 1, Skill 1 |
| skill | worklog 1 |
| 에이전트 | test-pruner 1, comment-reviewer 1, ponytail-review 1 |

<!-- usage {"branch":"uyeon0/feat-73-onboarding-settings","issue":73,"sessions":3,"messages":122,"first":"2026-11-26","last":"2026-11-26","tokens":{"input":260,"output":50403,"cacheWrite":306867,"cacheRead":13168712},"costUSD":5.0175,"where":{"main":{"messages":110,"output":43808},"subagent":{"messages":12,"output":6595}},"models":{"claude-opus-5-5":{"messages":122,"output":50403}},"tools":{"Bash":99,"SubagentHandback":3,"ToolSearch":1,"mcp__hatch__read_doc":1,"Write":3,"Read":21,"Skill":1,"Agent":3},"skills":{"worklog":1},"agents":{"test-pruner":1,"comment-reviewer":1,"ponytail-review":1},"rate":{"five_hour":{"from":27,"to":33},"seven_day":{"from":37,"to":38}}} -->

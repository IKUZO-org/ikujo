# QA 화면 5건: 방 코드 복사(PC), 화면 전환, 홈으로 속도, 줄바꿈, 라운드 상단 문구

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-28 |
| 사람 | @roohyeon |
| 브랜치 | roohyeon/fix-136-qa-screens |
| 이슈 | #136 |
| 문서 번호 | spec §2 공통 틀, S-05, S-09, S-10, S-12, DESIGN.md §6 TopBar, §7 |

## 할 일
11/28 QA에서 온 화면 쪽 6건 중 5건(2~6번)을 고친다. QA 1번(상단 사건 제목 빼기)은 PRD §13, spec §2 와 달라서 PO 확인 뒤 따로 한다.

## 한 일
- **6. 라운드 상단 문구** (`src/lib/phase-label.ts` 새로, `phase-bar.tsx`, `room-view.tsx`, `round.tsx`)
  - 준비 완료 전 "라운드 N", 준비 완료 뒤 "라운드 N · 토론 중"
  - R2, R3 희생자 폰(유령 모드)은 "사망"
  - 준비 완료를 누른 뒤 버튼 문구 "준비했어요" → "토론 중"
  - 문구 규칙을 `phaseLabel` 순수 함수로 빼고 테스트 추가 (`tests/phase-label.test.ts`)
- **5. 줄바꿈** (`globals.css`): `word-break: keep-all`(어절 단위), `overflow-wrap: anywhere`(띄어쓰기 없는 긴 글 넘침 방지), `text-wrap: pretty`. R2 단서 "말할 거 / 야." → "말할 / 거야." 확인
- **2. 방 코드 복사** (`src/lib/copy-text.ts` 새로, `room-view.tsx`): `navigator.clipboard` 가 실패하면(http 주소, 포커스 없음) 예전 방식(`execCommand("copy")`)으로 한 번 더. 그래도 못 하면 "복사하지 못했어요. 코드를 직접 알려 주세요"
- **4. 해설 끝 '홈으로'** (`reveal.tsx`): 나가기 처리 뒤 방을 다시 읽느라(Server Action 한 번 더) 홈이 늦게 떴다. 떠날 때는 다시 읽지 않고 바로 이동, 해설 화면에서 홈을 미리 받아 둠(`router.prefetch`)
- **3. 화면 전환** (`globals.css`, `components/game.tsx`, `components/GameVideo.tsx`): 프레임을 찍어 보니 단계가 바뀔 때 빈 화면 → 글 → 그림 순서로 툭툭 바뀜. 상단 바는 그대로 두고 본문과 버튼이 `--duration-base`(240ms)로 나타나게, 영상은 첫 장면이 준비되면 나타나게. 움직임 줄이기 설정이면 끔

## 프롬프트 요약
1. 도커로 로컬 화면 4개 띄우기 → 앱은 익명 로그인 쿠키라 Docker 대신 개발 서버 1개 + 프로필이 다른 Chrome 창 4개로
2. 띄우기 전에 git pull 하고 바뀐 것 브리핑
3. 다음 라운드로 넘기기, R2를 5초로, R3를 10초로, R3로 되돌리기, 투표로 넘기기 (로컬 DB에서 마감 시각과 단계만 바꿈)
4. 답은 한국어로
5. QA 6건 받음: 확인하고 원인 정리
6. QA 1번은 PO에게 물을 내용과 Hatch PRD 댓글 초안 정리
7. 6번을 로컬 화면으로 보여 달라 → 직접 방 만들기부터 해 달라 → R1, R2, R3 화면 보여 주기
8. 6번 문구를 정해 줌(준비 전 "라운드 N", 준비 후 "라운드 N · 토론 중"과 버튼 "토론 중", 희생자 "사망"). 도입부 문구는 뺌. 5번 포함, 1번 빼고 한꺼번에 이슈 올리고 진행

## 사용한 skill
- `worklog`: 이 기록
- 서브에이전트, MCP: 없음
- 로컬 확인용으로 Chrome 원격 디버깅(CDP)을 Node 스크립트로 직접 움직임 (스크립트는 임시 폴더, 레포에 넣지 않음)

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과 (경고 0)
- `npm test` → 14 파일, 153개 통과 (새 `phase-label` 4개 포함)
- 로컬 창 4개(390 폭)로 한 판
  - R1: 준비 전 "라운드 1", 준비 후 "라운드 1 · 토론 중" + 버튼 "토론 중 1/4"
  - R2: 참가자 3명 "라운드 2", 희생자 "사망". 단서 줄바꿈 어절 단위
  - R2 → R3 프레임: 상단 바는 그대로, 본문과 영상이 같이 나타남
  - 방 코드: PC Chrome 실제 클릭으로 복사됨, `navigator.clipboard` 를 일부러 실패시켜도 예전 방식으로 복사됨
  - 홈으로 → 홈 화면 (로컬 개발 서버): 참가자 624ms → 215ms, 방장 237ms → 181ms
- 폰 실기기, iOS Safari, 배포 주소(Vercel)에서는 안 돌림

## 남은 일
- QA 1번(상단 사건 제목 빼기): PRD §13, spec §2 와 다름. PO 확인과 Hatch PRD 수정 뒤 따로
- QA 2번: PC에서 안 되던 조건을 로컬에서 그대로 재현하지 못함 (정상 PC Chrome 에서는 복사됨). QA에게 브라우저와 주소(http IP인지, 개발자 도구 기기 모드였는지)를 다시 확인
- 단서 여러 곳이 아직 "TODO(시나리오 담당)": 시나리오 데이터 담당에게
- 방장 창에서 라운드 영상이 처음 한 번 안 뜬 일이 있음(새로 고치면 뜸). 소리 켠 재생이 막힌 뒤 음소거 재생도 실패한 것으로 보임. 이번 변경과는 별개, 실기기에서 다시 볼 것
- R1 그래픽 영역이 비어 있음(R1 영상 없음): 아트 담당이 정할 일

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-28). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 86 · 출력 34.7k · 캐시 쓰기 64.5k · 캐시 읽기 8.0M |
| 메시지 | 43 (메인 43, 서브에이전트 0) |
| 모델 | claude-opus-5-5 43 |
| 사용률 | 5시간 0% → 3% · 주간 68% → 69% |
| 많이 쓴 도구 | Bash 34, Edit 17, Read 12, Write 3, Skill 1 |
| skill | worklog 1 |
| 에이전트 | 없음 |

<!-- usage {"branch":"roohyeon/fix-136-qa-screens","issue":136,"sessions":1,"messages":43,"first":"2026-11-28","last":"2026-11-28","tokens":{"input":86,"output":34677,"cacheWrite":64458,"cacheRead":7977578},"costUSD":null,"where":{"main":{"messages":43,"output":34677},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":43,"output":34677}},"tools":{"Bash":34,"Read":12,"Write":3,"Edit":17,"Skill":1},"skills":{"worklog":1},"agents":{},"rate":{"five_hour":{"from":0,"to":3},"seven_day":{"from":68,"to":69}}} -->

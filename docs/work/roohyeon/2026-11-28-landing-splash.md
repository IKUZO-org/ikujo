# 랜딩: 앱을 켤 때마다 LAST ONE 로고 2초

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-28 |
| 사람 | @roohyeon |
| 브랜치 | roohyeon/feat-146-landing-splash |
| 이슈 | #146 |
| 문서 번호 | S-01, S-02, FR-002, PRD §13 흐름, ART.md §12 LAST ONE 로고 |

## 할 일
앱을 켜면 바로 방 코드 화면(S-02 홈)이 나와 어떤 서비스인지 느낄 틈이 없다는 QA. 켤 때마다 LAST ONE 로고만 2초 보여 주고 홈으로 넘어간다. **docs(PRD, spec)에 없는 화면을 요청에 따라 더한다** (PO, 디자인 담당 확인 필요).

## 한 일
- 확인: 온보딩(S-01)은 그 브라우저에서 처음 한 번만 나오고(localStorage `last-one:onboarded`), 한 번 넘기면 설정의 "온보딩 다시 보기"로만 다시 나온다. 그래서 두 번째부터는 켜자마자 방 코드 화면이었다
- `src/components/splash.tsx` 새로: 검정 바탕 가운데 로고(`public/logo-last-one.svg`, 폭 min(260px, 70%))를 2초 보여 주고 240ms(`--duration-base`) 동안 사라진다. 로고를 못 불러오면 글자 "LAST ONE"
  - 이 페이지를 연 동안 한 번만(모듈 변수): 새로 고치거나 다시 켜면 다시 뜨고, 앱 안에서 홈으로 돌아올 때는 안 뜬다
  - 움직임 줄이기면 서서히 사라지지 않고 바로 닫힌다. 꾸밈이라 화면 읽기 프로그램에는 숨김(`aria-hidden`)
  - 개발 모드에서 effect 를 두 번 돌릴 때 로고가 안 사라지던 것을 처음 그릴 때 상태로 정해 고침
- `home-view.tsx`: 온보딩 위에 `Splash` 를 덮는다. 흐름은 "로고 2초 → (처음 연 사람은 온보딩) → 홈"
- 방 링크(/room/…, /nickname?code=…)로 바로 들어오면 홈을 거치지 않아 뜨지 않는다

## 프롬프트 요약
1. 커밋하고 PR (#145 → PR #147)
2. 랜딩(#146) 진행: 앱을 켤 때마다 로고 2초 (앞선 답: 로고만, 켤 때마다 2초)

## 사용한 skill
- `worklog`: 이 기록 (같은 세션에서 #136 기록 때 불러 둔 형식대로)
- 서브에이전트, MCP: 없음
- 로컬 확인용으로 Chrome 원격 디버깅(CDP)을 Node 스크립트로 움직임 (임시 폴더, 레포에 넣지 않음)

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 16 파일, 160개 통과 (이 브랜치에서 더한 테스트 없음. 타이머와 화면이라 손으로 확인)
- 로컬 창(390 폭), 홈을 새로 열고 0.7 / 1.8 / 2.6 / 3.2초에 읽음
  - 온보딩을 본 사람: 로고 → 1.8초까지 로고, 2.6초에 사라지고 홈
  - 처음 연 사람(저장소 비움): 로고 → 2.6초에 사라지고 온보딩
  - 앱 안에서 "방 만들기"로 갔다가 뒤로 홈: 로고 없음
- 폰 실기기, iOS Safari, 배포 주소에서는 안 돌림. 움직임 줄이기는 손으로 안 돌림

## 남은 일
- docs 에 없는 화면: PO 확인, Hatch PRD §13 흐름(온보딩 → 홈)에 반영할지
- 디자인 담당 확인: 로고 크기(min 260px, 70%), 2초, 사라지는 방식
- 이 브랜치를 만든 뒤 develop 에 #140, #144 가 머지됨. 내 PR #142 는 #144 와 `GameVideo.tsx` 가 충돌해 develop 을 합쳐 풀어야 함

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-28). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 12 · 출력 7.6k · 캐시 쓰기 11.6k · 캐시 읽기 2.5M |
| 메시지 | 6 (메인 6, 서브에이전트 0) |
| 모델 | claude-opus-5-5 6 |
| 사용률 | 5시간 0% → 2% · 주간 68% → 70% |
| 많이 쓴 도구 | Bash 6, Edit 4, Read 2, Write 1 |
| skill | 없음 |
| 에이전트 | 없음 |

<!-- usage {"branch":"roohyeon/feat-146-landing-splash","issue":146,"sessions":1,"messages":6,"first":"2026-11-28","last":"2026-11-28","tokens":{"input":12,"output":7552,"cacheWrite":11584,"cacheRead":2541227},"costUSD":null,"where":{"main":{"messages":6,"output":7552},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":6,"output":7552}},"tools":{"Bash":6,"Write":1,"Edit":4,"Read":2},"skills":{},"agents":{},"rate":{"five_hour":{"from":0,"to":2},"seven_day":{"from":68,"to":70}}} -->

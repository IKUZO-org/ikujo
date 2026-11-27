# 끝난 영상은 마지막 장면에 멈춰 두기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @roohyeon |
| 브랜치 | roohyeon/feat-127-video-last-frame |
| 이슈 | #127 |
| 문서 번호 | FR-081, PRD §24, DESIGN.md §3, docs/video/RULES.md §3, #125 리뷰 |

## 할 일
영상이 끝나면 그래픽 영역이 검게 비던 것을 마지막 장면이 남게 한다 (#125 리뷰에서 약속).

## 한 일
- `src/components/GameVideo.tsx`
  - 상태에 `ended`(이번에 끝까지 봄)를 더해, 끝난 영상을 치우지 않고 그대로 둔다. 브라우저가 마지막 장면을 보여 준다
  - 이미 본 영상(`seen`, 새로 고침이나 탭 바꾸기 뒤)은 틀지 않고 `loadedmetadata` 때 끝에서 0.05초 앞으로만 옮겨 마지막 장면을 보여 준다. 재생하지 않으니 소리가 안 난다
  - 재생 시각 알림(`onTime`, #125)은 재생 중일 때만 보낸다. 마지막 장면으로 옮길 때 알리면 V-07 의 RV-02 처럼 시각에 맞춘 소리가 또 난다
  - 이미 본 영상의 마지막 장면을 못 불러오면 `onEnded("skipped")` 를 부르지 않는다. 부르면 OP-05, RV-01/02 가 또 난다
  - iOS 처럼 틀기 전에는 장면을 그리지 않는 브라우저에서는 이미 본 영상이 검정으로 남는다 (전과 같음)

## 프롬프트 요약
1. develop 을 pull 해 #125 머지를 확인하고, #125 리뷰에서 약속한 "끝난 영상 마지막 장면 남기기" 이슈를 만들어 진행

## 사용한 skill
- worklog: 이 기록
- 에이전트, MCP: 없음

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 145개 통과
- 로컬 Supabase(011 적용, 로컬만) + `next dev` + 화면 없는 Chrome 4명
  - V-01 이 끝난 뒤 같은 화면: 영상 요소가 남고 `currentTime 39.33 / 39.33, ended, paused`
  - 방장 창 새로 고침 뒤: 영상 요소가 남고 `currentTime 39.28, paused` (틀지 않음). 그 뒤 방장 폰에서 난 소리는 OP-02(오프닝 BGM)뿐, OP-08 이나 OP-05 는 다시 안 남
- 영상마다 마지막 장면(ffmpeg 로 뽑음): V-03(절벽, 녹화 표시), V-06(시상대), V-07(컬러 막대)은 잘 보이고, V-02 는 어둡게, V-01, V-09 는 영상 자체가 검게 끝난다
- 못 본 것: 해설 카드(V-06, V-07, V-09)와 라운드(V-02, V-03) 화면에서 직접, 아이폰 실기기

## 남은 일
- 없음

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-27). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 16 · 출력 7.9k · 캐시 쓰기 15.1k · 캐시 읽기 3.9M |
| 메시지 | 8 (메인 8, 서브에이전트 0) |
| 모델 | claude-opus-5-5 8 |
| 사용률 | 5시간 0% → 24% · 주간 47% → 59% |
| 많이 쓴 도구 | Bash 5, Read 4 |
| skill | 없음 |
| 에이전트 | 없음 |

<!-- usage {"branch":"roohyeon/feat-127-video-last-frame","issue":127,"sessions":1,"messages":8,"first":"2026-11-27","last":"2026-11-27","tokens":{"input":16,"output":7915,"cacheWrite":15064,"cacheRead":3897864},"costUSD":null,"where":{"main":{"messages":8,"output":7915},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":8,"output":7915}},"tools":{"Read":4,"Bash":5},"skills":{},"agents":{},"rate":{"five_hour":{"from":0,"to":24},"seven_day":{"from":47,"to":59}}} -->

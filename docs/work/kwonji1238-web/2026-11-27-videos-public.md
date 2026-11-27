# 영상 파일을 public/videos/<소문자 ID>.mp4 로 옮기기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @kwonji1238-web |
| 브랜치 | kwonji1238-web/chore-85-videos-public |
| 이슈 | #85 |
| 문서 번호 | FR-081, PRD §24 / docs/video/PLAN.md VQ-3 / docs/video/RULES.md R-02, §3 / docs/sound.md 3번 / #80 |

## 할 일
정연, 현경과 정한 영상 파일 위치(`public/videos/<소문자 ID>.mp4`, 480p, 파일이 없으면 앱이 건너뜀)대로 지금 있는 영상 8개를 옮기고, 영상 문서의 링크와 규칙을 맞춘다. 문서 파일 자리(RULES, PLAN, CHECKLIST, 콘티)는 그대로 둔다.

## 한 일
- 영상 8개를 `git mv` 로 옮기고 이름을 소문자 ID로 바꿨다: `docs/video/storyboards/V-01_opening_v2.mp4` → `public/videos/v-01.mp4`, 같은 방식으로 `v-02`, `v-03`, `v-04`, `v-05`, `v-06`, `v-07`, `v-09`. 파일 내용은 그대로다 (480×854, 가장 큰 것 5.9MB)
- 콘티 8개(`docs/video/storyboards/V-01.md` ~ `V-09.md`): 영상 링크를 `../../../public/videos/v-xx.mp4` 로 고치고, "검토용으로 이 폴더에 올렸다 (RULES §3 예외)" 같은 문구를 "`public/videos/` 에 있다"로 바꿨다
- `docs/video/RULES.md` §3: 제목의 "파일 위치는 개발 담당과 합의 전"을 "정연, 현경과 정함"으로, 파일 행에 480p(480×854), 파일명 행을 `<ID 소문자>.mp4` 로, 위치 행을 `public/videos/<ID 소문자>.mp4` 와 "파일이 없으면 조용히 건너뛴다 (PRD §24, sound.md 3번과 같은 방식)"로 고쳤다. 범인별 변형은 `public/` 에 두지 않는다는 줄을 파일명 행과 R-02에 더했다 (주소만 알면 누구나 받을 수 있어 파일명의 인물 ID로 범인이 드러남, #80)
- `docs/video/PLAN.md` VQ-3: 파일 위치를 정연, 현경과 정한 내용으로 확정했다
- `docs/video/CHECKLIST.md` A-2: 파일 위치 정하기를 끝난 것으로 체크했다

## 프롬프트 요약
1. 영상을 `public/videos/<ID>.mp4` 로 옮기려면 어떤 순서로 할지 물음 → 지금 PR을 먼저 올리고, 머지 뒤 새 이슈로 옮기는 순서를 안내
2. 정연, 현경과 그 경로로 정했고 이름은 소문자 ID, 파일이 없으면 앱이 건너뛰기, 화질은 480p라고 알려 줌
3. PR #84 머지를 알려 줌 → 머지 확인, 다음 이슈 초안(영상 이동과 docs/video.md 합치기)을 보여 줌
4. 이미 링크된 곳이 많으니 docs/video.md 는 만들지 말고 기존 문서는 그대로 두고 영상만 옮기라고 함 → 이슈 #85, 브랜치, 영상 이동, 링크와 규칙 정리
5. 작업 기록을 쓰고 PR을 올리라고 함 → 이 기록

## 사용한 skill
- `worklog` skill: 이 기록
- GitHub CLI(`gh`): 이슈 #85 만들기, 중복 이슈 확인
- 로컬 도구: `git mv`, `ffprobe`(크기와 해상도), 파이썬(문서 링크 고치기와 링크 검사)
- MCP, 서브에이전트: 없음. Higgsfield 크레딧은 쓰지 않았다

## 확인
- `public/videos/` 의 mp4 8개를 `ffprobe` 로 확인 → 모두 480×854, 길이 2.0~39.3초, 가장 큰 것 5.9MB (10MB 이하)
- `docs/video/storyboards/` 에 mp4 → 없음
- 레포의 md 64개, 상대 링크 150개 검사 → 끊어진 것 0
- 옛 파일 이름 검색 (지난 작업 기록 제외) → V-01 콘티의 로컬 합본 이름(`V-01_opening_v1.mp4`, 레포에 없는 파일)만 남음
- `npm run typecheck`, `npm run lint`, `npm test` → 실행되지 않음 (이 폴더에 node_modules가 없음). 코드 변경은 없고 파일 이동과 문서뿐

## 남은 일
- 앱에서 영상을 트는 자리와 "파일이 없으면 건너뛰기"는 개발(정연, 현경)이 만든다. mp4 요청이 세션 확인(proxy)을 거치지 않게 하는 일은 #80
- 지난 날짜 작업 기록(`docs/work/kwonji1238-web/2026-11-26-*.md`)에는 옛 파일 이름이 글로 남아 있다. 그때의 기록이라 고치지 않았다 (링크가 아니라 끊어지는 곳은 없음)
- 다음 영상을 올릴 때는 `public/videos/<소문자 ID>.mp4` 로 바로 넣는다
- 사용량 0은 `scripts/usage/lib.mjs` 의 Windows 경로 비교 문제 때문이다 (#43 작업 기록 참고)

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-27). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

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

<!-- usage {"branch":"kwonji1238-web/chore-85-videos-public","issue":85,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

# 홈 화면 키 비주얼과 로고 넣기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @eosangkyung-jpg |
| 브랜치 | eosangkyung-jpg/feat-126-home-key-visual |
| 이슈 | #126 |
| 문서 번호 | S-02, FR-010, FR-011, FR-081, PRD §24, DESIGN.md §3, §8, ART.md §5, §8, §10, §11, §13 |

## 할 일
글자 제목만 있던 홈(S-02)에 키 비주얼 그림과 로고 A-1을 넣는다 (PO 확인 받음).

## 한 일
- `public/images/key-visual-home.webp`: 상경이 고른 "폭풍 구름 아래 섬의 노을"(1024×1536 PNG, 레포 밖)을 1170×1755 WebP(품질 82, 75KB)로 바꿈 (ART.md §11 크기, 이름 규칙)
- `src/app/home-view.tsx`
  - 위쪽에 그래픽 영역을 둠: 남는 높이를 다 쓰고 화면 양옆까지 채움, 그림은 `next/image` `fill` + `object-cover` 로 가운데 기준 위아래만 잘림
  - 글자 제목 `<h1>LAST ONE</h1>` 을 로고 SVG(`alt="LAST ONE"`)로 바꿔 그림 위 빈 하늘에 얹음. 폭 300px(390 기준), 좁은 폰은 영역 폭 77%, 낮은 폰은 영역 높이 34% 안으로 줄어 해와 섬을 덮지 않음 (`object-contain object-top` 으로 비율 유지)
  - 그림이나 로고를 못 불러오면(`onError`) 깨진 그림 대신 검정 바탕 그대로, 로고 자리는 글자 "LAST ONE" (DESIGN.md §3, PRD §24)
  - 처음 쓴 `cqh`(컨테이너 높이 단위) 방식은 이 레이아웃에서 0으로 계산돼 로고가 사라져서 높이 비율 방식으로 바꿈
- `docs/art/key-visual.md`: 프롬프트(ART.md §8 공통 블록 + 장면), 화면에 넣는 방법, §13 확인, 생성 기록
- 화면 캡처: [390×844](2026-11-27-home-key-visual/s02-home-390x844.png), [360×640](2026-11-27-home-key-visual/s02-home-360x640.png), [430×932](2026-11-27-home-key-visual/s02-home-430x932.png), [그림 실패](2026-11-27-home-key-visual/s02-home-fail.png)
- 새 패키지 없음 (`next/image`, 변환은 레포에 있는 `sharp`)

## 프롬프트 요약
1. 홈 화면에 이미지가 필요 없는지 develop을 보고 의견을 달라고 함 → 로고 붙이기와 키 비주얼 두 단계 제안
2. 키 비주얼 시안 3개(방송 예고, 편집실, 용의자 라인업)를 설명해 달라고 함 → 시안 1(방송 예고)을 골라 서비스 규칙에 맞는 프롬프트를 요청
3. 청록, 버건디, 앰버도 쓰고 싶다고 함 → 6색 프롬프트로 고침
4. 직접 뽑은 "폭풍 구름 아래 섬의 노을"로 해 보자고 함 → 색 비중을 재고 홈 목업(로고만, 테두리 포함) 비교
5. 로고만 있는 버전으로 슬랙 질문 문구 요청 → 로고를 더 크게 → 230/300/350 비교 → 한 페이지로 볼 수 있게 요청 → 300으로 정함
6. PO가 확인했으니 이슈를 만들자고 함 → #126, 이어서 작업하자고 함

## 사용한 skill
- `worklog`: 이 기록 (형식)
- Artifact: 목업 비교 페이지 (https://claude.ai/artifact/XcwCLdbCr7s8R6XEn51ZGK, 비공개)
- GitHub CLI(`gh`): 이슈 #126
- 로컬 도구: Node `sharp`(WebP 변환, 목업, 색 비중), Python Playwright(390×844, 360×640, 430×932 캡처, 그림 실패 확인), Next.js 개발 서버
- 서브에이전트, MCP: 없음

## 확인
- 개발 서버(`next dev`, Supabase 값은 가짜 자리값으로 띄움. `.env` 파일은 읽지 않음) + Playwright
  - 390×844, 360×640, 430×932 → 모두 200, 그림과 로고 불러옴, 가로 스크롤 없음(scrollWidth = 화면 폭), 세로도 한 화면
  - 로고 상자(폭×높이, 영역 높이): 390 → 300×178 (523), 360 → 227×108 (319), 430 → 300×208 (611). 로고 그림은 `object-contain` 으로 비율 유지
  - 그림과 로고 요청을 막았을 때 → 깨진 그림 표시 없이 검정 바탕, 로고 자리에 "LAST ONE" 글자, 코드 입력과 "들어가기", "방 만들기" 정상
- 원본 그림 색 비중 → `docs/art/key-visual.md` 3번
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 통과 (13개 파일, 144개 테스트)
- 실제 폰, 화면 읽기 프로그램 → 안 해 봄 (로고 `alt="LAST ONE"` 은 Playwright에서 heading 이름으로 확인)

## 남은 일
- Vercel 미리보기에서 실제 폰으로 한 번 보기
- 키 비주얼 원본 PNG는 레포 밖(바탕화면 `1차 이미지`)에 있음
- 홈 "방 코드" 글이 왼쪽 정렬인 것은 이 PR 전부터 그대로 (DESIGN.md §8 "글은 가운데 정렬"과 다름)

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-27). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 58 · 출력 24.5k · 캐시 쓰기 57.8k · 캐시 읽기 9.2M |
| 메시지 | 29 (메인 29, 서브에이전트 0) |
| 모델 | claude-opus-5-5 29 |
| 사용률 | 5시간 8% → 14% · 주간 12% → 13% |
| 많이 쓴 도구 | Bash 25, Edit 9, Read 8, Write 2, TaskStop 1 |
| skill | 없음 |
| 에이전트 | 없음 |

<!-- usage {"branch":"eosangkyung-jpg/feat-126-home-key-visual","issue":126,"sessions":1,"messages":29,"first":"2026-11-27","last":"2026-11-27","tokens":{"input":58,"output":24459,"cacheWrite":57789,"cacheRead":9239354},"costUSD":null,"where":{"main":{"messages":29,"output":24459},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":29,"output":24459}},"tools":{"Bash":25,"Read":8,"Edit":9,"Write":2,"TaskStop":1},"skills":{},"agents":{},"rate":{"five_hour":{"from":8,"to":14},"seven_day":{"from":12,"to":13}}} -->

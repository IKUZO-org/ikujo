# 고른 소리 파일 넣기와 라이선스 기록

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @JJongW |
| 브랜치 | jjongw/feat-sound-files |
| 이슈 | #54 |
| 문서 번호 | FR-080, FR-081, NFR-006, NFR-007 |

## 할 일
소리 큐 시트에서 고른 소리를 `public/sounds/`에 넣고 출처와 라이선스를 적는다.

## 한 일
- Freesound CC0 소리 18개를 미리듣기 mp3로 받아 `public/sounds/<ID 소문자>.mp3` 17개로 넣음 (GH-04는 2개를 겹쳐 1개)
- 크기 맞춤: 효과음 -16 LUFS 128kbps, BGM -22 LUFS 80kbps. BGM도 모두 1MB 이하 (파일 규칙)
- `docs/sound.md`: OP-02를 징글에서 BGM 루프로, 게임 진행 BGM(BG-01, BG-02) `제안` 추가, 4번 표에 출처, 라이선스
- 예비 파일: `r3-01-alt.mp3`, `vt-01-alt.mp3`

## 프롬프트 요약
1. Freesound에서 P0 소리 후보 찾기 (Freesound 검색 MCP)
2. 들어 보고 큐마다 고름. 오프닝은 미스터리 BGM으로, 알림은 차분하게, 단서는 속삭임으로 다시 찾기
3. 고른 것 넣고 라이선스 기록, 같은 묶음 1, 2번은 게임 진행 BGM으로

## 사용한 skill
- Freesound 검색 MCP(로컬, `~/.config/freesound-mcp`): 후보 찾기와 미리듣기 받기
- ffmpeg: 소리 크기 맞추기, GH-04 두 소리 겹치기
- 이 작업은 ikujo 폴더 밖(다른 레포 세션)에서 해서 아래 사용량이 0으로 나온다

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 9 파일, 111 테스트 통과
- 폰 재생은 안 해 봄 (소리 자리 구현 M3 뒤에)

## 남은 일
- OP-03, OP-08 내레이션 TTS (OQ-011)
- BG-01, BG-02를 어느 라운드에 쓸지 개발과 정하기
- P1, P2 소리 찾기

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

<!-- usage {"branch":"jjongw/feat-sound-files","issue":null,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

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

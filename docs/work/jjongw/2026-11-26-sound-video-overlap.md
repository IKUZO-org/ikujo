# 오프닝 영상 V-01과 겹치는 소리 정리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @JJongW |
| 브랜치 | jjongw/docs-sound-video-overlap |
| 이슈 | #59 |
| 문서 번호 | FR-080, FR-081, OQ-011 |

## 할 일
V-01에 영상 소리(드론, 파도, 바람, 스위치)가 들어와서, 소리 큐 시트의 오프닝 큐와 겹치는 자리를 정한다.

## 한 일
- `docs/sound.md` 1.1 추가: OP-05는 영상 안 소리를 쓰고 앱은 내지 않음, OP-06은 영상 동안 빼기, OP-07은 뺌, OP-02는 V-01과 OP-08 스팅 뒤부터 캐릭터 카드까지
- 내레이션은 TTS 없이 자막과 글로: OP-03 뺌, OP-08은 스팅만, R2-03과 R2-04도 글로. 2번에 정한 것과 날짜를 적음
- P0 14개 → 13개, 4번 "아직 없는 P0" 줄과 5번 OQ-011 줄 고침

## 프롬프트 요약
1. 추가 효과음이 필요한지 확인 → 새 P0 없음, 대신 V-01과 겹치는 큐 5곳
2. 하나씩 들어 보고 정함 (OP-05는 앱 소리와 영상 소리를 비교해 들음)

## 사용한 skill
- 없음. V-01 영상 소리는 ffmpeg로 뽑아 들었다
- 이 작업은 ikujo 폴더 밖(다른 레포 세션)에서 해서 아래 사용량이 0으로 나온다

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 115 테스트 통과
- 폰 재생은 안 해 봄 (소리 자리 구현 M3 뒤에)

## 남은 일
- Hatch PRD에서 OQ-011 닫기 (PO)
- video/PLAN.md 영상별 소리 표의 V-01 줄은 지영 담당이라 고치지 않음. 알리기
- BG-01, BG-02를 어느 라운드에 쓸지 개발과 정하기, P1과 P2 소리 찾기

## 사용량
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

<!-- usage {"branch":"jjongw/docs-sound-video-overlap","issue":null,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

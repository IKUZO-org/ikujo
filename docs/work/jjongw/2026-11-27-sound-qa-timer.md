# QA: R3 BGM, 남은 1분과 10초 알림, 째깍 소리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @JJongW |
| 브랜치 | jjongw/feat-sound-qa-timer |
| 이슈 | #128 |
| 문서 번호 | FR-081, docs/sound.md BG-02, R3-02, RD-04, RD-06 |

## 할 일
11/27 QA(ikujo.vercel.app)에서 소리 담당 두 가지를 고친다.
- 12: R3 내내 R3-02 지지직 잡음만 깔려 R1, R2와 달리 BGM이 없게 들림
- 16: 남은 1분(타이머가 빨개질 때)에 진동과 알림음, 10초에 한 번 더. 시간이 얼마 안 남았을 때 째깍 소리

## 한 일
- R3 깔리는 소리를 R3-02 잡음에서 BG-02로 바꿈. 끝 3분은 그대로 BG-01. R3-02 파일은 남겨 둠
- 째깍 소리 RD-04를 남은 30초에서 1분으로 당김 (타이머가 빨개지는 때와 같게)
- 새 큐 RD-06: 남은 1분, 10초를 지나는 순간 진동(모든 폰, 진동 설정을 따름, 안드로이드만)과 알림음(OP-04 파일을 다시 씀, 방장 폰). 새로 고침 뒤 처음 읽은 시간에는 울리지 않음
- `src/lib/sound-cues.ts`: `TIME_ALERTS_MS`, `TIME_ALERT_SOUND`, `TIME_ALERT_VIBRATION`, `crossedAlert()`. `src/lib/use-room-sound.ts`에서 씀
- `docs/sound.md` BG-01, BG-02, R3-02, RD-04 줄 고치고 RD-06 줄 더함
- 테스트 5개 더함 (R3 BGM, crossedAlert)

## 프롬프트 요약
1. QA 17개 항목을 역할별로 정리 → 종원 몫 12, 16번
2. "응, 시작해" → 이슈 #128, 위처럼 고침

## 사용한 skill
없음 (작은 수정이라 바로 고침)
- 이 작업은 ikujo 폴더 밖(다른 레포 세션)에서 해서 아래 사용량이 0으로 나올 수 있다

## 확인
- `npm run typecheck`, `npm run lint` 통과, `npm test` 149개 통과
- 실제 폰에서 1분, 10초 진동과 소리는 아직 안 들어 봄 (배포 뒤 확인)

## 남은 일
- 아이폰은 진동이 없어(Vibration API 없음) 방장 폰 알림음과 빨간 타이머로만 알림
- R3에 더 맞는 BGM을 따로 고르고 싶으면 후보를 들어 보고 갈아 끼우기 (지금은 있던 BG-02)

## 사용량
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

<!-- usage {"branch":"jjongw/feat-sound-qa-timer","issue":null,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

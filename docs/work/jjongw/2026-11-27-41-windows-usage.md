# Windows에서 usage.mjs 사용량이 늘 0으로 나오는 버그 고치기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @JJongW |
| 브랜치 | jjongw/fix-41-windows-usage |
| 이슈 | #41 |
| 문서 번호 | 없음 (도구) |

## 할 일
Windows에서 `node scripts/usage.mjs --md` 가 늘 "세션 0개"로 나오는 것을 고친다.

## 한 일
- 원인: `scripts/usage/lib.mjs` 의 `inside` 가 기록의 `cwd`(`C:\...`, 역슬래시)와 `git worktree list` 의 경로(`C:/...`, 슬래시)를 문자열 그대로 비교해서 한 번도 같지 않았다
- `inside` 에서 비교 전에 두 경로를 맞춘다: 역슬래시 → 슬래시, 드라이브 글자 소문자
- `scripts/usage.mjs` 의 `~/.claude/projects/` 폴더 고르기도 대소문자를 맞춰 본다 (드라이브 글자 `C--` 와 `c--`)
- `tests/usage.test.ts` 에 Windows 경로 경우 1개 추가 (역슬래시, 소문자 드라이브, 이름이 비슷한 다른 폴더는 빼기)

## 프롬프트 요약
1. "다음 작업 ㄱㄱ" → 내 앞으로 열린 이슈가 #41 하나라 시작
2. 테스트를 먼저 써서 실패(0개)를 보고, 고친 뒤 통과(2개)를 봄

## 사용한 skill
- 없음
- 이 작업은 ikujo 폴더 밖(다른 레포 세션)에서 해서 아래 사용량이 0으로 나올 수 있다

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 134 테스트 통과
- 맥에서 기록이 있는 브랜치(`jjongw/feat-13-usage`)로 고치기 전후 결과가 같음 (세션 1개, 메시지 2개)
- Windows 실제 기기에서는 돌려 보지 않음. 이슈에 적힌 기록 형태로 테스트만 함

## 남은 일
- Windows 쓰는 조원이 머지 뒤 한 번 돌려 확인. 0으로 들어간 작업 기록(#32, #39)의 사용량 칸은 각자 다시 붙일 수 있다

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

<!-- usage {"branch":"jjongw/fix-41-windows-usage","issue":41,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

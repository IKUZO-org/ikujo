# proxy 가 소리, 영상 파일을 건너뛰게 함

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/fix-80-proxy-media |
| 이슈 | #80 |
| 문서 번호 | FR-003, NFR-002, VQ-3 |

## 할 일
`public/` 의 소리, 영상 파일 요청이 proxy 를 거쳐 세션 확인(`auth.getUser()`, 익명 로그인)을 하지 않게 한다.

## 한 일
- `src/proxy.ts`: matcher 제외 확장자에 `mp3|mp4|webm` 추가, 위 주석을 "정적 파일과 이미지, 소리, 영상은 건너뛴다"로 고침. 다른 코드는 그대로

## 프롬프트 요약
1. 이슈 #80 대로 proxy matcher 에서 mp3, mp4, webm 을 빼고 주석을 맞추기. 다른 코드는 바꾸지 않고, 테스트는 새로 만들지 않음. 로컬 Supabase 가 떠 있을 때만 curl 로 쿠키 확인, push 와 PR 은 하지 않음
2. 로컬 Supabase 를 띄워 curl 로 쿠키 확인하기

## 사용한 skill
- worklog: 이 작업 기록

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 11개 파일, 133개 테스트 통과
- 로컬 Supabase 에 붙여 `next dev` 후 `curl -sI`: `/sounds/rd-01.mp3` → 200, `Set-Cookie` 없음. `/` → 200, 세션 쿠키 `Set-Cookie` 있음

## 남은 일
- 이슈 #80 "남은 일": 해설 전에 받으면 안 되는 이미지, 영상이 `public/` 에 있는지 확인 (범인별 영상 파일 이름에 인물 ID)

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-27). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 20 · 출력 3.1k · 캐시 쓰기 19.7k · 캐시 읽기 773.4k |
| 메시지 | 9 (메인 9, 서브에이전트 0) |
| 모델 | claude-opus-5-5 9 |
| 사용률 | 5시간 2% → 2% · 주간 0% → 0% |
| 많이 쓴 도구 | Bash 7, Skill 1 |
| skill | worklog 1 |
| 에이전트 | 없음 |

<!-- usage {"branch":"uyeon0/fix-80-proxy-media","issue":80,"sessions":1,"messages":9,"first":"2026-11-27","last":"2026-11-27","tokens":{"input":20,"output":3124,"cacheWrite":19692,"cacheRead":773369},"costUSD":null,"where":{"main":{"messages":9,"output":3124},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":9,"output":3124}},"tools":{"Bash":7,"Skill":1},"skills":{"worklog":1},"agents":{},"rate":{"five_hour":{"from":2,"to":2},"seven_day":{"from":0,"to":0}}} -->

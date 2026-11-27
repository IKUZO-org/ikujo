# 쓰지 않는 profiles, completions 표 지우기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/chore-91-drop-profiles |
| 이슈 | #91 |
| 문서 번호 | D-018, FR-090, data.md 5판 §2, §7 |

## 할 일
로그인이 없어 쓰지 않는 `profiles`, `completions` 표를 새 마이그레이션 `010` 으로 지운다.

## 한 일
- `supabase/migrations/010_drop_profiles.sql` 추가: `completions` 를 먼저(`profiles` 를 참조), 그다음 `profiles` 를 `drop table if exists`. RLS 정책은 표와 함께 지워짐
- `001`~`009` 는 원격에 적용되어 고치지 않음
- `src`, `scripts`, `tests`, `supabase` 에서 두 표 이름을 찾음: `001`, `002` 정의 말고 남은 곳 없음

## 프롬프트 요약
1. 이슈 #91: 마이그레이션 010 으로 두 표를 지우고, 로컬 DB 에 010 만 올려 확인, 검사 실행. 작업 기록은 쓰되 커밋하지 않음

## 사용한 skill
- worklog: 이 기록 작성

## 확인
- 로컬 Supabase 에 `010` 만 psql 로 적용 → `DROP TABLE` 2번, `to_regclass('public.profiles')`, `to_regclass('public.completions')` 둘 다 null
- `npm run typecheck`, `npm run lint` → 통과
- `npm test` → 11 파일, 133 통과
- `npm run test:db` → 8 파일, 48 통과
- `supabase db reset` 은 안 돌림 (010 만 적용)

## 남은 일
- 머지 뒤 원격에 `010` 적용

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-27). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 12 · 출력 1.7k · 캐시 쓰기 17.9k · 캐시 읽기 413.5k |
| 메시지 | 5 (메인 5, 서브에이전트 0) |
| 모델 | claude-opus-5-5 5 |
| 사용률 | 5시간 2% → 2% · 주간 2% → 2% |
| 많이 쓴 도구 | Bash 5, Skill 1 |
| skill | worklog 1 |
| 에이전트 | 없음 |

<!-- usage {"branch":"uyeon0/chore-91-drop-profiles","issue":91,"sessions":1,"messages":5,"first":"2026-11-27","last":"2026-11-27","tokens":{"input":12,"output":1681,"cacheWrite":17860,"cacheRead":413507},"costUSD":null,"where":{"main":{"messages":5,"output":1681},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":5,"output":1681}},"tools":{"Bash":5,"Skill":1},"skills":{"worklog":1},"agents":{},"rate":{"five_hour":{"from":2,"to":2},"seven_day":{"from":2,"to":2}}} -->

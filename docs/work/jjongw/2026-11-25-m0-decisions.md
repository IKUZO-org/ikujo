# M0 결정 반영

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-25 |
| 사람 | @JJongW |
| 브랜치 | jjongw/docs-19-m0-decisions |
| 이슈 | #19 |
| 문서 번호 | PRD OQ-002, OQ-014 → D-018, D-019, D-020. FR-001, FR-090, FR-091 |

## 할 일
로드맵 M0의 "개발 시작 전" 결정을 PO가 정하고, 운영 Hatch 원본과 레포 사본에 반영한다.

## 한 일
- D-018 로그인 없음: 모두 닉네임 입장, 폰마다 익명 세션만. FR-001 `제외`, FR-090 완료 체크 `보류`, 설정에서 로그아웃과 탈퇴 뺌, S-04 화면 없앰
- D-019 끝난 방, 판, 배정, 투표 30일 뒤 삭제. 개발 프롬프트 11단계를 "온보딩, 설정, 보관 정리"로
- D-020 CAG 해석 확정 (OQ-014, A-004 확인됨)
- 데이터 구성: `profiles`, `completions` 표 `보류` (이미 만든 표라 지울지는 개발이 정함)
- 운영 Hatch 새 판 저장: PRD 4판, 기능명세 3판, 데이터 구성 3판, 개발 프롬프트 5판, 로드맵 2판 → 레포 `docs/` 사본 5개 갱신
- OQ-003 LLM 모델은 미정으로 남김

## 프롬프트 요약
1. M0 결정부터 하자
2. 로그인 없이 한다, 보관은 30일, LLM 모델은 아직, CAG는 이대로 확정
3. 저장하고 PR

## 사용한 skill
- claude-api (모델 가격 확인)

## 확인
- 사본 5개 = 운영 Hatch 최신 판 (`check` 모드: 모두 같음)
- `bash scripts/test-check-worklog.sh`, `gitleaks dir .` → 결과는 PR 설명에
- 코드 변경 없음

## 남은 일
- 정연: 마이그레이션의 `profiles`, `completions` 표를 지울지 결정. 손님 익명 사용자 7일 삭제(data §6)와 판 기록 30일 보관이 부딪히는지 11단계에서 확인
- OQ-003 LLM 모델과 판당 비용 (5단계 배정 전)
- 아래 사용량이 0인 것은 이번 작업 세션을 다른 폴더에서 열어서다 (이 레포 폴더에서 연 세션만 센다)


## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-25). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

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

<!-- usage {"branch":"jjongw/docs-19-m0-decisions","issue":19,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->

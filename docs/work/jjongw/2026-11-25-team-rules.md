# 협업 규칙, Claude 규칙, PR 검사 만들기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-25 |
| 사람 | @JJongW |
| 브랜치 | jjongw/chore-team-rules |
| 이슈 | #2 |
| 문서 번호 | 해당 없음 |

## 할 일
조원이 pull 받은 뒤 각자의 Claude Code가 같은 규칙(이슈, 브랜치, PR, 보안, 작업 기록)을 알아보고 지키게 하고, PR에서 작업 기록과 비밀 값을 자동으로 검사한다.

## 한 일
- `README.md`: 문서 목록, 처음 받으면, 일하는 순서, 관리자가 켤 브랜치 보호
- `CLAUDE.md`: 세션 시작(아이디 저장), 만드는 규칙, 깃 흐름, 작업 기록(반드시), 보안(반드시)
- `docs/rules.md`: 이슈, 브랜치, 커밋, PR, 머지, 작업 기록, 보안
- `docs/prd.md`, `spec.md`, `data.md`, `dev-prompt.md`: 팀 Hatch 원본 사본 (PRD 3판, 나머지 2판)
- `docs/work/`: 기록 규칙과 템플릿, `.claude/skills/worklog/SKILL.md`
- `.claude/settings.json`: `.env` 읽기, force push, main push, PR 머지를 Claude에게 막음
- `.github/`: PR 템플릿, 이슈 템플릿(할 일, 버그), `pr-check.yml`(worklog, secrets)
- `scripts/check-worklog.sh` + 테스트, `.gitleaks.toml`(기본 규칙 + Supabase `sb_secret_`), `.gitignore`

## 프롬프트 요약
1. Hatch 문서를 LAST ONE 이름으로 운영에 저장하고, PRD를 바탕으로 ikujo에서 작업할 수 있게 이슈, PR, 머지 규칙과 README, CLAUDE.md를 만들어 달라. 각자의 Claude가 규칙을 알아보고, 작업과 프롬프트, skill이 docs/에 남아 PR에 같이 올라오게. 보안을 가장 중요하게
2. 프롬프트 기록 방식은 "Claude 요약 기록"으로 (원문 자동 기록은 키가 섞일 위험 때문에 뺌)
3. 끝났다고 보는 기준을 어떻게 잴지 먼저 정하라 → 7가지 기준(Claude 인식, 기록 없는 PR 막힘, 키 막힘, .env 못 읽음, 사본 일치, 레포에 비밀 없음, 이 PR도 초록)으로 진행

## 사용한 skill
- `archify`: Hatch 팀 데이터 흐름 그림 (이 레포 밖)
- MCP: 없음. 깃허브는 공개 API 읽기만, 운영 Hatch는 문서 읽기 스크립트로 사본을 받음

## 확인
- `bash scripts/test-check-worklog.sh` → 5개 경우 모두 기대대로 (기록 있음 통과, 없음 실패, 남의 폴더 실패, 칸 빠짐 실패, 봇 통과)
- gitleaks 8.30.1(로컬)로 임시 레포 테스트 → 깨끗한 커밋 통과, 가짜 `sk_live_` 실패, 지운 뒤에도 기록에 남아 실패, 가짜 `sb_secret_` 실패, 가짜 service_role JWT 실패, URL만 통과
- 워크플로는 gitleaks 8.24.0을 받아 체크섬 확인 후 실행. 릴리스 파일 두 개 200 확인
- 사본 4개를 운영 Hatch 최신 판 본문과 비교 → 모두 같음
- `gitleaks dir .` → 레포 작업 폴더에 비밀 값 없음
- 새로 clone한 폴더에서 Claude 세션 테스트: 아래 "세션 2"

## 남은 일
- 관리자: 깃허브 Settings에서 `main` 브랜치 보호와 필수 검사(`worklog`, `secrets`) 켜기 (README 맨 아래)
- Hatch 상단에 ikujo 이슈와 PR 알림: 별도 설계 (webhook)

## 세션 2 (2026-11-25)

### 할 일
새로 clone한 사본에서 Claude가 규칙을 알아보는지 확인한다.

### 한 일
- `.claude/settings.json`: `.env.example` 은 읽을 수 있게, 비밀 파일(`.env`, `.env.local`, `.env.*.local`, `.env.production`, `.env.development`)만 막도록 좁힘

### 프롬프트 요약
1. 위 7가지 기준대로 진행

### 사용한 skill
- 없음 (`claude -p` 테스트 세션 안에서는 `worklog` skill이 쓰임)

### 확인
- 테스트 사본(아이디 `testmember`, main에서 시작)에 "README에 로컬 실행 칸 추가하고 커밋" → Claude가 `testmember/docs-readme-local-run` 브랜치를 만들고 `worklog` skill로 `docs/work/testmember/` 기록을 쓰고 같은 커밋에 넣음. 그 결과에 `check-worklog.sh` → 통과
- 같은 사본에 가짜 `.env.local` 을 두고 "내용 보여줘" → 거절, 출력에 가짜 값 0회

### 남은 일
- 없음 (위 "남은 일"과 같음)

## 세션 3 (2026-11-25)

### 할 일
작업은 반드시 이슈부터, `main`/`develop` 분리, 모바일 기준 개발 규칙을 넣는다.

### 한 일
- 레포: `develop` 브랜치를 만들어 기본 브랜치로 바꿈, PR #1 대상을 `develop` 으로, 이 작업 이슈 #2 생성
- `CLAUDE.md`, `docs/rules.md`, `README.md`: 이슈 먼저(없으면 템플릿 칸으로 초안 → 허락 → 생성), 브랜치 `<아이디>/<종류>-<이슈번호>-<주제>` 를 `develop` 에서, 작업 PR은 `develop` 으로 Squash, 출시 PR `develop` → `main` 은 PO만 Merge commit
- `CLAUDE.md`: 화면은 모바일 기준(390px, 360~430px, 데스크톱은 가운데 430px, 넓은 화면 분기 없음, 누르는 곳 44px)
- `docs/dev-prompt.md`: 같은 모바일 규칙을 공통 규칙에 넣어 운영 Hatch에 3판으로 저장하고 사본 갱신
- `pr-check.yml`: `issue`(Closes #N 이 열린 이슈), `release`(main 에는 develop 에서 온 PR만) 추가. 작업 PR은 issue, worklog, secrets / 출시 PR은 release, secrets
- `scripts/check-issue.sh`, PR 템플릿 안내, Claude 권한에 develop push 막기 추가

### 프롬프트 요약
1. PR 만들기 링크 대신 템플릿을 채운 PR을 직접 만들어 달라 → gh 사용 허락
2. 나만이 아니라 모두가 지킬 이슈, 머지, PR 템플릿이 있어야 한다
3. 어떤 작업이든 시작할 때 반드시 이슈를 만들고 한다
4. `main` 과 `develop` 으로 나눈다. `main` 은 실제 출시 때만, 개발자와 PO는 `develop` 으로만 머지
5. 모바일 화면이 메인이니 반응형이 아니라 모바일 기준으로 개발하게, 개발 프롬프트에 그대로 넣는다

### 사용한 skill
- 없음 (gh CLI로 이슈, PR, 브랜치, 기본 브랜치 설정)

### 확인
- `check-issue.sh` 실제 레포로 6가지 → 본문에 없음 실패, 없는 #999 실패, PR #1 실패, 열린 이슈 #2 통과, 소문자 fixes 통과, 봇 건너뜀 (없는 번호를 "닫힘"으로 잘못 말하던 버그를 고침)
- `test-check-worklog.sh` → 5개 모두 기대대로
- `pr-check.yml` YAML 문법 확인
- 사본 4개 = 운영 Hatch 최신 판 (dev-prompt 3판)

### 남은 일
- 관리자: `develop`, `main` 브랜치 보호와 머지 방식 설정 (docs/rules.md "레포 설정")

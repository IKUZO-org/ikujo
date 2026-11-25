# 협업 규칙 (CONTRIBUTING)

모든 사람(PO, 개발, 디자인)과 각자의 Claude Code가 똑같이 지킨다.

## 어떤 문서를 따르나, 누가 고치나
| 문서 | 언제 읽나 | 담당 (고칠 수 있는 사람) |
| --- | --- | --- |
| 이 파일 | 이슈, 브랜치, 커밋, PR, 머지, 작업 기록 (모든 일) | 신(PO) |
| [SECURITY.md](SECURITY.md) | 모든 일. 키, 환경 변수, 권한, 비밀 정보를 다룰 때는 반드시 | 정연 (Supabase, Vercel) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 서버, DB, 실시간, 폴더 구조를 만들거나 바꿀 때 | 정연, 현경 |
| [DESIGN.md](DESIGN.md) | 화면, 컴포넌트, 스타일을 만들거나 바꿀 때 | 상경 (UI) |
| [docs/prd.md](docs/prd.md), [spec.md](docs/spec.md), [data.md](docs/data.md), [dev-prompt.md](docs/dev-prompt.md) | 무엇을 만들지. 번호(FR, BR, AC, S-)의 근거 | 원본은 팀 Hatch. 여기는 사본이라 고치지 않는다 |

- **규칙 문서는 담당자가 직접 고친다.** 다른 일과 같이 이슈 → 브랜치 → PR로 올리고, PO가 PR에서 검토한다
- 담당이 아닌 사람이 고칠 게 보이면 이슈로 남기고 담당자를 Assignees에 넣는다
- 문서끼리 어긋나면 docs(PRD, 명세, 데이터)가 이긴다. 어긋난 곳은 이슈로 남긴다
- 담당은 처음 정한 것이다. 바꾸려면 PO에게 말한다

## 흐름 한눈에
```
이슈 만들기 → develop 에서 내 브랜치 → 작업 + 작업 기록 → PR (→ develop) → 검사 3개 초록 + 승인 1명 → Squash 머지
                                                                         ↓ (PO가 출시를 정할 때만)
                                                              출시 PR develop → main → Merge commit
```

## 브랜치
| 브랜치 | 무엇 | 누가 합치나 |
| --- | --- | --- |
| `develop` | 개발이 모이는 곳. **기본 브랜치**. 모든 작업 PR의 대상 | 리뷰 승인 후 PR 올린 사람이 Squash 머지 |
| `main` | 실제로 출시한 것만. 평소엔 건드리지 않는다 | PO가 출시 PR(`develop` → `main`)로만 |
| `<아이디>/<종류>-<이슈번호>-<주제>` | 내 작업. `develop` 에서 딴다 | 머지 뒤 자동 삭제 |

- 아이디는 깃허브 아이디 소문자, 종류는 `feat`, `fix`, `docs`, `chore`, `test`
- 예: `hyeon/feat-12-room-lobby`, `jeong/fix-30-vote-tie`
- `main`, `develop` 에 바로 커밋, push 하지 않는다 (보호되어 있어 막힌다). force push 금지

## 이슈 (작업은 반드시 이슈부터)
- 코드를 고치기 전에 이슈가 있어야 한다. 이슈가 연결되지 않은 PR은 검사 `issue` 가 막는다
- 템플릿 "할 일" 또는 "버그"로 만든다 (빈 이슈는 막혀 있다)
- 제목: `[T번호][단계 N] 한 줄`, `[T번호][버그] 한 줄`, `[T번호][세팅] 한 줄`, `[T번호][문서] 한 줄`
  - `[T번호]`는 팀 Hatch **과제 체크리스트** 번호다. Hatch가 제목 앞 `[T번호]`로 이 이슈와 이 이슈를 `Closes` 하는 PR을 그 항목에 붙인다. 번호가 없으면 PR 검사 `issue` 가 막는다
  - 가장 가까운 항목 하나를 고른다. 딱 맞는 게 없으면 개발 단계는 `T16`(배운 것을 내 파트에), 규칙 문서는 `T4`, 그래도 모르면 PO에게 묻는다
  - 항목이 바뀌면 Hatch 체크리스트가 원본이다. 아래 표는 2026-11-25 기준

  | T | 항목 | T | 항목 |
  | --- | --- | --- | --- |
  | 1 | 팀 신청 | 11 | 배포 주소에서 동작 |
  | 2 | 해결할 문제와 대상 한 줄 | 12 | 회고 |
  | 3 | PRD.md 쓰기 (PRD, 로드맵, 결정) | 13 | 구글 드라이브 업로드 |
  | 4 | CLAUDE.md 정리 (Claude 규칙, 규칙 문서) | 14 | 발표 5분 + 질의 리허설 |
  | 5 | db.md 설계 + RLS + 마이그레이션 | 15 | 내 파트를 한 줄로 정하기 (각자) |
  | 6 | 실제에 준하는 데이터 (시나리오) | 16 | 배운 것 하나 이상을 내 파트에 (각자) |
  | 7 | 지표 1개로 개선 전후 비교 | 17 | AI 활용 기록 남기기 (각자) |
  | 8 | 이상한 입력, 실패, 빈 화면, 민감정보 막기 | 18 | 내 작업을 PR로 올리고 리뷰 1명 (각자) |
  | 9 | 키는 .env, Secrets 에만 | 19 | 내 파트를 1분 안에 설명 (각자) |
  | 10 | README만 보고 실행 가능 | 20 | 개인 통과 조건 확인 (각자) |
- 본문: 관련 문서 번호(FR, BR, AC, S-), 할 일, **끝났다고 보는 기준**(돌려서 확인할 수 있는 것)
- 맡은 사람은 Assignees에 자기를 넣고 시작한다

## 커밋
- `<종류>: <한 줄 요약> (#이슈)` (예: `feat: 방 코드로 입장 (#12)`)
- `.env*`, 키, 개인정보는 커밋하지 않는다 ([SECURITY.md](SECURITY.md))

## PR
- 대상은 **`develop`**. 제목은 커밋 규칙과 같다
- 본문은 템플릿을 채운다. 첫 줄 `Closes #이슈번호` 는 필수
- 필수 검사 3개:
  - `issue`: 본문의 `Closes #N` 이 열린 이슈를 가리킨다
  - `worklog`: PR 올린 사람 폴더에 작업 기록이 있고 필수 칸이 있다
  - `secrets`: 이 PR 커밋에 비밀 값이 없다
- 리뷰: 다른 사람 1명 승인. 리뷰어는 문서 번호대로 동작하는지, [SECURITY.md](SECURITY.md) 체크, 화면이면 [DESIGN.md](DESIGN.md) 체크를 본다
- 리뷰 대화가 모두 해결돼야 머지된다

## 머지
- 작업 PR → `develop`: **Squash 머지**. 머지하면 이슈가 자동으로 닫히고 브랜치가 지워진다. 모두 `git switch develop && git pull`
- 출시 PR `develop` → `main`: PO만 만든다. 제목 `release: YYYY-MM-DD`, 본문에 이번에 들어간 PR 목록. 검사 `release` 가 `develop` 에서 온 PR인지 본다. **Merge commit** 으로 합친다 (Squash하면 두 브랜치 기록이 어긋난다)

## 작업 기록
- 위치: `docs/work/<깃허브아이디 소문자>/<YYYY-MM-DD>-<주제>.md`, PR마다 하나
- 형식: [docs/work/_template.md](docs/work/_template.md). Claude는 `worklog` skill로 쓴다
- 필수 칸: `## 할 일`, `## 프롬프트 요약`, `## 사용한 skill`, `## 확인`, `## 사용량`
- 프롬프트는 요약만. 키, 개인정보는 `[가림]`
- `## 사용량`은 `node scripts/usage.mjs --md` 결과를 그대로 붙인다 (손으로 고치지 않는다). 내 컴퓨터의 Claude Code 기록에서 **이 브랜치, 이 레포 폴더**로 쓴 것만 센다. 레포에 올라가는 것은 숫자와 이름(모델, 도구, skill, 에이전트)뿐이다
- 사용률 %는 이 레포의 상태줄(`scripts/claude-statusline.mjs`)이 켜진 뒤부터 남는다. 계정 전체 값이라 다른 작업도 섞인다
- 팀 합계 [docs/usage.md](docs/usage.md): PO가 `node scripts/usage-report.mjs --write` 로 만들어 PR로 올린다

## 레포 설정 (켜져 있음, 바꿀 때는 PO)
- 기본 브랜치 `develop`
- `develop` 보호: PR 필수, 승인 1, 필수 검사 `issue`, `worklog`, `secrets`, 관리자도 예외 없음, 대화 해결 필수
- `main` 보호: PR 필수, 승인 1, 필수 검사 `release`, `secrets`, 관리자도 예외 없음, 대화 해결 필수
- 머지 방식: Squash와 Merge commit, Rebase 끔. 머지 뒤 브랜치 자동 삭제

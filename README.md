# LAST ONE

친구 4~6명이 한자리에 모여 각자 폰으로 하는 즉흥 추리극 웹앱.
기술: Next.js App Router + TypeScript, Supabase(Auth, Postgres, Realtime), Vercel. 모바일 웹 우선.

## 문서
| 파일 | 내용 |
| --- | --- |
| [docs/prd.md](docs/prd.md) | PRD (무엇을, 왜) |
| [docs/spec.md](docs/spec.md) | 기능명세 (화면, 동작, 테스트) |
| [docs/data.md](docs/data.md) | 데이터 구성 (표, 권한, 실시간) |
| [docs/dev-prompt.md](docs/dev-prompt.md) | 단계별로 Claude에게 줄 말과 담당 |
| [docs/rules.md](docs/rules.md) | 이슈, 브랜치, PR, 머지, 보안 규칙 |
| [docs/work/](docs/work/README.md) | 각자의 작업 기록 (PR마다 하나) |

PRD 등 네 문서의 원본은 팀 Hatch다. 여기 있는 것은 사본이고 파일 첫 줄에 판 번호가 있다. 고칠 일이 있으면 Hatch에 댓글이나 메모로 남긴다.

## 처음 받으면
1. `git clone https://github.com/IKUZO-org/ikujo.git && cd ikujo`
2. 이 폴더에서 Claude Code를 연다. Claude가 [CLAUDE.md](CLAUDE.md)를 읽고 규칙대로 일한다
3. 첫 세션에 Claude가 깃허브 아이디를 묻고 `git config ikujo.login <아이디>`로 이 레포에만 저장한다
4. 비밀 값(.env)은 깃허브나 채팅이 아니라 직접 받아서 `.env.local`에 넣는다. 커밋되지 않는다

## 일하는 순서 (요약, 자세히는 [docs/rules.md](docs/rules.md))
1. 이슈 만들기 (템플릿 "할 일")
2. 브랜치 `<깃허브아이디>/<종류>-<주제>` (예: `hyeon/feat-room-lobby`)
3. 작업 → **작업 기록** `docs/work/<깃허브아이디>/`에 남기기 (Claude가 `worklog` skill로 쓴다)
4. typecheck, lint, test → push → PR (본문에 `Closes #이슈`)
5. PR 검사 두 개가 초록이어야 한다: 작업 기록 있음, 비밀 값 없음
6. 다른 사람 1명 리뷰 승인 → Squash 머지 (사람이 한다)

## 관리자가 깃허브 화면에서 한 번 켤 것
Settings → Branches → `main` 규칙 추가:
- Require a pull request before merging, Required approvals 1
- Require status checks to pass: `worklog`, `secrets`
- Do not allow bypassing the above settings

Settings → General → Pull Requests: "Allow squash merging"만 켜기.

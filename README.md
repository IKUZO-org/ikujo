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
| [CONTRIBUTING.md](CONTRIBUTING.md) | 이슈, 브랜치, PR, 머지, 작업 기록 규칙. 규칙 문서 담당자 |
| [SECURITY.md](SECURITY.md) | 키, 비밀 정보, 권한, 키가 샜을 때 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 서버, DB, 실시간, 폴더 구조 |
| [DESIGN.md](DESIGN.md) | 모바일 화면 틀, 공용/개인 화면, 토큰, 컴포넌트 |
| [docs/work/](docs/work/README.md) | 각자의 작업 기록 (PR마다 하나) |

규칙 문서 네 개(CONTRIBUTING, SECURITY, ARCHITECTURE, DESIGN)는 담당자가 PR로 고치고 PO가 검토한다.
PRD 등 네 문서의 원본은 팀 Hatch다. 여기 있는 것은 사본이고 파일 첫 줄에 판 번호가 있다. 고칠 일이 있으면 Hatch에 댓글이나 메모로 남긴다.

## 처음 받으면
1. `git clone https://github.com/IKUZO-org/ikujo.git && cd ikujo`
2. 이 폴더에서 Claude Code를 연다. Claude가 [CLAUDE.md](CLAUDE.md)를 읽고 규칙대로 일한다
3. 첫 세션에 Claude가 깃허브 아이디를 묻고 `git config ikujo.login <아이디>`로 이 레포에만 저장한다
4. 비밀 값(.env)은 깃허브나 채팅이 아니라 직접 받아서 `.env.local`에 넣는다. 커밋되지 않는다

## 브랜치
- `develop`: 개발이 모이는 곳 (기본 브랜치). **모든 작업 PR은 여기로**
- `main`: 실제 출시본. PO가 출시를 정할 때만 `develop` → `main` 출시 PR로 합친다

## 일하는 순서 (요약, 자세히는 [CONTRIBUTING.md](CONTRIBUTING.md))
1. **이슈 먼저** (템플릿 "할 일" 또는 "버그"). 이슈 없이 시작하지 않는다
2. `develop` 에서 브랜치 `<깃허브아이디>/<종류>-<이슈번호>-<주제>` (예: `hyeon/feat-12-room-lobby`)
3. 작업 → **작업 기록** `docs/work/<깃허브아이디>/`에 남기기 (Claude가 `worklog` skill로 쓴다)
4. typecheck, lint, test → push → PR을 `develop` 으로 (본문 첫 줄 `Closes #이슈`)
5. PR 검사 세 개가 초록이어야 한다: `issue`(이슈 연결), `worklog`(작업 기록), `secrets`(비밀 값 없음)
6. 다른 사람 1명 리뷰 승인 → Squash 머지 (사람이 한다)

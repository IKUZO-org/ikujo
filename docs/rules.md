# 협업 규칙

모든 사람(PO, 개발, 디자인)과 각자의 Claude Code가 똑같이 지킨다.

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
- `main`, `develop` 에 바로 커밋, push 하지 않는다. force push 금지

## 이슈 (작업은 반드시 이슈부터)
- 코드를 고치기 전에 이슈가 있어야 한다. 이슈가 연결되지 않은 PR은 검사 `issue` 가 막는다
- 템플릿 "할 일" 또는 "버그"로 만든다 (빈 이슈는 막혀 있다)
- 제목: `[단계 N] 한 줄`, `[버그] 한 줄`, `[세팅] 한 줄`
- 본문: 관련 문서 번호(FR, BR, AC, S-), 할 일, **끝났다고 보는 기준**(돌려서 확인할 수 있는 것)
- 맡은 사람은 Assignees에 자기를 넣고 시작한다

## 커밋
- `<종류>: <한 줄 요약> (#이슈)` (예: `feat: 방 코드로 입장 (#12)`)
- `.env*`, 키, 개인정보는 커밋하지 않는다

## PR
- 대상은 **`develop`**. 제목은 커밋 규칙과 같다
- 본문은 템플릿을 채운다. 첫 줄 `Closes #이슈번호` 는 필수
- 필수 검사 3개:
  - `issue`: 본문의 `Closes #N` 이 열린 이슈를 가리킨다
  - `worklog`: PR 올린 사람 폴더에 작업 기록이 있고 필수 칸이 있다
  - `secrets`: 이 PR 커밋에 비밀 값이 없다
- 리뷰: 다른 사람 1명 승인. 리뷰어는 문서 번호대로 동작하는지, 비밀이 클라이언트로 새지 않는지 본다

## 머지
- 작업 PR → `develop`: **Squash 머지**. 머지하면 이슈가 자동으로 닫히고 브랜치가 지워진다. 모두 `git switch develop && git pull`
- 출시 PR `develop` → `main`: PO만 만든다. 제목 `release: YYYY-MM-DD`, 본문에 이번에 들어간 PR 목록. 검사 `release` 가 `develop` 에서 온 PR인지 본다. **Merge commit** 으로 합친다 (Squash하면 두 브랜치 기록이 어긋난다)

## 작업 기록
- 위치: `docs/work/<깃허브아이디 소문자>/<YYYY-MM-DD>-<주제>.md`, PR마다 하나
- 형식: [work/_template.md](work/_template.md). Claude는 `worklog` skill로 쓴다
- 필수 칸: `## 할 일`, `## 프롬프트 요약`, `## 사용한 skill`, `## 확인`
- 프롬프트는 요약만. 키, 개인정보는 `[가림]`

## 보안
- 비밀 값은 `.env.local` 에만, 공유는 깃허브나 채팅이 아닌 곳으로 직접
- Vercel과 Supabase 연동을 써도 키는 비밀로 다룬다: `service_role` 은 서버에서만, `NEXT_PUBLIC_` 에는 URL과 publishable 키만
- 모든 표 RLS 켜기, 비밀 정보는 서버와 본인만
- 키가 커밋됐거나 채팅에 나왔으면: 바로 폐기하고 새로 발급, 팀에 알림. 기록을 지우는 것만으로는 안 된다 (공개 레포)

## 레포 설정 (관리자)
- 기본 브랜치 `develop`
- `develop` 보호: PR 필수, 승인 1, 필수 검사 `issue`, `worklog`, `secrets`, 관리자도 예외 없음
- `main` 보호: PR 필수, 승인 1, 필수 검사 `release`, `secrets`, 관리자도 예외 없음
- 머지 방식: Squash와 Merge commit 허용, Rebase 끔. 머지 뒤 브랜치 자동 삭제

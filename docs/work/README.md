# 작업 기록

PR마다 하나씩, 그 PR을 올린 사람 폴더에 남긴다. 나중에 누가 무엇을 어떤 요청과 도구로 만들었는지 PR과 같이 남는다.

- 위치: `docs/work/<깃허브아이디 소문자>/<YYYY-MM-DD>-<주제>.md`
- 형식: [_template.md](_template.md)
- 필수 칸: `## 할 일`, `## 프롬프트 요약`, `## 사용한 skill`, `## 확인`
- Claude Code는 커밋 전에 `worklog` skill로 쓴다 ([CLAUDE.md](../../CLAUDE.md) 4번)
- PR 검사 `worklog` 가 PR 작성자 폴더에 이 파일이 있는지, 필수 칸이 있는지 본다 ([scripts/check-worklog.sh](../../scripts/check-worklog.sh))

프롬프트는 원문이 아니라 요약이다. 붙여 넣은 키나 개인정보가 공개 레포에 그대로 올라가는 일을 막으려고 정했다.
갈아탈 신호: 요약이 너무 짧아 다시 만들 수 없다는 리뷰가 세 번 넘게 나오면, 원문 자동 기록(hook) + 키 가림을 다시 검토한다.

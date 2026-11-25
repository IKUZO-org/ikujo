#!/usr/bin/env bash
# PR 검사 issue: 작업은 이슈부터 (CONTRIBUTING.md "이슈"). PR 본문의 Closes #N 이 이 레포의 열린 이슈(PR 아님)이고
# 제목이 [T번호]로 시작하는지 본다 (팀 Hatch 체크리스트가 이 번호로 잇는다)
# 쓰는 법: PR_BODY, REPO, AUTHOR 환경 변수 + gh 로그인(Actions에서는 GH_TOKEN)
set -euo pipefail
case "${AUTHOR:-}" in *'[bot]') echo "봇 PR이라 건너뜀: $AUTHOR"; exit 0;; esac
nums=$(printf '%s' "${PR_BODY:-}" | grep -oiE '\b(close[sd]?|fix(e[sd])?|resolve[sd]?)[[:space:]]+#[0-9]+' | grep -oE '[0-9]+$' | sort -u || true)
if [ -z "$nums" ]; then
  echo "::error::PR 본문에 'Closes #이슈번호' 가 없어요. 이슈를 먼저 만들고 본문 첫 줄에 적어 주세요."
  exit 1
fi
ok=0
for n in $nums; do
  if ! info=$(gh api "repos/$REPO/issues/$n" --jq '[.state, (.pull_request != null), .title] | @tsv' 2>/dev/null); then info=missing; fi
  title=${info#*$'\t'*$'\t'}
  case "$info" in
    $'open\tfalse\t'*)
      if [[ "$title" =~ ^[[:space:]]*\[T[0-9]+\] ]]; then echo "이슈 확인: #$n $title"; ok=1
      else echo "::error::#$n 이슈 제목 앞에 [T번호]가 없어요. 과제 체크리스트 번호를 붙여 주세요 (예: [T16][단계 5] ..., 표는 CONTRIBUTING.md 이슈)."; fi ;;
    missing) echo "::error::#$n 이슈가 없어요." ;;
    *$'\ttrue\t'*) echo "::error::#$n 은 이슈가 아니라 PR이에요." ;;
    *) echo "::error::#$n 이슈가 닫혀 있어요." ;;
  esac
done
[ "$ok" = 1 ]

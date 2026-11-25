#!/usr/bin/env bash
# PR 검사 issue: 작업은 이슈부터 (CONTRIBUTING.md "이슈"). PR 본문의 Closes #N 이 이 레포의 열린 이슈(PR 아님)인지 본다
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
  if ! info=$(gh api "repos/$REPO/issues/$n" --jq '[.state, (.pull_request != null)] | @tsv' 2>/dev/null); then info=missing; fi
  case "$info" in
    $'open\tfalse') echo "이슈 확인: #$n"; ok=1 ;;
    missing) echo "::error::#$n 이슈가 없어요." ;;
    *$'\ttrue') echo "::error::#$n 은 이슈가 아니라 PR이에요." ;;
    *) echo "::error::#$n 이슈가 닫혀 있어요." ;;
  esac
done
[ "$ok" = 1 ]

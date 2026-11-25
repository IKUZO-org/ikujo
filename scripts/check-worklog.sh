#!/usr/bin/env bash
# PR 검사 worklog: PR 작성자의 작업 기록이 있고 필수 칸이 다 있는지 본다 (docs/rules.md "작업 기록")
# 쓰는 법: check-worklog.sh <base-sha> <head-sha> <작성자 깃허브 아이디>
set -euo pipefail
base="$1"; head="$2"; author="$(printf '%s' "$3" | tr '[:upper:]' '[:lower:]')"
case "$author" in *'[bot]') echo "봇 PR이라 건너뜀: $author"; exit 0;; esac

dir="docs/work/$author/"
files=$(git diff --name-only --diff-filter=AM "$base...$head" -- "$dir" | grep -E '\.md$' || true)
if [ -z "$files" ]; then
  echo "::error::작업 기록이 없어요. $dir<YYYY-MM-DD>-<주제>.md 를 이 PR에 넣어 주세요 (Claude Code: worklog skill)."
  exit 1
fi

fail=0
for f in $files; do
  for h in '## 할 일' '## 프롬프트 요약' '## 사용한 skill' '## 확인'; do
    if ! git show "$head:$f" | grep -qF "$h"; then
      echo "::error file=$f::필수 칸 '$h' 이 없어요 (docs/work/_template.md 참고)."
      fail=1
    fi
  done
done
[ "$fail" = 0 ] && echo "작업 기록 확인: $files"
exit "$fail"

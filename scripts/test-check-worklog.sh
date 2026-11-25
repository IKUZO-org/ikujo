#!/usr/bin/env bash
# check-worklog.sh 테스트: 임시 git 레포에서 경우마다 통과/실패를 본다
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
t=$(mktemp -d); trap 'rm -rf "$t"' EXIT
cd "$t" && git init -q && git config user.email t@t && git config user.name t
git commit -q --allow-empty -m base && base=$(git rev-parse HEAD)
full=$'## 할 일\nx\n## 프롬프트 요약\nx\n## 사용한 skill\nx\n## 확인\nx\n'
pass=0; fail=0
run() { # 이름, 기대(0/1), 작성자, 넣을 파일=내용...
  local name=$1 want=$2 who=$3; shift 3
  git checkout -q "$base" -B "case-$name"
  for kv in "$@"; do mkdir -p "$(dirname "${kv%%=*}")"; printf '%s' "${kv#*=}" > "${kv%%=*}"; done
  git add -A && git commit -q -m "$name"
  bash "$here/check-worklog.sh" "$base" HEAD "$who" >/dev/null 2>&1; got=$([ $? = 0 ] && echo 0 || echo 1)
  if [ "$got" = "$want" ]; then pass=$((pass+1)); echo "통과  $name"; else fail=$((fail+1)); echo "틀림  $name (기대 $want, 실제 $got)"; fi
}
run 기록있음 0 Hyeon "src/a.ts=x" "docs/work/hyeon/2026-11-25-room.md=$full"
run 기록없음 1 hyeon "src/a.ts=x"
run 남의폴더 1 hyeon "src/a.ts=x" "docs/work/jeong/2026-11-25-room.md=$full"
run 칸빠짐 1 hyeon "docs/work/hyeon/2026-11-25-room.md=## 할 일"
run 봇 0 "dependabot[bot]" "package.json={}"
echo "통과 $pass, 틀림 $fail"; [ "$fail" = 0 ]

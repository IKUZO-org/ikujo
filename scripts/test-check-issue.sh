#!/usr/bin/env bash
# check-issue.sh 테스트: 가짜 gh 로 이슈 상태와 제목을 바꿔 가며 통과/실패를 본다
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
t=$(mktemp -d); trap 'rm -rf "$t"' EXIT
# 가짜 gh: FAKE_<번호> 환경 변수의 "상태<탭>PR여부<탭>제목" 을 돌려준다. 없으면 실패(없는 이슈)
cat > "$t/gh" <<'EOF'
#!/usr/bin/env bash
n=${2##*/}; v="FAKE_$n"
[ -n "${!v:-}" ] || exit 1
printf '%s\n' "${!v}"
EOF
chmod +x "$t/gh"
pass=0; fail=0
run() { # 이름, 기대(0/1), PR 본문, FAKE_n=값...
  local name=$1 want=$2 body=$3; shift 3
  env PATH="$t:$PATH" REPO=o/r AUTHOR=hyeon PR_BODY="$body" "$@" bash "$here/check-issue.sh" >/dev/null 2>&1; got=$([ $? = 0 ] && echo 0 || echo 1)
  if [ "$got" = "$want" ]; then pass=$((pass+1)); echo "통과  $name"; else fail=$((fail+1)); echo "틀림  $name (기대 $want, 실제 $got)"; fi
}
T=$'\t'
run 번호있음 0 "Closes #5" "FAKE_5=open${T}false${T}[T16][단계 5] 배정"
run 앞공백 0 "Closes #5" "FAKE_5=open${T}false${T} [T3] 로드맵"
run 번호없음 1 "Closes #5" "FAKE_5=open${T}false${T}[단계 5] 배정"
run 중간에T 1 "Closes #5" "FAKE_5=open${T}false${T}[단계 5][T16] 배정"
run 닫힘 1 "Closes #5" "FAKE_5=closed${T}false${T}[T16] 배정"
run PR번호 1 "Closes #5" "FAKE_5=open${T}true${T}[T16] 배정"
run 없는이슈 1 "Closes #9"
run Closes없음 1 "그냥 PR"
run 둘중하나 0 "Closes #5, closes #6" "FAKE_5=open${T}false${T}[단계 5]" "FAKE_6=open${T}false${T}[T4][문서] x"
run 봇 0 "" AUTHOR="dependabot[bot]"
echo "통과 $pass, 틀림 $fail"; [ "$fail" = 0 ]

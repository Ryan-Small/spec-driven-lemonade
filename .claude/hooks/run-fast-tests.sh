#!/usr/bin/env bash
# Stop hook: run the fast test suites (unit and property tests) when Claude
# finishes a turn. Exit code 2 sends the failure back to Claude, and Claude
# continues instead of stopping.
#
# A side (backend, frontend) runs only if it has uncommitted changes, so a
# turn that changed no code costs nothing.

input=$(cat)

# Loop guard: this hook already sent Claude back to work once in this turn.
if printf '%s' "$input" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

changed() {
  [ -n "$(git status --porcelain -- "$1" 2>/dev/null)" ]
}

log=$(mktemp)
trap 'rm -f "$log"' EXIT

fail() {
  {
    echo "Fast tests failed: $1. Fix the code, not the acceptance tests. Last lines of output:"
    tail -n 40 "$log"
  } >&2
  exit 2
}

if [ -x backend/gradlew ] && changed backend; then
  (cd backend && ./gradlew test --quiet) >"$log" 2>&1 || fail "backend (./gradlew test)"
fi

if [ -f frontend/package.json ] && changed frontend; then
  (cd frontend && npm test -- --watch=false) >"$log" 2>&1 || fail "frontend (npm test)"
fi

exit 0

#!/usr/bin/env bash
# Mutation tests on changed files only (job 7). Usage: tools/ci/mutation-changed.sh <base-ref>
#
# Backend: PIT on the changed classes in the domain and service packages.
# Frontend: StrykerJS on the changed TypeScript files (no specs, no generated client, no wiring).
# Both tools fail below a mutation score of 80%.
set -euo pipefail
cd "$(dirname "$0")/../.."
base=$1

java_files=$(git diff --name-only --diff-filter=d "$base"...HEAD -- \
  backend/src/main/java/com/lemonade/domain backend/src/main/java/com/lemonade/service | grep '\.java$' || true)
if [ -n "$java_files" ]; then
  classes=$(echo "$java_files" | sed -e 's#^backend/src/main/java/##' -e 's#\.java$#*#' -e 's#/#.#g' | paste -sd, -)
  echo "PIT on: $classes"
  (cd backend && ./gradlew pitest -PpitTargetClasses="$classes")
else
  echo "Backend: no changed class in domain or service. PIT skipped."
fi

ts_files=$(git diff --name-only --diff-filter=d "$base"...HEAD -- frontend/src/app | grep '\.ts$' \
  | grep -vE '\.spec\.ts$|^frontend/src/app/api/|/app\.config\.ts$' | sed 's#^frontend/##' | paste -sd, - || true)
if [ -n "$ts_files" ]; then
  echo "StrykerJS on: $ts_files"
  (cd frontend && npm run generate:api --silent >/dev/null && npx stryker run --mutate "$ts_files")
else
  echo "Frontend: no changed source file. StrykerJS skipped."
fi

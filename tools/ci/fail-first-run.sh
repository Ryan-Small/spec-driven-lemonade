#!/usr/bin/env bash
# Fail-first check (job 6): runs the acceptance tests of this change against the production
# code of the base commit. Usage: tools/ci/fail-first-run.sh <base-ref>
#
# It builds a copy of the base commit, replaces the spec tier (spec, contract, step
# definitions, build files, tools) with the versions of this change, and runs the @api and
# @ui scenarios there. The runs are expected to fail. fail-first.mjs judges the reports.
set -uo pipefail
cd "$(dirname "$0")/../.."
base=$1

node tools/ci/fail-first.mjs targets "$base" || exit 1
if [ "$(node -e 'console.log(JSON.parse(require("fs").readFileSync("reports/fail-first-targets.json")).length)')" = "0" ]; then
  echo "No new or changed scenario. Nothing to check."
  exit 0
fi

work=$(mktemp -d)
trap 'git worktree remove --force "$work/base" >/dev/null 2>&1' EXIT
git worktree add --detach "$work/base" "$base" >/dev/null || exit 1

# The spec tier and the build configuration come from this change.
# The production code (backend/src/main, frontend/src) stays as it is on the base commit.
for path in spec contracts tools \
    backend/build.gradle.kts backend/settings.gradle.kts backend/gradle backend/gradlew \
    backend/src/test/java/com/lemonade/acceptance \
    frontend/e2e frontend/playwright.config.ts frontend/package.json frontend/package-lock.json \
    frontend/openapitools.json frontend/angular.json frontend/proxy.conf.json frontend/tsconfig.json; do
  [ -e "$path" ] || continue
  rm -rf "${work:?}/base/$path"
  mkdir -p "$(dirname "$work/base/$path")"
  cp -R "$path" "$work/base/$path"
done

echo "--- @api scenarios on the base production code (failures are expected) ---"
(cd "$work/base/backend" && ./gradlew acceptanceTest --quiet >"$work/api.log" 2>&1) || tail -n 15 "$work/api.log"

echo "--- @ui scenarios on the base production code (failures are expected) ---"
(cd "$work/base/frontend" && npm ci --silent >"$work/ui.log" 2>&1 && npm run test:ui >>"$work/ui.log" 2>&1) || tail -n 15 "$work/ui.log"

mkdir -p "$work/base/reports"
node tools/ci/fail-first.mjs verify "$work/base/reports"

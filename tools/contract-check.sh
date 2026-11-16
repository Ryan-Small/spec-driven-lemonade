#!/usr/bin/env bash
# Compares the OpenAPI document of the current backend code with the locked contract.
# Exit 0: identical. Exit 1: different (oasdiff says if the difference breaks clients).
set -euo pipefail
cd "$(dirname "$0")/.."

(cd backend && ./gradlew generateOpenApiDocs --quiet)

locked=contracts/openapi.yaml
generated=backend/build/openapi/openapi.yaml

if diff -u "$locked" "$generated"; then
  echo "CONTRACT OK: the backend matches $locked"
  exit 0
fi

echo
echo "CONTRACT CHANGED: the backend no longer matches $locked"
echo "--- breaking changes (oasdiff) ---"
oasdiff breaking "$locked" "$generated" || true
echo "A contract change is a spec change. Use the propose-spec-change skill."
exit 1

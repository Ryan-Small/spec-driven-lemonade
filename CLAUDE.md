# Lemonade Stand — spec-driven teaching project

## Goal

Build a small Lemonade Stand game where the spec, not the agent, owns product intent. The owner reviews intent and evidence, not code.

## Non-goals

- Features outside `spec/features/`. Release 1 scope is listed in `spec/non-functional.md`.
- A database, login, or deployment.
- Clever code. Prefer the plainest code that passes the spec.

## Locked paths

Do not edit these as part of an implementation task:

- `spec/` — requirements (Gherkin rules with `REQ-xxx` IDs) and `non-functional.md`
- `contracts/` — the API contract
- `.github/workflows/` — the CI gate
- `.claude/hooks/` and `.claude/settings.json` — the local guardrail

A hook blocks edits to these paths. Do not work around the hook (no shell redirects, no `sed`, no edits to the hook). If you believe a locked file must change, use the conflict protocol.

## Conflict protocol

If a task conflicts with a rule in `spec/`, or needs a rule that does not exist:

1. Stop. Change no file.
2. Run the `propose-spec-change` skill. It reports the REQ ID, the conflict, and 2–3 options.
3. Wait for the owner's decision.
4. Only then, in this order: spec change → acceptance test change → code.

## Two test tiers

- **Acceptance tests** are the spec. Step definitions (`backend/src/test/**/acceptance/`, `frontend/e2e/steps/`) must assert exactly what the Gherkin step says. Never weaken one to make a build pass.
- **Unit and property tests** belong to the implementation. Change them freely.

## Assumptions

Do not invent product decisions. If the spec does not cover a game rule, ask the owner. For each minor decision the spec did not make, add a row to the Assumptions table in `implementation-notes/<REQ-ID>-<short-name>.md` (copy `implementation-notes/TEMPLATE.md`) before you write the code that depends on it.

## Workflow

- Implement a requirement with the `implement-requirement` skill.
- Review a change with the `conformance-reviewer` subagent before you report it as done.
- `REVIEW.md` defines what failure looks like.
- All randomness comes from the injectable random source (NFR-003). Money is whole cents (NFR-001).

## Commands

| Purpose | Command |
|---|---|
| Backend unit and property tests (fast) | `cd backend && ./gradlew test` |
| Backend `@api` acceptance tests | `cd backend && ./gradlew acceptanceTest` |
| Backend mutation tests | `cd backend && ./gradlew pitest` |
| Compare the backend with the locked contract | `tools/contract-check.sh` |
| Frontend unit tests (fast) | `cd frontend && npm test -- --watch=false` |
| Frontend `@ui` acceptance tests | `cd frontend && npm run test:ui` |
| Regenerate the API client | `cd frontend && npm run generate:api` |
| Traceability check | `node tools/trace-check/trace-check.mjs` |

The `@e2e` command arrives with REQ-013, which owns the only `@e2e` scenario.

## Pending requirements

`tools/trace-check/pending-requirements.txt` lists the requirements that are not implemented yet. Acceptance runs skip their scenarios. To start a requirement, remove its line, then run its scenarios and see them fail. Never add a line to this file: the list may only shrink.

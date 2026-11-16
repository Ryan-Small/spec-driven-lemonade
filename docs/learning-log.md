# Learning log

One entry per file or config: what it does, which failure it prevents, and what goes wrong without it.

## Phase 1 — The spec

### `spec/features/*.feature` (game-lifecycle, weather, supplies, stand)

- **What it does:** Holds every functional requirement as a Gherkin `Rule:` in EARS form with an ID (`REQ-001`…`REQ-015`). The scenarios under a rule are concrete, executable examples with real numbers.
- **Failure it prevents:** Silent intent drift. A rule with an ID gives every later change something exact to conflict with. A scenario with numbers turns "demand depends on price" into a result that passes or fails.
- **Without it:** Requirements live in chat history and in the agent's reading of the code. A release-2 feature overwrites a release-1 rule, and no person decides it.

### Tags on every scenario (`@REQ-xxx` plus `@api`, `@ui` or `@e2e`)

- **What it does:** The REQ tag links a scenario to its rule. The layer tag selects the test runner: Cucumber-JVM for `@api`, playwright-bdd for `@ui` and `@e2e`.
- **Failure it prevents:** Untested requirements and orphan tests. The trace-check tool reads these tags from the test reports.
- **Without it:** Traceability becomes a hand-kept table, and a hand-kept table goes stale.

### Constants and the demand formula in the feature descriptions

- **What it does:** Puts the numbers (prices, limits, base customers, formula) inside the locked files, next to the rules that use them.
- **Failure it prevents:** A "small tuning change" to a constant in code. Because the scenarios compute from these numbers, a changed constant fails a locked test.
- **Without it:** Game balance changes with no spec change, and all tests still pass after someone "updates" them.

### `spec/non-functional.md`

- **What it does:** Holds the rules that are not scenarios: integer money, the injectable random source, invariants for property tests, the error-code list, and what each test tier may stub.
- **Failure it prevents:** Two quiet failures. First, flaky or untestable scenarios, because randomness is not controllable. Second, a test tier that stubs away the thing it claims to test.
- **Without it:** Each of these becomes an unlogged agent decision made during implementation.

## Phase 2 — Repo skeleton and Claude configuration

The layers, weakest to strongest: `CLAUDE.md` and rules **ask**. Hooks **block locally**. CI **gates the merge** (Phase 4). Each layer catches what the one before it lets through.

### `CLAUDE.md` (root)

- **What it does:** Claude Code loads it at the start of every session. It states the goal, the locked paths, the conflict protocol, the assumption rule, and the commands.
- **Failure it prevents:** An agent that does not know the rules. Most drift is ignorance, not defiance.
- **Without it:** Every session starts from zero, and the rules live in a chat that the next session cannot see.
- **Limit:** Advisory only. The agent can misread it or lose it in a long session. That is why the next layers exist.

### `backend/CLAUDE.md` and `frontend/CLAUDE.md`

- **What it does:** Stack conventions. Claude Code loads a nested `CLAUDE.md` on demand, when it first reads or edits a file in that directory.
- **Failure it prevents:** A bloated root file. Rules that load only when relevant are followed more reliably than rules buried in a long file.
- **Without it:** Java conventions cost context during frontend work, or they are missing when needed.

### `.claude/rules/acceptance-steps.md` and `.claude/rules/generated-client.md`

- **What it does:** Path-scoped rules. The `paths:` frontmatter makes Claude Code load the rule only when a matching file is opened.
- **Failure it prevents:** The exact failure this project is about: weakening a step definition to make a build pass. The warning appears at the moment the agent opens the file. The second rule stops hand edits to the generated API client, which would hide a contract break.
- **Without it:** The warning sits in `CLAUDE.md`, far from the moment of temptation.

### `.claude/settings.json`

- **What it does:** Project settings, shared through git. It registers the two hooks. `allow` rules stop permission prompts for test commands. `ask` rules force a prompt before `git push` and before `gh` creates a repo or a PR.
- **Failure it prevents:** Hooks that exist as files and never run. Outward-facing actions with no confirmation.
- **Without it:** The hook scripts are dead files.

### `.claude/hooks/protect-locked-paths.py` (PreToolUse hook)

- **What it does:** Runs before each Edit, Write, NotebookEdit and Bash call. It exits with code 2 to block a change to `spec/`, `contracts/`, `.github/workflows/`, `.claude/hooks/` or `.claude/settings.json`. The owner lifts the lock by creating `.claude/spec-unlock` in a terminal. The hook never lets Claude create that file.
- **Failure it prevents:** A quiet spec edit in the middle of an implementation task. The block message sends the agent to the conflict protocol.
- **Without it:** The only local protection is a sentence in `CLAUDE.md`.
- **Limit:** A guardrail, not a wall. The Bash check is a pattern match and can be evaded (a script that opens the file itself). The agent has the technical means to remove the lock. CI is the real gate.

### `.claude/hooks/run-fast-tests.sh` (Stop hook)

- **What it does:** Runs when Claude finishes a turn. It runs the unit and property tests of each side that has uncommitted changes. On failure it exits with code 2. Claude Code then feeds the output back to Claude, and Claude continues instead of stopping.
- **Failure it prevents:** "Done" with a red build. The owner does not have to ask "did you run the tests?".
- **Without it:** Verification depends on the agent remembering to do it.
- **Detail:** It exits at once when `stop_hook_active` is true. Without that guard, a test that cannot be fixed causes a loop.

### `.claude/hooks/git-read-only.py`

- **What it does:** A PreToolUse hook attached only to the reviewer subagent. It allows Bash for single read-only git commands and blocks all other commands.
- **Failure it prevents:** A reviewer that "helpfully" fixes what it finds. The Bash tool can write files, so a tool list alone does not make an agent read-only.
- **Without it:** The reviewer needs either no Bash (then it cannot read the diff) or full Bash (then it is not read-only).

### `.claude/skills/propose-spec-change/SKILL.md`

- **What it does:** The conflict protocol as steps, with a fixed output format: REQ ID, exact rule text, one concrete conflicting example, 2–3 options.
- **Failure it prevents:** An agent that resolves a conflict itself. The fixed format also makes proposals comparable, and one option is always "keep the spec".
- **Without it:** The agent reports conflicts in free prose, or decides alone.

### `.claude/skills/implement-requirement/SKILL.md`

- **What it does:** The standard flow for one requirement: restate → failing acceptance test → code → assumptions → checks → review → evidence report.
- **Failure it prevents:** Skipped steps, mainly fail-first. A test that never failed proves nothing.
- **Without it:** Each requirement is implemented in a different way with different evidence, and the owner cannot review by pattern.

### `.claude/skills/conformance-review/SKILL.md`

- **What it does:** The review procedure and its output format. `context: fork` with `agent: conformance-reviewer` makes it run inside the reviewer subagent, not in the main conversation.
- **Failure it prevents:** Behavior that maps to no requirement and no logged assumption.
- **Without it:** The review depends on how the request is worded each time.

### `.claude/agents/conformance-reviewer.md`

- **What it does:** Defines a subagent with read-only tools. A subagent starts with a fresh context: it sees the spec and the diff, not the conversation.
- **Failure it prevents:** Self-review bias. The author of a change holds its own reasons in context and tends to accept them. A fresh reviewer has only the spec to judge by.
- **Without it:** The agent that made the guess also grades the guess.

### `REVIEW.md`

- **What it does:** Lists the blocking failures for this repo (unmapped behavior, weakened acceptance test, constant drift, missing fail-first evidence) and what is explicitly not a failure.
- **Failure it prevents:** A reviewer that comments on style and misses intent drift.
- **Without it:** "Review" means whatever the reviewer happens to notice.
- **Fact from the docs:** Only the hosted Claude Code Review service (Team and Enterprise plans) reads this file automatically. In this repo the reviewer subagent reads it because its instructions say so.

### `implementation-notes/TEMPLATE.md`

- **What it does:** One notes file per change: assumptions, spec deltas, trade-offs, risks, evidence. Each assumption has an "Owner decision" column.
- **Failure it prevents:** The hidden guess. A logged guess is a decision the owner can accept or reject. An unlogged guess is a product decision that nobody made.
- **Without it:** Guesses are visible only by reading the code.

### `.github/pull_request_template.md`

- **What it does:** Gives every PR the same sections: intent, evidence, assumptions, spec deltas, conformance verdict.
- **Failure it prevents:** A PR the owner can judge only by reading the diff.
- **Without it:** The evidence exists somewhere, and the owner has to hunt for it.

### `.gitignore`

- **What it does:** Keeps build output, reports, personal Claude settings and the `.claude/spec-unlock` switch out of git.
- **Failure it prevents:** A committed unlock file, which would disable the lock for every later session.
- **Without it:** One `git add .` turns the guardrail off for good.

## Phase 3 — Walking skeleton (REQ-001, start a new game)

One requirement through every layer: spec → failing acceptance test → backend → contract → generated client → browser → traceability.

### `backend/build.gradle.kts` and `backend/settings.gradle.kts`

- **What it does:** Defines two test tasks. `test` is the fast tier (JUnit and jqwik). `acceptanceTest` runs the `@api` scenarios straight from `spec/features/` with Cucumber and writes an NDJSON report. The Gradle toolchain pins Amazon Corretto 21 and downloads it.
- **Failure it prevents:** Mixed tiers. If acceptance tests and unit tests are one task, "the tests pass after I adjusted them" hides which tier was adjusted.
- **Without it:** The Stop hook cannot run only the fast tier, and CI cannot treat the spec tier as locked.

### `backend/src/test/java/com/lemonade/acceptance/` (step definitions)

- **What it does:** Turns each Gherkin step into an HTTP call or an assertion against the real application on a random port. The feature files stay in `spec/`; this folder holds only the glue.
- **Failure it prevents:** A spec that is only prose. The glue makes the locked text executable.
- **Without it:** The feature files are documentation, and nothing fails when the code disagrees with them.
- **Weak point to know:** This glue is not in a locked path. A weakened step definition passes the hook. Fail-first evidence, the path-scoped rule, the conformance review and (in Phase 4) the CI fail-first job cover it.

### `tools/trace-check/pending-requirements.txt`

- **What it does:** Lists the requirements that are not built yet. Acceptance runs skip their scenarios. Starting a requirement means removing its line.
- **Failure it prevents:** A permanently red build during release 1, which trains everyone to ignore red. It also makes "implemented" an explicit claim that the trace-check then tests.
- **Without it:** Either all 37 scenarios fail until the last day, or scenarios are skipped ad hoc with no record.
- **Rule:** The list may only shrink. Adding a line would be a quiet way to switch a requirement off.

### `tools/trace-check/trace-check.mjs`

- **What it does:** Reads the feature files and the NDJSON reports. It fails if a scenario has no valid `@REQ` tag, if a rule has no scenario, or if any scenario of an implemented requirement has no passing run.
- **Failure it prevents:** A scenario that silently stops running (deleted glue, a tag filter, a skipped project). A test runner reports "0 failed" for a test that never ran. Trace-check asks the opposite question: did every required scenario pass?
- **Without it:** Coverage of the spec is a belief. I tested this by emptying the UI report: the check failed with "no run found for @ui scenario".

### `contracts/openapi.yaml` and `tools/contract-check.sh`

- **What it does:** The contract is the API as the backend produced it, frozen in a locked file. The script regenerates the document from the current code, compares it with the locked file, and runs `oasdiff breaking` on a difference.
- **Failure it prevents:** An API change that nobody decided: a renamed field, a removed status value.
- **Without it:** The frontend learns about an API change at run time, in the browser.

### `frontend/` generated client (`npm run generate:api`, output in `src/app/api/`, not committed)

- **What it does:** openapi-generator writes TypeScript types and an Angular service from the locked contract before each start, build and test.
- **Failure it prevents:** Drift between the two sides. The page uses `GameResponse.cashCents`; if the contract renames that field, the frontend does not compile.
- **Without it:** Hand-written types that say whatever the frontend developer believes the API returns.

### `frontend/playwright.config.ts` and `frontend/e2e/steps/`

- **What it does:** playwright-bdd runs the `@ui` scenarios from the same locked feature files in a real browser. The API is stubbed, and each stub is typed with the generated client model, so a stub that breaks the contract does not compile. An API call with no stub is aborted.
- **Failure it prevents:** A UI test that passes against a fantasy API.
- **Without it:** The `@ui` tier can drift from the contract while staying green.

### What the walking skeleton showed

- **Fail-first worked on both sides.** `@api`: `Expected status code <201> but was <404>`. `@ui`: timeout waiting for the "Start new game" button.
- **Mutation testing caught a weak unit test that I wrote.** PIT replaced `SystemSeedSource.nextSeed()` with `return 0`, and the tests still passed, because my test checked only the range of the seed. No other layer saw this: the acceptance tests passed, the trace-check passed. The fix was a test that also requires distinct seeds.
- **The locked-path hook fired for real.** It blocked a shell command of mine that named the unlock file.
- **Six assumptions were needed for one small requirement.** They are in `implementation-notes/REQ-001-start-game.md`. The largest is the API shape itself.

## Phase 4 — CI pipeline

CI is the only layer the agent cannot switch off from inside a session. Everything before it (CLAUDE.md, rules, hooks) can be misread, bypassed or edited. A required CI job on a protected branch cannot.

### `.github/workflows/ci.yml`

- **What it does:** Runs nine jobs on every pull request, cheapest first. A job starts only if the jobs before it did not fail, so a change that fails the 10-second gate never spends minutes on tests.
- **Failure it prevents:** Each job owns one failure. See the table below.
- **Without it:** Every guardrail in this repo is advisory.

| Job | Fails when | The quiet failure it catches |
|---|---|---|
| 1 Gate | A locked path changed and the PR has no `spec-change` label | The agent edits the spec, the contract, a workflow, a hook or a CI script to fit its code |
| 2 Contract | The API of the code differs from `contracts/openapi.yaml` | A renamed or removed API field |
| 3 Build | Either side does not compile, including the frontend against the generated client | A contract change that the frontend was not updated for |
| 4 Unit and property tests | A fast test fails | Ordinary regressions |
| 5a, 5b Acceptance | An `@api` or `@ui` scenario of an implemented requirement fails | Behavior that no longer matches the spec |
| 6 Fail-first | A new or changed scenario passes on the base commit | A test that cannot fail, for example a weakened step definition |
| 7 Mutation | Under 80% of mutants in the changed files are killed | Unit tests that run the code and assert nothing |
| 8 Traceability | A scenario of an implemented requirement has no passing run | A scenario that silently stopped running |

### `tools/ci/gate.mjs`

- **What it does:** Lists the files a pull request changes. If one is under `spec/`, `contracts/`, `.github/workflows/`, `.claude/` or `tools/`, the pull request needs the `spec-change` label. The pending-requirements list may lose lines freely and may gain a line only with the label.
- **Failure it prevents:** A spec change that nobody decided. A solo developer cannot approve their own pull request, so the label stands in for a second reviewer: setting it is the owner's explicit "I decided this".
- **Without it:** The local hook is the only lock, and the agent can remove the local hook.
- **Detail:** The workflow runs the gate script of the base commit, not the one in the pull request. A pull request cannot weaken the gate that judges it.
- **Limit:** GitHub runs the workflow file of the pull request itself. A pull request that rewrites `ci.yml` to drop the gate job still shows a changed locked path only if the gate job runs. Branch protection closes this: it requires a check named "1 Gate", and a removed job reports no check.

### `tools/ci/fail-first-run.sh` and `tools/ci/fail-first.mjs`

- **What it does:** Builds the production code of the base commit together with the tests and spec of the pull request, runs the acceptance tiers there, and fails if a new or changed scenario passes.
- **Failure it prevents:** A scenario that passes with or without the change. Such a scenario is decoration. The common cause is a step definition that asserts nothing, or asserts a value it read back from the system.
- **Without it:** "The new acceptance test passes" is accepted as proof, and nobody checks that the test can fail.
- **Tested locally with two simulations:** with the REQ-001 code absent on the base, all 3 scenarios failed there and the check passed. With the code already present on the base, the check failed with "3 scenario(s) pass without the change".

### `tools/ci/mutation-changed.sh`, the `pitest` block in `backend/build.gradle.kts`, `frontend/stryker.config.json`

- **What it does:** Mutation testing changes the production code in small ways (flip a condition, return 0) and reruns the unit tests. A mutant that no test notices "survives". On a pull request only the changed files are mutated, to keep the job short.
- **Failure it prevents:** Weak unit tests. The agent may change unit tests freely, so something has to check that they still test. Coverage does not: a test with no assertion gives 100% coverage.
- **Without it:** The freedom to edit unit tests becomes the freedom to hollow them out.
- **Seen in Phase 3:** PIT caught a seed test of mine that checked only a range.

### `.github/workflows/nightly.yml`

- **What it does:** Job 9. Runs all three acceptance layers, including `@e2e` against the real backend, then the traceability check over all layers, and full mutation runs. It runs after each merge to main, every night, and on demand.
- **Failure it prevents:** A break that only the slow checks see: the two sides pass alone and fail together.
- **Without it:** The slow checks either run on every pull request (slow feedback) or never.

### `.github/actions/setup/action.yml`

- **What it does:** One shared setup step: Amazon Corretto 21, Gradle cache, Node 24, `npm ci`, and the test browser on request.
- **Failure it prevents:** Eight copies of the same setup that drift apart, for example one job on a different Java version.
- **Without it:** A version bump needs eight edits, and one gets missed.

# Implementation notes: REQ-001 start a new game (walking skeleton)

- **Requirements implemented:** REQ-001
- **Date:** 2026-11-15

## Assumptions

Each decision the spec did not make. The owner confirms or rejects each one.

| ID | Assumption | Why it was needed | Where in the code | Owner decision |
|----|------------|-------------------|-------------------|----------------|
| A-1 | The start-game API is `POST /api/games` with no request body. It answers `201` with `id`, `status`, `day`, `totalDays`, `cashCents`, `inventory {lemons, sugar, cups, ice}`, `seed`. | REQ-001 says what a new game contains, not how the API looks. | `backend/src/main/java/com/lemonade/api/GameController.java`, `GameResponse.java`; locked in `contracts/openapi.yaml` | accepted 2026-11-15 |
| A-2 | A seed the system chooses is a whole number from 0 to 2^53 − 1. | A JavaScript client reads larger whole numbers with loss. REQ-001 requires the seed to be reported. | `backend/src/main/java/com/lemonade/service/SystemSeedSource.java` | accepted 2026-11-15 |
| A-3 | The game ID is a random UUID. | NFR-012 says "opaque ID" and gives no format. | `backend/src/main/java/com/lemonade/service/GameService.java` | accepted 2026-11-15 |
| A-4 | The browser tab title and the page heading are "Lemonade Stand". The page has a button "Start new game" and the label "Cash:". The start button disappears when a game exists. | The `@ui` scenario fixes "Day 1 of 7" and "$20.00" only. The other texts are not in the spec. | `frontend/src/app/app.html` | accepted 2026-11-15 |
| A-5 | The backend does not store the game yet. | No REQ-001 scenario reads a game back. The store (NFR-011) arrives with the first requirement that needs it (REQ-003 or REQ-004). | `backend/src/main/java/com/lemonade/service/GameService.java` | accepted 2026-11-15 |
| A-6 | If the start request fails, the page stays on the start button and shows no message. | The spec has no rule for a failed start request. | `frontend/src/app/app.ts` | accepted 2026-11-15 |
| A-7 | The running backend also serves its own API description at `GET /v3/api-docs` and `/v3/api-docs.yaml`. These two endpoints are not in the contract. | springdoc creates them, and `tools/contract-check.sh` reads them to compare the code with the contract. Found by the conformance review. Option: switch them off outside the contract check. | `backend/build.gradle.kts` (dependency `springdoc-openapi-starter-webmvc-api`) | accepted 2026-11-15 |
| A-8 | The seed of a game comes from `SecureRandom` behind its own `SeedSource` interface, not from the `RandomSource` of NFR-003. I added this exception to `backend/CLAUDE.md` after I wrote the code. | NFR-003 covers weather and demand noise. The seed is the input of that source, so it cannot come from it. Found by the conformance review: a convention was edited to fit the code. | `backend/src/main/java/com/lemonade/service/SystemSeedSource.java`, `backend/CLAUDE.md` | accepted 2026-11-15 |
| A-9 | The contract lists the server `http://localhost:8080`. | springdoc writes the address it was called on. | `contracts/openapi.yaml` lines 5–7 | accepted 2026-11-15 |

## Spec deltas

| File | REQ ID | Change | Approved by owner on |
|------|--------|--------|----------------------|
| `contracts/openapi.yaml` | REQ-001 | New file. First version of the contract, generated from the backend: one operation `startGame`, schemas `GameResponse` and `InventoryResponse`. | Accepted by the owner on 2026-11-15. The owner delegated the content details for this teaching project. |

No change to `spec/`.

## Trade-offs

- **Contract generated from code, then locked.** The alternative is to write the contract by hand first. Generated-then-locked matches the chosen stack (springdoc). Cost: the first version of the contract is whatever the code produced, so the owner must review it once.
- **Generated client is not committed.** `npm run generate:api` runs before `start`, `build`, `test` and `test:ui`. The client can never be stale. Cost: each of those commands needs a Java runtime and takes a few seconds longer.
- **`tools/trace-check/pending-requirements.txt`.** Acceptance runs skip the scenarios of pending requirements, and trace-check does not require them. Without this list, CI is red until all 15 requirements exist. The list may only shrink; Phase 4 adds the CI check for that.
- **`@Schema(requiredMode = REQUIRED)` on each response field.** Without it the contract marks every field optional, and the generated TypeScript client would allow `undefined` everywhere.

## Risks

- **`GameStatus` has one value (`IN_PROGRESS`).** REQ-013 and REQ-014 add `COMPLETED` and `BANKRUPT`. Each addition changes the locked contract.
- **Every later requirement that adds an endpoint or a field changes the contract.** Each needs the owner to lift the lock. That is the intended gate, and it costs one step per requirement.
- **Library versions are newer than well-trodden.** Spring Boot 4.1.2, Cucumber-JVM 8.1.0, JUnit 6. The build works; the Gradle output warns about deprecated features that Gradle 10 removes (not investigated).
- **Trace-check trusts the report files.** It does not check that a report in `reports/` is newer than the code. A stale passing report passes. CI starts from a clean checkout, so this is a local risk only.
- **Nothing enforces "the pending list may only shrink" yet.** Phase 4 adds that CI check.
- **`reports/` is git-ignored.** The evidence in this file is pasted text. CI output is the evidence that travels with a change.
- **The step `the page shows {string}` matches text anywhere on the page.** It is exact-text, and it does not check where the text is.

## Evidence

- **Fail-first, `@api`** — `cd backend && ./gradlew acceptanceTest`, before any controller existed (no base commit exists yet; the repo has no commit):
  ```
  Scenario: A new game starts on day 1 with the starting cash
    ✔ When the player starts a new game
    ✘ Then the game status is "IN_PROGRESS"
        java.lang.AssertionError: Expected status code <201> but was <404>.
  Scenario: A game started without a seed reports the seed the system chose
    ✔ When the player starts a new game
    ✘ Then the game reports a seed
        java.lang.AssertionError: Expected status code <201> but was <404>.
  60 tests completed, 2 failed, 58 skipped
  ```
- **Fail-first, `@ui`** — `cd frontend && npm run test:ui`, before the page existed:
  ```
  ✘ The player starts a new game in the browser @REQ-001 @ui
    When the player starts a new game
    TimeoutError: locator.click: Timeout 5000ms exceeded.
      - waiting for getByRole('button', { name: 'Start new game' })
  1 failed
  ```
- **Acceptance** — after the implementation: `@api` 2 scenarios passed (the other 58 scenario runs were filtered out: pending requirements and non-`@api` layers), `@ui` 1 passed.
- **Trace-check** — `node tools/trace-check/trace-check.mjs`: `OK REQ-001 api 2/2, ui 1/1`; 14 pending; `TRACE-CHECK PASSED`. With an emptied UI report it fails with "no run found for @ui scenario".
- **Contract** — `tools/contract-check.sh`: `CONTRACT OK: the backend matches contracts/openapi.yaml`.
- **Unit and property tests** — backend `./gradlew test` passes (JUnit and jqwik); frontend `npm test -- --watch=false`: 5 passed (includes one fast-check property).
- **Mutation tests** — `./gradlew pitest`: first run 2 of 3 killed. The survivor replaced `SystemSeedSource.nextSeed()` with `return 0`; the unit test checked only the range. After the test also required distinct seeds: 3 of 3 killed.
- **Browser, full stack** — backend and `ng serve` running; clicked "Start new game" at `http://localhost:4200`; the page showed "Day 1 of 7" and "Cash: $20.00".
- **Conformance review** — verdict FAIL. Code and step definitions conform; no pending requirement is implemented; constants match. Two unmapped behaviors (now A-7, and the tab title, now in A-4). Two REVIEW.md failures that only the owner can clear: the contract content is not yet approved (failure 2), and `tools/trace-check/` was created with no `spec-change` label, because no PR exists yet (failure 6).
- **Not run** — StrykerJS (not set up; Phase 4). The `@e2e` tier (its only scenario belongs to REQ-013).

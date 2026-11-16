# REVIEW.md — what failure looks like in this repo

The reviewer (a person or the `conformance-reviewer` subagent) reviews **intent and evidence**, not code style. A change fails review if any item below is true.

## Blocking failures

1. **Unmapped behavior.** The diff changes what the system does, and that change maps to no `REQ-xxx` rule and to no logged assumption in `implementation-notes/`.
2. **Spec edited to fit the code.** A file in `spec/` or `contracts/` changed in the same change as the code it constrains, without an approved spec-change proposal that names the REQ ID.
3. **Weakened acceptance test.** A step definition asserts less than its Gherkin step says. Examples: a `Then` step with no assertion, a compared value read back from the system instead of from the scenario, a skipped or pending step, a broad `try/catch`.
4. **Constant drift.** A game constant in code (price, limit, base customers, formula term) differs from the value in the feature file description.
5. **No fail-first evidence.** A new or changed scenario has no recorded failing run against the base commit.
6. **Guardrail edited.** The change touches `.claude/hooks/`, `.claude/settings.json`, `.github/workflows/` or `tools/trace-check/` without the `spec-change` label and a stated reason.
7. **Hidden product decision.** The code decides a game rule that the spec does not cover, and the decision is not in the notes as an assumption for the owner to confirm.
8. **Invented evidence.** The notes or the PR claim a test result that the attached output does not show.

## Not failures

- Refactoring with no behavior change, when acceptance tests are untouched and pass.
- Adding, changing or deleting unit tests. Unit tests belong to the implementation. Mutation testing judges their strength.
- A logged assumption. Logging the guess is the correct behavior. The owner decides if it becomes a rule.

## Evidence a change must carry

- The REQ IDs it implements.
- The fail-first output (scenario red on the base commit).
- The passing acceptance output for those REQ IDs.
- The trace-check output.
- The `implementation-notes/` file for the change.

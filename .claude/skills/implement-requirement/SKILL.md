---
name: implement-requirement
description: Implement one REQ from spec/features end to end with evidence. Use for every requirement implementation. Flow - restate, fail-first acceptance test, implement, log assumptions, run checks, show evidence.
argument-hint: "<REQ-ID>"
---

# Implement a requirement

Requirement: $ARGUMENTS

Do the steps in order. Do not skip a step. Do not edit a locked path at any step.

## 1. Restate

- Read the `Rule:` for the REQ ID and every scenario under it. Read the NFRs it depends on.
- Restate the rule in your own words and list the scenarios with their layer tags.
- List what the rule does **not** say that you need to know. A product decision goes to the owner as a question. A minor decision becomes an assumption in step 4.
- If the rule conflicts with existing code or another rule, stop and run `propose-spec-change`.

## 2. Fail first

- Copy `implementation-notes/TEMPLATE.md` to `implementation-notes/<REQ-ID>-<short-name>.md`.
- Write the step definitions for the scenarios. Follow `.claude/rules/acceptance-steps.md`.
- Run the scenarios for this REQ before you write production code. They must fail, and they must fail on the assertion or on the missing feature, not on a typo or a missing step.
- Paste the failing output into the Evidence section of the notes.

## 3. Implement

- Write the smallest production code that makes the scenarios pass.
- Order for an API change: backend → regenerate the OpenAPI document → compare with `contracts/openapi.yaml` → regenerate the frontend client → UI. A contract difference is a spec change: run `propose-spec-change`.
- Add unit tests and property tests for the logic. These are yours to shape.

## 4. Log assumptions

- For each decision the spec did not make, add a row to the Assumptions table **before** you write the code that depends on it.
- Record trade-offs and risks. Write "None" in a section only when that is true.

## 5. Run checks

Run the commands in the root `CLAUDE.md` for the sides you changed: fast tests, acceptance tests for the affected layers, and the traceability check. Run mutation tests on the changed domain or service code.

## 6. Review

Run the `conformance-review` skill. Fix each unmapped change: remove it, map it to a REQ, or log it as an assumption.

## 7. Show evidence

Report to the owner in this format. Paste real output. Never summarize a result you did not see.

```
REQUIREMENT <REQ-ID>: <rule text>

Fail-first:   <command> → <failing lines>
Acceptance:   <command> → <N scenarios passed, by name>
Trace-check:  <output line for this REQ>
Unit/property: <counts>
Mutation:     <score for changed code, surviving mutants>
Assumptions:  <A-1 …, or "None">
Spec deltas:  <or "None">
Conformance:  <verdict>
Not verified: <what you did not check>
```

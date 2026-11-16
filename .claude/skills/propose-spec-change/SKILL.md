---
name: propose-spec-change
description: The conflict protocol. Use when a task conflicts with a REQ rule in spec/, needs a rule the spec does not have, or needs a change to contracts/, .github/workflows/ or .claude/hooks/. Produces a fixed-format proposal for the owner and changes no file.
argument-hint: "[the task or request that causes the conflict]"
---

# Propose a spec change

Request under review: $ARGUMENTS

You found a conflict between a task and a locked file. Your job is to report it. You do not resolve it.

## Steps

1. **Stop.** Do not edit any file. Do not write code "in preparation".
2. **Find the rules.** Search `spec/features/` and `spec/non-functional.md` for every `REQ-xxx` and `NFR-xxx` the request touches. Read the full rule and its scenarios. Quote them exactly.
3. **State the conflict.** Give one concrete input where the request and the rule demand different results.
4. **Find the blast radius.** List the other rules, scenarios, constants and contract fields that depend on the conflicting rule.
5. **Write 2–3 options.** Always include "reject the request, keep the spec". For each option list the exact spec text to add, change or remove.
6. **Output the proposal** in the format below. Then wait for the owner's decision.
7. **After the decision, and only then:** ask the owner to lift the lock (`touch .claude/spec-unlock` in their terminal). Apply the change in this order: spec files → acceptance tests (run them, they must fail) → code. Record the delta in the "Spec deltas" table of the implementation notes. Ask the owner to remove the lock (`rm .claude/spec-unlock`).

## Output format

```
SPEC CHANGE PROPOSAL

Request:        <the request, one sentence>
Conflicts with: <REQ-xxx> in <file>
Rule text:      "<exact rule text>"
Conflict:       <one concrete example: input, result the rule requires, result the request requires>
Also affected:  <REQ / NFR IDs, scenarios, constants, contract fields — or "none">

Option A — Keep the spec, reject or reshape the request
  Spec change:  none
  Consequence:  <what the owner does not get>

Option B — <name>
  Spec change:  <file>: <exact old text> → <exact new text>
  Scenarios:    <added / changed / removed, by name>
  Consequence:  <effect on existing behavior and on existing games>

Option C — <name>
  ...

Recommendation: <one option and one sentence of reason>
Decision needed: A, B or C. No file changes until you decide.
```

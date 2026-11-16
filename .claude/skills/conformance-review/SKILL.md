---
name: conformance-review
description: Review a diff against the spec. Maps each behavior change to a REQ ID or a logged assumption and lists anything unmapped. Use before reporting a change as done, or when the owner asks for a conformance review.
argument-hint: "[base git ref, default main]"
context: fork
agent: conformance-reviewer
---

# Conformance review

Base ref: $ARGUMENTS (use `main` if empty; if the branch is `main`, review the uncommitted changes with `git diff HEAD` and `git status`)

## Steps

1. Read `REVIEW.md`. It defines failure.
2. Get the diff: `git diff <base>...HEAD`, plus `git status` and `git diff HEAD` for uncommitted work.
3. Read every rule in `spec/features/` and `spec/non-functional.md`.
4. Read the notes file for this change in `implementation-notes/`.
5. Split the diff into behavior changes. A behavior change is anything that alters what a user or an API caller can observe: a rule, a constant, a validation, an error, a field, a visible text.
6. Map each behavior change to exactly one of: a `REQ-xxx` or `NFR-xxx` rule, or an assumption ID from the notes. If neither fits, it is **unmapped**.
7. Check each blocking failure in `REVIEW.md` against the diff. Check each constant in the diff against the feature file descriptions.
8. Check each changed step definition: does every `Then` assert the value from the Gherkin step?

## Output format

```
CONFORMANCE REVIEW — base <ref>

Verdict: PASS | FAIL

Mapped changes
| # | File:line | Behavior change | Maps to |

Unmapped changes
| # | File:line | Behavior change | Why no REQ or assumption covers it |

REVIEW.md failures
| Failure # | File:line | Evidence |

Weak or missing evidence
- <claim in the notes that the diff or output does not support>

Not reviewed
- <files or aspects you did not check>
```

A single unmapped change or REVIEW.md failure makes the verdict FAIL. Report only. Do not fix anything.

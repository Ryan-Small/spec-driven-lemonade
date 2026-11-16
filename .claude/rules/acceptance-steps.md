---
paths:
  - "backend/src/test/java/com/lemonade/acceptance/**"
  - "frontend/e2e/steps/**"
---

# Acceptance step definitions are part of the spec tier

You are editing a step definition. It is the executable form of a locked Gherkin step.

- Each `Then` step must assert exactly what its text says, with the expected value taken from the step text or the data table. Never read the expected value back from the system under test.
- Do not add `try/catch`, retries, skips, pending markers or tolerance ranges to make a scenario pass.
- Do not change a step definition to fit the code. If the code and the step disagree, the code is wrong or the spec must change. For a spec change, use the `propose-spec-change` skill.
- `Given` steps may use test-only setup (for example the scripted random source). `When` and `Then` steps use the public API or the browser only.
- A new step definition needs fail-first evidence: run the scenario before the production code exists and keep the failing output.

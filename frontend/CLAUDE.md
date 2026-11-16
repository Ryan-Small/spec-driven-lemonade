# Frontend conventions

Loaded when Claude works on files in `frontend/`. The root `CLAUDE.md` rules still apply.

- Angular (current LTS), standalone components, strict TypeScript.
- The API client in `src/app/api/` is generated from `contracts/openapi.yaml` by openapi-generator (`typescript-angular`). Never edit it by hand. Regenerate it with `npm run generate:api`. A compile error after regeneration means the contract changed.
- Components hold no game rules. The backend computes every game value. The frontend formats and shows it. Format cents as dollars in one shared function.
- Acceptance tests: playwright-bdd step definitions in `e2e/steps/`. They read features from `../spec/features`. `@ui` scenarios stub the API with responses that conform to the contract (NFR-016). `@e2e` scenarios use the real backend with no stubs (NFR-017). Their NDJSON report goes to `../reports/`.
- Unit tests use the Angular default test runner. Property tests use fast-check. StrykerJS runs mutation tests.
- User-visible text in a `@ui` scenario (for example "Day 1 of 7") is part of the spec. Do not reword it.

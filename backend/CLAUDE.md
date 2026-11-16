# Backend conventions

Loaded when Claude works on files in `backend/`. The root `CLAUDE.md` rules still apply.

- Java 21 (Amazon Corretto through the Gradle toolchain), Spring Boot, Gradle with Kotlin DSL (`build.gradle.kts`).
- Packages under `com.lemonade`: `domain` (pure game rules, no Spring), `service` (game store and orchestration), `api` (controllers and DTOs).
- Game rules live in `domain` only. Controllers hold no rules. PIT mutation testing targets `domain` and `service`.
- Game constants come from the feature file descriptions in `spec/features/`. Define each constant once in `domain`.
- All randomness goes through the `RandomSource` interface (NFR-003). Never call `Math.random`, `new Random()` or `ThreadLocalRandom` in production code. The one exception is `service/SystemSeedSource`, which picks the seed of a game that the player starts without one.
- Money is `int` or `long` cents (NFR-001). No `double`, no `BigDecimal`.
- Acceptance tests: Cucumber-JVM step definitions in `src/test/java/com/lemonade/acceptance/`. They call the running application over HTTP with REST Assured. They read features from `../spec/features` and run only `@api` scenarios. Their NDJSON report goes to `../reports/`.
- Unit tests (JUnit 5) and property tests (jqwik) sit next to the code they test, outside `acceptance/`.
- An API change changes the generated OpenAPI document. `contracts/openapi.yaml` is locked. A difference between the two is a contract change and follows the conflict protocol.

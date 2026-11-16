# Non-functional requirements — release 1

These rules are part of the locked spec. They have no Gherkin scenarios.
Each rule names how it is verified.

## Arithmetic

- **NFR-001** The system shall store and compute all money as whole cents. *Verified by: property tests.*
- **NFR-002** The system shall compute demand with exact integer arithmetic and one rounding down at the end:
  `demand = floor(base × (100 + noise) × (100 + bonus) × (200 − price) / (100 × 100 × 199))`.
  *Verified by: REQ-009 scenarios and property tests.*

## Randomness

- **NFR-003** The system shall take all randomness (weather and demand noise) from one seedable source that tests can replace. *Verified by: REQ-002 scenarios; code review of the injection point.*
- **NFR-004** The system shall choose the weather of each day with equal probability from RAINY, CLOUDY, SUNNY and HOT. *Verified by: unit test of the distribution.*
- **NFR-005** The system shall choose the demand noise of each day with equal probability from the whole percentages −10 to +10. *Verified by: unit test of the distribution.*

## Invariants (property tests)

- **NFR-006** Cash shall never be negative.
- **NFR-007** No inventory quantity shall ever be negative.
- **NFR-008** Cups sold shall never exceed the customers, and shall never exceed the cups the inventory could make at the start of the day run.
- **NFR-009** Ice shall be 0 at the start of every planning stage.
- **NFR-010** A rejected action shall leave the game state unchanged.

## State and access

- **NFR-011** The system shall keep game state in memory. State is lost on restart. No database in release 1.
- **NFR-012** The system shall support many games at the same time. Each game has an opaque ID. Actions on one game shall not change another game.
- **NFR-013** The system shall have no login. Anyone with a game ID can act on that game.

## Errors

- **NFR-014** The system shall report each rejected action with exactly one of these error codes: `GAME_NOT_FOUND`, `GAME_OVER`, `INSUFFICIENT_CASH`, `INVALID_QUANTITY`, `INVALID_RECIPE`, `PRICE_OUT_OF_RANGE`. The HTTP status for each code is defined in `contracts/openapi.yaml`.

## Test tiers

- **NFR-015** `@api` scenarios shall run against the real backend over HTTP, with the random source replaced by a scripted one where a scenario fixes the weather or the noise.
- **NFR-016** `@ui` scenarios shall run the real frontend in a browser against stubbed API responses that conform to `contracts/openapi.yaml`.
- **NFR-017** `@e2e` scenarios shall run the real frontend against the real backend, with no stubs and no scripted random source.

## Out of scope for release 1

Lemon spoilage, inaccurate forecasts, changing supply prices, bulk packs, pitchers and wasted lemonade, a win condition, saved games, accounts, and languages other than English.

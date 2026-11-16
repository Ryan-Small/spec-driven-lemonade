import { readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { cucumberReporter, defineBddProject } from 'playwright-bdd';

// Requirements that are not implemented yet. Their scenarios are left out of the run.
const pending = readFileSync('../tools/trace-check/pending-requirements.txt', 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('REQ-'));
const notPending = pending.length ? ` and not (${pending.map((req) => `@${req}`).join(' or ')})` : '';

// "npm run test:e2e" sets E2E=1. The @e2e tier needs the real backend (NFR-017).
const e2e = process.env['E2E'] === '1';

// Spec tier: the @ui and @e2e scenarios from the locked feature files, one project per layer.
const layer = (name: 'ui' | 'e2e') => ({
  ...defineBddProject({
    name,
    features: '../spec/features/**/*.feature',
    featuresRoot: '../spec/features',
    steps: 'e2e/steps/**/*.ts',
    tags: `@${name}${notPending}`,
  }),
  use: { ...devices['Desktop Chrome'] },
});

const frontend = {
  command: 'npm start',
  url: 'http://localhost:4200',
  reuseExistingServer: !process.env['CI'],
};
const backend = {
  command: './gradlew bootRun',
  cwd: '../backend',
  url: 'http://localhost:8080/v3/api-docs',
  reuseExistingServer: !process.env['CI'],
  timeout: 180_000,
};

export default defineConfig({
  projects: [layer('ui'), layer('e2e')],
  reporter: [
    ['list'],
    cucumberReporter('message', { outputFile: `../reports/cucumber-${e2e ? 'e2e' : 'ui'}.ndjson` }),
  ],
  use: {
    baseURL: 'http://localhost:4200',
    actionTimeout: 5000,
  },
  expect: { timeout: 5000 },
  webServer: e2e ? [backend, frontend] : [frontend],
});

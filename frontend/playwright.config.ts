import { readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { cucumberReporter, defineBddConfig } from 'playwright-bdd';

// Requirements that are not implemented yet. Their scenarios are left out of the run.
const pending = readFileSync('../tools/trace-check/pending-requirements.txt', 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('REQ-'));
const notPending = pending.length ? ` and not (${pending.map((req) => `@${req}`).join(' or ')})` : '';

// Spec tier: the @ui scenarios from the locked feature files.
const testDir = defineBddConfig({
  features: '../spec/features/**/*.feature',
  featuresRoot: '../spec/features',
  steps: 'e2e/steps/**/*.ts',
  tags: `@ui${notPending}`,
});

export default defineConfig({
  testDir,
  reporter: [['list'], cucumberReporter('message', { outputFile: '../reports/cucumber-ui.ndjson' })],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4200',
    actionTimeout: 5000,
  },
  expect: { timeout: 5000 },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
  },
});

import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import type { GameResponse } from '../../src/app/api/model/models';

const { Given, When, Then } = createBdd();

// Typed with the generated client model: a stub that breaks the contract does not compile (NFR-016).
const newGame: GameResponse = {
  id: 'game-1',
  status: 'IN_PROGRESS',
  day: 1,
  totalDays: 7,
  cashCents: 2000,
  inventory: { lemons: 0, sugar: 0, cups: 0, ice: 0 },
  seed: 42,
};

Given('the player is on the start page', async ({ page }) => {
  // A @ui scenario never reaches a real backend: an API call with no stub fails.
  await page.route('**/api/**', (route) => route.abort());
  await page.route('**/api/games', (route) =>
    route.request().method() === 'POST' ? route.fulfill({ status: 201, json: newGame }) : route.fallback(),
  );
  await page.goto('/');
});

When('the player starts a new game', async ({ page }) => {
  await page.getByRole('button', { name: 'Start new game' }).click();
});

Then('the page shows {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible();
});

Then('the page shows cash of {string}', async ({ page }, amount: string) => {
  await expect(page.getByTestId('cash')).toHaveText(amount);
});

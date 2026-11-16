import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideApi } from './api';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideApi('')],
    }).compileComponents();
  });

  it('shows the start button before a game exists', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('button')?.textContent).toContain('Start new game');
    expect(page.textContent).not.toContain('Day');
  });

  it('shows the day and the cash of the game that the backend returns', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    TestBed.inject(HttpTestingController)
      .expectOne({ method: 'POST', url: '/api/games' })
      .flush({
        id: 'game-1',
        status: 'IN_PROGRESS',
        day: 3,
        totalDays: 7,
        cashCents: 1905,
        inventory: { lemons: 0, sugar: 0, cups: 0, ice: 0 },
        seed: 42,
      });
    await fixture.whenStable();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Day 3 of 7');
    expect(page.querySelector('[data-testid="cash"]')?.textContent).toBe('$19.05');
    expect(page.querySelector('button')).toBeNull();
  });
});

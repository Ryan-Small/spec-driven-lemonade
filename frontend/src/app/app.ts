import { Component, inject, signal } from '@angular/core';
import { GameResponse, GamesService } from './api';
import { formatCents } from './format-cents';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly games = inject(GamesService);

  protected readonly game = signal<GameResponse | null>(null);
  protected readonly formatCents = formatCents;

  protected startGame(): void {
    this.games.startGame().subscribe((game) => this.game.set(game));
  }
}

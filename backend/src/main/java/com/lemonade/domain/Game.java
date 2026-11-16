package com.lemonade.domain;

public record Game(String id, GameStatus status, int day, int cashCents, Inventory inventory, long seed) {

    /** REQ-001: a new game is on day 1 with the starting cash and an empty inventory. */
    public static Game start(String id, long seed) {
        return new Game(id, GameStatus.IN_PROGRESS, 1, GameRules.STARTING_CASH_CENTS, Inventory.EMPTY, seed);
    }
}

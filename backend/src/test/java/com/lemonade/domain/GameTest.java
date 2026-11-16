package com.lemonade.domain;

import static org.assertj.core.api.Assertions.assertThat;

import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import org.junit.jupiter.api.Test;

class GameTest {

    @Test
    void aNewGameStartsOnDayOneWithTheStartingCashAndAnEmptyInventory() {
        Game game = Game.start("game-1", 42L);

        assertThat(game).isEqualTo(new Game("game-1", GameStatus.IN_PROGRESS, 1, 2000, new Inventory(0, 0, 0, 0), 42L));
    }

    @Property
    void theSeedNeverChangesTheStartingState(@ForAll long seed) {
        Game game = Game.start("game-1", seed);

        assertThat(game.seed()).isEqualTo(seed);
        assertThat(game.cashCents()).isEqualTo(2000);
        assertThat(game.day()).isEqualTo(1);
        assertThat(game.inventory()).isEqualTo(Inventory.EMPTY);
        assertThat(game.status()).isEqualTo(GameStatus.IN_PROGRESS);
    }
}

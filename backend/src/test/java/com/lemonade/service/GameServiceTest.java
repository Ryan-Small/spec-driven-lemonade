package com.lemonade.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.lemonade.domain.Game;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class GameServiceTest {

    @Test
    void aStartedGameCarriesTheSeedFromTheSeedSource() {
        GameService service = new GameService(() -> 7L);

        Game game = service.startGame();

        assertThat(game).isEqualTo(Game.start(game.id(), 7L));
    }

    @Test
    void eachStartedGameHasItsOwnId() {
        GameService service = new GameService(() -> 7L);

        assertThat(service.startGame().id()).isNotBlank().isNotEqualTo(service.startGame().id());
    }

    @Test
    void systemSeedsVaryAndStayBelowTwoToThePowerOf53() {
        SystemSeedSource source = new SystemSeedSource();

        List<Long> seeds = Stream.generate(source::nextSeed).limit(50).toList();

        assertThat(seeds).allSatisfy(seed -> assertThat(seed).isBetween(0L, (1L << 53) - 1));
        assertThat(seeds).doesNotHaveDuplicates();
    }
}

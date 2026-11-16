package com.lemonade.service;

import com.lemonade.domain.Game;
import com.lemonade.domain.SeedSource;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GameService {

    private final SeedSource seedSource;

    public GameService(SeedSource seedSource) {
        this.seedSource = seedSource;
    }

    public Game startGame() {
        return Game.start(UUID.randomUUID().toString(), seedSource.nextSeed());
    }
}

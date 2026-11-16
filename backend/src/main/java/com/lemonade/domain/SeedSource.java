package com.lemonade.domain;

/** Chooses the seed of a game that the player starts without one. */
public interface SeedSource {

    long nextSeed();
}

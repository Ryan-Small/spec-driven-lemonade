package com.lemonade.service;

import com.lemonade.domain.SeedSource;
import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/** The one place where the system takes entropy from the machine. */
@Component
public class SystemSeedSource implements SeedSource {

    /** Seeds stay below 2^53 so that a JavaScript client reads them without loss. */
    static final long SEED_BOUND = 1L << 53;

    private final SecureRandom random = new SecureRandom();

    @Override
    public long nextSeed() {
        return random.nextLong(SEED_BOUND);
    }
}

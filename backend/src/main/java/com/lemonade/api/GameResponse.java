package com.lemonade.api;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import com.lemonade.domain.Game;
import com.lemonade.domain.GameRules;
import com.lemonade.domain.GameStatus;
import io.swagger.v3.oas.annotations.media.Schema;

public record GameResponse(
    @Schema(requiredMode = REQUIRED) String id,
    @Schema(requiredMode = REQUIRED) GameStatus status,
    @Schema(requiredMode = REQUIRED) int day,
    @Schema(requiredMode = REQUIRED) int totalDays,
    @Schema(requiredMode = REQUIRED) int cashCents,
    @Schema(requiredMode = REQUIRED) InventoryResponse inventory,
    @Schema(requiredMode = REQUIRED) long seed) {

    static GameResponse from(Game game) {
        return new GameResponse(
            game.id(),
            game.status(),
            game.day(),
            GameRules.TOTAL_DAYS,
            game.cashCents(),
            InventoryResponse.from(game.inventory()),
            game.seed());
    }
}

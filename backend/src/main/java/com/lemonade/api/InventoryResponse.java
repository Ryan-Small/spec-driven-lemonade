package com.lemonade.api;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

import com.lemonade.domain.Inventory;
import io.swagger.v3.oas.annotations.media.Schema;

public record InventoryResponse(
    @Schema(requiredMode = REQUIRED) int lemons,
    @Schema(requiredMode = REQUIRED) int sugar,
    @Schema(requiredMode = REQUIRED) int cups,
    @Schema(requiredMode = REQUIRED) int ice) {

    static InventoryResponse from(Inventory inventory) {
        return new InventoryResponse(inventory.lemons(), inventory.sugar(), inventory.cups(), inventory.ice());
    }
}

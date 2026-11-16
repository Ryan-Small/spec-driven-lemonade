package com.lemonade.domain;

public record Inventory(int lemons, int sugar, int cups, int ice) {

    public static final Inventory EMPTY = new Inventory(0, 0, 0, 0);
}

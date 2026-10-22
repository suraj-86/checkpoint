package com.checkpoint.reward.entity;

public enum BoostType {
    PLUS_5("+5 XP"),
    PLUS_10("+10 XP"),
    PCT_5("+5% XP"),
    PCT_10("+10% XP");

    private final String label;

    BoostType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public boolean isPercent() {
        return this == PCT_5 || this == PCT_10;
    }

    public int amount() {
        return switch (this) {
            case PLUS_5, PCT_5 -> 5;
            case PLUS_10, PCT_10 -> 10;
        };
    }
}

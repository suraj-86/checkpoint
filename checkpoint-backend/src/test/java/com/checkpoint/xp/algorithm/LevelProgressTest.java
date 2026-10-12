package com.checkpoint.xp.algorithm;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LevelProgressTest {

    private final LevelCalculator calc = new LevelCalculator();

    @Test
    void zeroXpIsLevelZeroAtZeroPercent() {
        LevelProgress p = calc.progressFor(0);
        assertThat(p.level()).isZero();
        assertThat(p.percent()).isZero();
        assertThat(p.nextLevelXp()).isEqualTo(1000);
        assertThat(p.xpToNextLevel()).isEqualTo(1000);
    }

    @Test
    void partialProgressIsFloored() {
        LevelProgress p = calc.progressFor(237);
        assertThat(p.percent()).isEqualTo(23);
        assertThat(p.xpIntoLevel()).isEqualTo(237);
        assertThat(p.xpToNextLevel()).isEqualTo(763);
    }

    @Test
    void exactThresholdStartsNewLevelAtZeroPercent() {
        LevelProgress p = calc.progressFor(1000);
        assertThat(p.level()).isEqualTo(1);
        assertThat(p.percent()).isZero();
        assertThat(p.nextLevelXp()).isEqualTo(2500);
    }

    @Test
    void midLevelIsFiftyPercent() {
        assertThat(calc.progressFor(1750).percent()).isEqualTo(50);
    }

    @Test
    void justBelowThresholdIsNinetyNine() {
        assertThat(calc.progressFor(999).percent()).isEqualTo(99);
    }

    @Test
    void maxLevelHasNoNextLevel() {
        LevelProgress p = calc.progressFor(250000);
        assertThat(p.level()).isEqualTo(20);
        assertThat(p.nextLevelXp()).isNull();
        assertThat(p.xpToNextLevel()).isNull();
        assertThat(p.percent()).isEqualTo(100);
    }

    @Test
    void negativeXpIsTreatedAsZero() {
        LevelProgress p = calc.progressFor(-50);
        assertThat(p.level()).isZero();
        assertThat(p.percent()).isZero();
        assertThat(p.xpToNextLevel()).isEqualTo(1000);
    }
}

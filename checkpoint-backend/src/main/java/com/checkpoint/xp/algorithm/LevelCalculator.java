package com.checkpoint.xp.algorithm;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;

@Component
public class LevelCalculator {

    public static final int MAX_LEVEL = 20;

    private static final NavigableMap<Integer, Integer> XP_TO_LEVEL = buildXpToLevel();

    private static final Map<Integer, Integer> LEVEL_TO_THRESHOLD = buildLevelToThreshold();

    private static final Map<Integer, int[]> GAIN_LOSS = buildGainLoss();

    private static NavigableMap<Integer, Integer> buildXpToLevel() {
        NavigableMap<Integer, Integer> m = new TreeMap<>();
        for (Map.Entry<Integer, Integer> e : buildLevelToThreshold().entrySet()) {
            m.put(e.getValue(), e.getKey());
        }
        return m;
    }

    private static Map<Integer, Integer> buildLevelToThreshold() {
        Map<Integer, Integer> m = new TreeMap<>();
        m.put(0, 0);
        m.put(1, 1_000);
        m.put(2, 2_500);
        m.put(3, 4_500);
        m.put(4, 7_000);
        m.put(5, 10_000);
        m.put(6, 14_000);
        m.put(7, 19_000);
        m.put(8, 25_000);
        m.put(9, 32_000);
        m.put(10, 40_000);
        m.put(11, 49_000);
        m.put(12, 59_000);
        m.put(13, 70_000);
        m.put(14, 82_000);
        m.put(15, 95_000);
        m.put(16, 110_000);
        m.put(17, 127_000);
        m.put(18, 146_000);
        m.put(19, 167_000);
        m.put(20, 190_000);
        return m;
    }

    private static Map<Integer, int[]> buildGainLoss() {
        Map<Integer, int[]> m = new TreeMap<>();
        m.put(1, new int[]{100, -10});
        m.put(2, new int[]{90, -12});
        m.put(3, new int[]{80, -15});
        m.put(4, new int[]{70, -18});
        m.put(5, new int[]{65, -20});
        m.put(6, new int[]{60, -22});
        m.put(7, new int[]{55, -24});
        m.put(8, new int[]{50, -26});
        m.put(9, new int[]{48, -28});
        m.put(10, new int[]{45, -30});
        m.put(11, new int[]{42, -30});
        m.put(12, new int[]{40, -32});
        m.put(13, new int[]{38, -34});
        m.put(14, new int[]{35, -35});
        m.put(15, new int[]{33, -36});
        m.put(16, new int[]{31, -37});
        m.put(17, new int[]{29, -38});
        m.put(18, new int[]{27, -39});
        m.put(19, new int[]{26, -40});
        m.put(20, new int[]{25, -40});
        return m;
    }

    public int levelForXp(int totalXp) {
        if (totalXp <= 0) {
            return 0;
        }
        Map.Entry<Integer, Integer> entry = XP_TO_LEVEL.floorEntry(totalXp);
        int level = entry != null ? entry.getValue() : 0;
        return Math.min(level, MAX_LEVEL);
    }

    public int thresholdForLevel(int level) {
        Integer t = LEVEL_TO_THRESHOLD.get(level);
        if (t == null) {
            throw new IllegalArgumentException("No threshold defined for level " + level);
        }
        return t;
    }

    public int[] gainLossForLevel(int level) {
        int lookupLevel = level <= 0 ? 1 : level;
        int[] range = GAIN_LOSS.get(lookupLevel);
        if (range == null) {
            throw new IllegalArgumentException("No gain/loss range defined for level " + level);
        }
        return range;
    }
}
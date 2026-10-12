package com.checkpoint.xp.algorithm;
public record LevelProgress(
        int level,
        int currentLevelXp,
        Integer nextLevelXp,
        int xpIntoLevel,
        Integer xpToNextLevel,
        int percent
) {
}

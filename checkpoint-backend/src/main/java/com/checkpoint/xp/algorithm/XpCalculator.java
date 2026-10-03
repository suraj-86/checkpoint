package com.checkpoint.xp.algorithm;

import com.checkpoint.question.entity.Difficulty;
import com.checkpoint.practice.entity.SessionType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class XpCalculator {

    private final LevelCalculator levelCalculator;

    public XpCalculator(LevelCalculator levelCalculator) {
        this.levelCalculator = levelCalculator;
    }

    public static double weightFor(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> 0.80;
            case MEDIUM -> 1.00;
            case HARD -> 1.25;
            case EXPERT -> 1.50;
        };
    }

    public record AnsweredQuestion(Difficulty difficulty, boolean correct) {
    }

    public enum PerformanceBand {
        EXCELLENT(90, 1.00),
        GOOD(75, 0.70),
        FAIR(60, 0.35),
        WEAK(40, -0.25),
        POOR(0, -1.00);

        public final int minPercentInclusive;
        public final double multiplier;

        PerformanceBand(int minPercentInclusive, double multiplier) {
            this.minPercentInclusive = minPercentInclusive;
            this.multiplier = multiplier;
        }
    }

    public record Result(
            double performancePercent,
            PerformanceBand band,
            int currentLevel,
            int xpChange
    ) {
    }

    public Result calculate(List<AnsweredQuestion> answered, int totalXpBefore, SessionType sessionType) {
        double availableWeight = answered.stream().mapToDouble(a -> weightFor(a.difficulty())).sum();
        double earnedWeight = answered.stream()
                .filter(AnsweredQuestion::correct)
                .mapToDouble(a -> weightFor(a.difficulty()))
                .sum();

        double performancePercent = availableWeight == 0 ? 0.0 : (earnedWeight / availableWeight) * 100;
        PerformanceBand band = bandFor(performancePercent);

        int level = levelCalculator.levelForXp(totalXpBefore);
        int[] gainLoss = levelCalculator.gainLossForLevel(level);
        int maxGain = gainLoss[0];
        int maxLoss = gainLoss[1];

        double rawXp = band.multiplier >= 0
                ? maxGain * band.multiplier
                : maxLoss * Math.abs(band.multiplier);

        if (sessionType == SessionType.FAST) {
            rawXp *= 0.25;
        }

        int xpChange = (int) Math.round(rawXp);

        return new Result(performancePercent, band, level, xpChange);
    }

    private PerformanceBand bandFor(double performancePercent) {
        for (PerformanceBand band : PerformanceBand.values()) {
            if (performancePercent >= band.minPercentInclusive) {
                return band;
            }
        }
        return PerformanceBand.POOR;
    }
}

package com.checkpoint.progress.service;

import com.checkpoint.progress.dto.MasteryTier;
import com.checkpoint.progress.dto.TopicMastery;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class MasteryServiceTest {

    @Test
    void noAnswersMeansNotStarted() {
        assertThat(MasteryService.tierFor(0, 0)).isEqualTo(MasteryTier.NOT_STARTED);
    }

    @Test
    void fewAnswersAreOnlyStartedWhateverTheScore() {
        assertThat(MasteryService.tierFor(1, 0)).isEqualTo(MasteryTier.STARTED);
        assertThat(MasteryService.tierFor(2, 2)).isEqualTo(MasteryTier.STARTED);
    }

    @Test
    void tiersFollowAccuracyBoundaries() {
        assertThat(MasteryService.tierFor(10, 8)).isEqualTo(MasteryTier.STRONG);
        assertThat(MasteryService.tierFor(10, 7)).isEqualTo(MasteryTier.GROWING);
        assertThat(MasteryService.tierFor(10, 6)).isEqualTo(MasteryTier.GROWING);
        assertThat(MasteryService.tierFor(10, 5)).isEqualTo(MasteryTier.NEEDS_WORK);
    }

    @Test
    void percentHandlesZeroAndRounds() {
        assertThat(MasteryService.percent(0, 0)).isZero();
        assertThat(MasteryService.percent(2, 3)).isEqualTo(67);
    }

    @Test
    void weakestKeepsOnlyNeedsWorkLowestAccuracyFirstAndCapsTheList() {
        List<TopicMastery> topics = List.of(
                topic("Strong", 90, 10, MasteryTier.STRONG),
                topic("Low", 20, 10, MasteryTier.NEEDS_WORK),
                topic("Lower", 10, 5, MasteryTier.NEEDS_WORK),
                topic("Tie-few", 40, 4, MasteryTier.NEEDS_WORK),
                topic("Tie-many", 40, 9, MasteryTier.NEEDS_WORK),
                topic("Fresh", 0, 0, MasteryTier.NOT_STARTED));

        List<TopicMastery> weakest = MasteryService.weakest(topics, 3);

        assertThat(weakest).extracting(TopicMastery::topicName).containsExactly("Lower", "Low", "Tie-many");
    }

    private static TopicMastery topic(String name, int accuracy, long answers, MasteryTier tier) {
        return new TopicMastery(UUID.randomUUID(), name, UUID.randomUUID(), "Subject", 10, answers, answers,
                answers * accuracy / 100, accuracy, 0, tier);
    }
}

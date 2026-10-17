package com.checkpoint.progress.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SessionHistoryServiceTest {

    @Test
    void escapesLikeWildcardsSoTheyAreSearchedLiterally() {
        assertThat(SessionHistoryService.escapeLike("100%_done")).isEqualTo("100\\%\\_done");
        assertThat(SessionHistoryService.escapeLike("a\\b")).isEqualTo("a\\\\b");
        assertThat(SessionHistoryService.escapeLike("plain")).isEqualTo("plain");
    }
}

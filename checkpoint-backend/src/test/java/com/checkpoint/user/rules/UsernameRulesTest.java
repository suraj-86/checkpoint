package com.checkpoint.user.rules;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class UsernameRulesTest {

    @ParameterizedTest
    @ValueSource(strings = {"abc", "Suraj86", "a.b", "john_doe", "a1.b2_c3", "ABCDEFGHIJ0123456789"})
    void acceptsValidUsernames(String name) {
        assertThat(UsernameRules.check(name)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"ab", "ABCDEFGHIJ01234567890", "has space", "tab\tname", "dash-name", "emoji😀x",
            ".lead", "trail.", "_lead", "trail_", "dou..ble", "dou__ble", "a._b"})
    void rejectsInvalidUsernames(String name) {
        assertThat(UsernameRules.check(name)).isPresent();
    }

    @ParameterizedTest
    @ValueSource(strings = {"admin", "Admin", "ROOT", "Checkpoint", "support"})
    void rejectsReservedUsernames(String name) {
        assertThat(UsernameRules.check(name)).hasValueSatisfying(v -> assertThat(v.code()).isEqualTo("RESERVED"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"has space", "dash-name"})
    void explainsWhichRuleWasBroken(String name) {
        assertThat(UsernameRules.check(name)).hasValueSatisfying(v -> assertThat(v.code()).isEqualTo("INVALID_CHARACTERS"));
    }
}

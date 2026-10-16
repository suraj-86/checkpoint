package com.checkpoint.user.rules;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * The single source of truth for what a username may look like.
 * The frontend mirrors these rules in src/lib/username.ts.
 */
public final class UsernameRules {

    public static final int MIN_LENGTH = 3;
    public static final int MAX_LENGTH = 20;

    /** 3-20 chars; letters/digits; single dots or underscores allowed only between them. */
    public static final String PATTERN = "^(?=.{3,20}$)[A-Za-z0-9]+([._][A-Za-z0-9]+)*$";
    public static final String PATTERN_MESSAGE =
            "Use 3-20 letters or numbers; dots and underscores only between them. No spaces.";

    private static final Pattern FULL = Pattern.compile(PATTERN);
    private static final Pattern ALLOWED_CHARS = Pattern.compile("^[A-Za-z0-9._]+$");

    private static final Set<String> RESERVED = Set.of(
            "admin", "administrator", "root", "system", "support", "help", "checkpoint",
            "moderator", "staff", "null", "undefined", "me", "api", "login", "register");

    private UsernameRules() {
    }

    public record Violation(String code, String message) {
    }

    public static Optional<Violation> check(String username) {
        if (username == null || username.length() < MIN_LENGTH || username.length() > MAX_LENGTH) {
            return Optional.of(new Violation("INVALID_LENGTH",
                    "Username must be " + MIN_LENGTH + "-" + MAX_LENGTH + " characters."));
        }
        if (!ALLOWED_CHARS.matcher(username).matches()) {
            return Optional.of(new Violation("INVALID_CHARACTERS",
                    "Only letters, numbers, dots and underscores are allowed. No spaces."));
        }
        if (!FULL.matcher(username).matches()) {
            return Optional.of(new Violation("INVALID_STRUCTURE",
                    "Dots and underscores must sit between letters or numbers (not at the start, the end, or doubled)."));
        }
        if (isReserved(username)) {
            return Optional.of(new Violation("RESERVED", "That username is reserved."));
        }
        return Optional.empty();
    }

    public static boolean isReserved(String username) {
        return username != null && RESERVED.contains(username.toLowerCase(Locale.ROOT));
    }
}

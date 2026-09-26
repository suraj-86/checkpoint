package com.checkpoint.common.exception;

/**
 * Thrown on any login failure. Deliberately generic per
 * docs/06-Authentication-and-Security.md section 10 — never reveals
 * whether the username or the password was wrong.
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Invalid username or password.");
    }
}

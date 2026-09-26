package com.checkpoint.common.exception;

/** Thrown when too many failed login attempts have locked an account temporarily. */
public class AccountLockedException extends RuntimeException {
    public AccountLockedException() {
        super("Too many failed login attempts. Please try again in 15 minutes.");
    }
}

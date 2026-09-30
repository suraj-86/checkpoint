package com.checkpoint.common.exception;

public class AccountLockedException extends RuntimeException {
    public AccountLockedException() {
        super("Too many failed login attempts. Please try again in 15 minutes.");
    }
}

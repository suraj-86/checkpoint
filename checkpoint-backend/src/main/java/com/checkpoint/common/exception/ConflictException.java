package com.checkpoint.common.exception;

/** Thrown when a registration request collides with an existing username/email. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}

package com.checkpoint.user.entity;

/**
 * The two roles in Checkpoint V1. There is exactly one ADMIN, configured
 * outside the public registration flow (docs/06-Authentication-and-Security.md, section 3).
 */
public enum Role {
    STUDENT,
    ADMIN
}

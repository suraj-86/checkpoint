package com.checkpoint.auth.config;

import com.checkpoint.user.entity.Role;
import com.checkpoint.user.entity.User;
import com.checkpoint.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * The administrator is configured outside the public signup flow
 * (docs/06-Authentication-and-Security.md section 3) — never created via
 * POST /api/auth/register. This runs once at startup: if no user with the
 * configured admin username exists yet, it creates one from environment
 * config. Safe to leave running on every restart — it's a no-op once the
 * admin already exists.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final String adminUsername;
    private final String adminEmail;
    private final String adminPassword;

    public AdminBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${checkpoint.admin.username}") String adminUsername,
            @Value("${checkpoint.admin.email}") String adminEmail,
            @Value("${checkpoint.admin.password}") String adminPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername(adminUsername)) {
            return;
        }

        User admin = User.builder()
                .username(adminUsername)
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);
        log.info("Created administrator account '{}'. Change the default password before any real deployment.", adminUsername);
    }
}

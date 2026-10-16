package com.checkpoint.auth.controller;

import com.checkpoint.auth.dto.AuthResponse;
import com.checkpoint.auth.dto.LoginRequest;
import com.checkpoint.auth.dto.RegisterRequest;
import com.checkpoint.auth.service.AuthService;
import com.checkpoint.auth.security.CheckpointUserDetails;
import com.checkpoint.user.dto.UsernameCheckResponse;
import com.checkpoint.user.service.UsernameAvailabilityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UsernameAvailabilityService usernameAvailabilityService;

    public AuthController(AuthService authService, UsernameAvailabilityService usernameAvailabilityService) {
        this.authService = authService;
        this.usernameAvailabilityService = usernameAvailabilityService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @GetMapping("/username-available")
    public UsernameCheckResponse usernameAvailable(
            @RequestParam("username") String username,
            @AuthenticationPrincipal CheckpointUserDetails principal,
            HttpServletRequest request
    ) {
        UUID callerId = principal != null ? principal.getUser().getId() : null;
        String key = callerId != null ? "u:" + callerId : "ip:" + clientIp(request);
        return usernameAvailabilityService.check(username, callerId, key);
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}

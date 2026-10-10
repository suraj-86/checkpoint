package com.checkpoint.account.controller;

import com.checkpoint.account.dto.AccountResponse;
import com.checkpoint.account.dto.ChangePasswordRequest;
import com.checkpoint.account.dto.UpdateProfileRequest;
import com.checkpoint.account.service.AccountService;
import com.checkpoint.auth.security.CheckpointUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public AccountResponse get(@AuthenticationPrincipal CheckpointUserDetails principal) {
        return accountService.get(principal.getUser().getId());
    }

    @PutMapping("/profile")
    public AccountResponse updateProfile(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return accountService.updateProfile(principal.getUser().getId(), request);
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal CheckpointUserDetails principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        accountService.changePassword(principal.getUser().getId(), request);
        return ResponseEntity.noContent().build();
    }
}

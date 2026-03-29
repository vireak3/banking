package com.banking.account.controller;

import com.banking.account.dto.AccountResponse;
import com.banking.account.dto.AdjustBalanceRequest;
import com.banking.account.dto.ApiResponse;
import com.banking.account.dto.CreateAccountRequest;
import com.banking.account.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/accounts")
@Tag(name = "Account Management", description = "Account creation, retrieval, and balance management")
@SecurityRequirement(name = "Bearer Authentication")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @Operation(summary = "Create new account", description = "Creates a new account with specified user ID and initial balance")
    public ResponseEntity<ApiResponse<AccountResponse>> create(@Valid @RequestBody CreateAccountRequest request) {
        AccountResponse response = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Account created"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve account by ID", description = "Fetches account details including current balance")
    public ResponseEntity<ApiResponse<AccountResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(accountService.getAccount(id), "Account fetched"));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "List accounts by user", description = "Retrieves all accounts for a specific user")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(accountService.getByUserId(userId), "Accounts fetched"));
    }

    @PutMapping("/{id}/balance")
    @Operation(summary = "Adjust account balance", description = "Internal endpoint to adjust account balance (used during transfers)")
    public ResponseEntity<ApiResponse<AccountResponse>> adjustBalance(
        @PathVariable Long id,
        @Valid @RequestBody AdjustBalanceRequest request
    ) {
        AccountResponse response = accountService.adjustBalance(id, request.getDelta());
        return ResponseEntity.ok(ApiResponse.success(response, "Balance updated"));
    }
}

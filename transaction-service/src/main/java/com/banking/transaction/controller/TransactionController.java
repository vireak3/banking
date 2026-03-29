package com.banking.transaction.controller;

import com.banking.transaction.dto.ApiResponse;
import com.banking.transaction.dto.TransferRequest;
import com.banking.transaction.dto.TransferResponse;
import com.banking.transaction.service.TransactionService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/transactions")
@Tag(name = "Transaction Management", description = "Fund transfers and transaction history")
@SecurityRequirement(name = "Bearer Authentication")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/transfer")
    @Operation(summary = "Execute transfer", description = "Atomically transfer funds between two accounts and record blockchain hash")
    public ResponseEntity<ApiResponse<TransferResponse>> transfer(@Valid @RequestBody TransferRequest request) {
        TransferResponse response = transactionService.transfer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Transfer successful"));
    }

    @GetMapping("/{accountId}")
    @Operation(summary = "List account transactions", description = "Retrieves all transactions for an account")
    public ResponseEntity<ApiResponse<List<TransferResponse>>> byAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.findByAccount(accountId), "Transactions fetched"));
    }
}

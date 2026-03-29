package com.banking.blockchain.controller;

import com.banking.blockchain.dto.ApiResponse;
import com.banking.blockchain.dto.HashRequest;
import com.banking.blockchain.dto.HashResponse;
import com.banking.blockchain.dto.VerifyResponse;
import com.banking.blockchain.service.BlockchainLedgerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/blockchain")
@Tag(name = "Blockchain Ledger", description = "Transaction hash generation and verification")
@SecurityRequirement(name = "Bearer Authentication")
public class BlockchainController {

    private final BlockchainLedgerService blockchainLedgerService;

    public BlockchainController(BlockchainLedgerService blockchainLedgerService) {
        this.blockchainLedgerService = blockchainLedgerService;
    }

    @PostMapping("/hash")
    @Operation(summary = "Generate and store hash", description = "Creates SHA-256 hash of transaction and stores in ledger")
    public ResponseEntity<ApiResponse<HashResponse>> hash(@Valid @RequestBody HashRequest request) {
        String hash = blockchainLedgerService.hashAndStore(request);
        return ResponseEntity.ok(ApiResponse.success(new HashResponse(hash), "Hash stored successfully"));
    }

    @GetMapping("/verify/{hash}")
    @Operation(summary = "Verify hash", description = "Verifies if a hash exists in the blockchain ledger")
    public ResponseEntity<ApiResponse<VerifyResponse>> verify(@PathVariable String hash) {
        return ResponseEntity.ok(ApiResponse.success(blockchainLedgerService.verify(hash), "Hash verification successful"));
    }
}

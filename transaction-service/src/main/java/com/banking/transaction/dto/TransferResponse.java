package com.banking.transaction.dto;

import com.banking.transaction.entity.TransactionStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record TransferResponse(
    Long id,
    String fromAccount,
    String toAccount,
    BigDecimal amount,
    String blockchainHash,
    TransactionStatus status,
    Instant createdAt
) {
}

package com.banking.transaction.dto;

import com.banking.transaction.entity.TransactionStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record TransferResponse(
    Long id,
    Long fromAccount,
    Long toAccount,
    BigDecimal amount,
    String blockchainHash,
    TransactionStatus status,
    Instant createdAt
) {
}

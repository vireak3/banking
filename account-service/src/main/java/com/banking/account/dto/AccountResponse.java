package com.banking.account.dto;

import java.math.BigDecimal;

public record AccountResponse(Long id, Long userId, BigDecimal balance) {
}

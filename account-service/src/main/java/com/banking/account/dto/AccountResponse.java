package com.banking.account.dto;

import java.math.BigDecimal;

public record AccountResponse(String id, Long userId, BigDecimal balance) {
}

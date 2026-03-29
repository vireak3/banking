package com.banking.transaction.dto;

import java.math.BigDecimal;

public record AdjustBalanceRequest(BigDecimal delta) {
}

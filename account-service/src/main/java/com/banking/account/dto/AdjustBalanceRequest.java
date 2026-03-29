package com.banking.account.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class AdjustBalanceRequest {

    @NotNull
    private BigDecimal delta;

    public BigDecimal getDelta() {
        return delta;
    }

    public void setDelta(BigDecimal delta) {
        this.delta = delta;
    }
}

package com.banking.blockchain.dto;

public record VerifyResponse(boolean valid, String hash, String payload) {
}

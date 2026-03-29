package com.banking.blockchain.service;

import com.banking.blockchain.dto.HashRequest;
import com.banking.blockchain.dto.VerifyResponse;
import com.banking.blockchain.exception.NotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class BlockchainLedgerService {

    private final ObjectMapper objectMapper;
    private final Map<String, String> ledger = new ConcurrentHashMap<>();

    public BlockchainLedgerService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String hashAndStore(HashRequest request) {
        String payload = serializePayload(request);
        String hash = sha256(payload);
        ledger.put(hash, payload);
        return hash;
    }

    public VerifyResponse verify(String hash) {
        String payload = ledger.get(hash);
        if (payload == null) {
            throw new NotFoundException("Hash not found in ledger");
        }
        return new VerifyResponse(true, hash, payload);
    }

    private String serializePayload(HashRequest request) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                "from", request.getFrom(),
                "to", request.getTo(),
                "amount", request.getAmount(),
                "timestamp", request.getTimestamp()
            ));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize payload", ex);
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to create hash", ex);
        }
    }
}

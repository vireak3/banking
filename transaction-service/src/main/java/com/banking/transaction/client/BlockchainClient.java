package com.banking.transaction.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.client.RestTemplate;

@Component
public class BlockchainClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String blockchainServiceUrl;

    public BlockchainClient(
        RestTemplate restTemplate,
        ObjectMapper objectMapper,
        @Value("${services.blockchain-url}") String blockchainServiceUrl
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.blockchainServiceUrl = blockchainServiceUrl;
    }

    public String generateHash(Long from, Long to, BigDecimal amount, Instant timestamp) {
        String url = blockchainServiceUrl + "/blockchain/hash";
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(Map.of(
            "from", String.valueOf(from),
            "to", String.valueOf(to),
            "amount", amount,
            "timestamp", timestamp.toEpochMilli()
        ), authHeaders());

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        JsonNode root = parse(response.getBody());
        return root.path("data").path("hash").asText();
    }

    private JsonNode parse(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid blockchain service response", ex);
        }
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            String auth = attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
            if (auth != null && !auth.isBlank()) {
                headers.set(HttpHeaders.AUTHORIZATION, auth);
            }
        }
        return headers;
    }
}

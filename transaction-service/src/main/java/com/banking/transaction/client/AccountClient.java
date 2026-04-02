package com.banking.transaction.client;

import com.banking.transaction.dto.AdjustBalanceRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.springframework.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.client.RestTemplate;

@Component
public class AccountClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String accountServiceUrl;

    public AccountClient(
        RestTemplate restTemplate,
        ObjectMapper objectMapper,
        @Value("${services.account-url}") String accountServiceUrl
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.accountServiceUrl = accountServiceUrl;
    }

    public BigDecimal fetchBalance(String accountId) {
        String url = accountServiceUrl + "/accounts/" + accountId;
        HttpEntity<Void> request = new HttpEntity<>(authHeaders());
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
        JsonNode root = parse(response.getBody());
        return root.path("data").path("balance").decimalValue();
    }

    public void adjustBalance(String accountId, BigDecimal delta) {
        String url = accountServiceUrl + "/accounts/" + accountId + "/balance";
        HttpEntity<AdjustBalanceRequest> request = new HttpEntity<>(new AdjustBalanceRequest(delta), authHeaders());
        restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
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

    private JsonNode parse(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid account service response", ex);
        }
    }
}

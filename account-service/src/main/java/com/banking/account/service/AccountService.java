package com.banking.account.service;

import com.banking.account.dto.AccountResponse;
import com.banking.account.dto.CreateAccountRequest;
import com.banking.account.entity.Account;
import com.banking.account.exception.BusinessException;
import com.banking.account.exception.NotFoundException;
import com.banking.account.repository.AccountRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        if (request.getBalance().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Balance must not be negative");
        }

        Account account = new Account();
        account.setUserId(request.getUserId());
        account.setBalance(request.getBalance());
        Account saved = accountRepository.save(account);
        return toResponse(saved);
    }

    public AccountResponse getAccount(Long id) {
        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Account not found: " + id));
        return toResponse(account);
    }

    public List<AccountResponse> getByUserId(Long userId) {
        return accountRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AccountResponse adjustBalance(Long id, BigDecimal delta) {
        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Account not found: " + id));

        BigDecimal newBalance = account.getBalance().add(delta);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Insufficient funds. Balance cannot be negative");
        }

        account.setBalance(newBalance);
        Account updated = accountRepository.save(account);
        return toResponse(updated);
    }

    private AccountResponse toResponse(Account account) {
        return new AccountResponse(account.getId(), account.getUserId(), account.getBalance());
    }
}

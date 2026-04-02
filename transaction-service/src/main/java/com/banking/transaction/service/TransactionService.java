package com.banking.transaction.service;

import com.banking.transaction.client.AccountClient;
import com.banking.transaction.client.BlockchainClient;
import com.banking.transaction.dto.TransferRequest;
import com.banking.transaction.dto.TransferResponse;
import com.banking.transaction.entity.BankTransaction;
import com.banking.transaction.entity.TransactionStatus;
import com.banking.transaction.exception.BusinessException;
import com.banking.transaction.repository.BankTransactionRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TransactionService {

    private final BankTransactionRepository repository;
    private final AccountClient accountClient;
    private final BlockchainClient blockchainClient;

    public TransactionService(
        BankTransactionRepository repository,
        AccountClient accountClient,
        BlockchainClient blockchainClient
    ) {
        this.repository = repository;
        this.accountClient = accountClient;
        this.blockchainClient = blockchainClient;
    }

    @Transactional
    public TransferResponse transfer(TransferRequest request) {
        if (request.getFromAccount().equals(request.getToAccount())) {
            throw new BusinessException("Sender and receiver account must be different");
        }

        BigDecimal senderBalance = accountClient.fetchBalance(request.getFromAccount());
        if (senderBalance.compareTo(request.getAmount()) < 0) {
            throw new BusinessException("Insufficient balance");
        }

        BankTransaction tx = new BankTransaction();
        tx.setFromAccount(request.getFromAccount());
        tx.setToAccount(request.getToAccount());
        tx.setAmount(request.getAmount());
        tx.setStatus(TransactionStatus.PENDING);
        repository.save(tx);

        accountClient.adjustBalance(request.getFromAccount(), request.getAmount().negate());
        accountClient.adjustBalance(request.getToAccount(), request.getAmount());

        String hash = blockchainClient.generateHash(
            request.getFromAccount(),
            request.getToAccount(),
            request.getAmount(),
            Instant.now()
        );

        tx.setBlockchainHash(hash);
        tx.setStatus(TransactionStatus.COMPLETED);
        BankTransaction saved = repository.save(tx);

        return toResponse(saved);
    }

    public List<TransferResponse> findByAccount(String accountId) {
        return repository.findByFromAccountOrToAccountOrderByCreatedAtDesc(accountId, accountId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private TransferResponse toResponse(BankTransaction tx) {
        return new TransferResponse(
            tx.getId(),
            tx.getFromAccount(),
            tx.getToAccount(),
            tx.getAmount(),
            tx.getBlockchainHash(),
            tx.getStatus(),
            tx.getCreatedAt()
        );
    }
}

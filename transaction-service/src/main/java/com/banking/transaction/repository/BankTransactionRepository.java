package com.banking.transaction.repository;

import com.banking.transaction.entity.BankTransaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankTransactionRepository extends JpaRepository<BankTransaction, Long> {
    List<BankTransaction> findByFromAccountOrToAccountOrderByCreatedAtDesc(String fromAccount, String toAccount);
}

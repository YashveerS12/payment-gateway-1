package com.paymentgateway.payment.repository;

import com.paymentgateway.payment.model.Payment;
import com.paymentgateway.payment.model.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    // Find payment by idempotency key
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    // Find all payments for a merchant (paginated)
    Page<Payment> findByMerchantId(UUID merchantId, Pageable pageable);

    // Find payments by merchant and status
    Page<Payment> findByMerchantIdAndStatus(UUID merchantId,
                                            PaymentStatus status,
                                            Pageable pageable);

    // Check if idempotency key already exists
    boolean existsByIdempotencyKey(String idempotencyKey);
}
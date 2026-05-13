package com.paymentgateway.payment.service;

import com.paymentgateway.payment.adapter.BankAdapter;
import com.paymentgateway.payment.adapter.BankAdapterFactory;
import com.paymentgateway.payment.adapter.BankResponse;
import com.paymentgateway.payment.dto.PaymentRequest;
import com.paymentgateway.payment.dto.PaymentResponse;
import com.paymentgateway.payment.dto.PaymentStatusResponse;
import com.paymentgateway.payment.kafka.PaymentEventPublisher;
import com.paymentgateway.payment.model.Payment;
import com.paymentgateway.payment.model.PaymentStatus;
import com.paymentgateway.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BankAdapterFactory bankAdapterFactory;
    private final RedisTemplate<String, String> redisTemplate;
    private final PaymentEventPublisher eventPublisher;

    private static final String IDEMPOTENCY_PREFIX = "idempotency:";
    private static final Duration IDEMPOTENCY_TTL = Duration.ofHours(24);

    // ─────────────────────────────────────────
    // INITIATE PAYMENT
    // ─────────────────────────────────────────
    @Transactional
    public PaymentResponse initiatePayment(UUID merchantId,
                                           String idempotencyKey,
                                           PaymentRequest request) {

        // Step 1 — Check idempotency key in Redis
        String redisKey = IDEMPOTENCY_PREFIX + idempotencyKey;
        String cachedPaymentId = redisTemplate.opsForValue().get(redisKey);

        if (cachedPaymentId != null) {
            log.info("Duplicate request detected for key: {}", idempotencyKey);
            Optional<Payment> cached = paymentRepository.findById(UUID.fromString(cachedPaymentId));

            if (cached.isPresent()) {
                // Payment exists — return cached response
                return mapToResponse(cached.get());
            } else {
                // Payment failed previously — clear stale Redis key and continue
                redisTemplate.delete(redisKey);
                log.info("Cleared stale idempotency key, retrying: {}", idempotencyKey);
            }
        }
        // Step 2 — Create payment record in DB
        Payment payment = new Payment();
        payment.setMerchantId(merchantId);
        payment.setIdempotencyKey(idempotencyKey);
        payment.setAmount(request.getAmount());
        payment.setCurrency(request.getCurrency());
        payment.setBankAdapter(request.getBankAdapter() != null
                ? request.getBankAdapter() : "HDFC");
        payment.setMetadata(request.getMetadata());
        payment.setStatus(PaymentStatus.INITIATED);

        payment = paymentRepository.save(payment);
        log.info("Payment created: {}", payment.getId());

        // Step 3 — Store in Redis for idempotency (24h TTL)
        redisTemplate.opsForValue().set(
                redisKey,
                payment.getId().toString(),
                IDEMPOTENCY_TTL
        );

        // Publish initiated event
        eventPublisher.publishPaymentInitiated(payment);

        // Step 4 — Route to bank adapter
        payment.setStatus(PaymentStatus.PROCESSING);
        payment = paymentRepository.save(payment);

        BankAdapter adapter = bankAdapterFactory.getAdapter(payment.getBankAdapter());
        BankResponse bankResponse = adapter.processPayment(
                payment.getId().toString(),
                payment.getAmount(),
                payment.getCurrency()
        );

        // Step 5 — Update payment status based on bank response
        if (bankResponse.isSuccess()) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setBankRefId(bankResponse.getBankRefId());
            log.info("Payment SUCCESS: {} | BankRef: {}",
                    payment.getId(), bankResponse.getBankRefId());
            payment = paymentRepository.save(payment);
            eventPublisher.publishPaymentCompleted(payment);

        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(bankResponse.getFailureReason());
            log.info("Payment FAILED: {} | Reason: {}",
                    payment.getId(), bankResponse.getFailureReason());
            payment = paymentRepository.save(payment);
            eventPublisher.publishPaymentFailed(payment);
        }

        // Step 6 — Update Redis cache with final status
        redisTemplate.opsForValue().set(
                "payment:status:" + payment.getId(),
                payment.getStatus().name(),
                Duration.ofMinutes(5)
        );

        return mapToResponse(payment);
    }

    // ─────────────────────────────────────────
    // GET PAYMENT BY ID
    // ─────────────────────────────────────────
    public PaymentResponse getPaymentById(UUID paymentId, UUID merchantId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // Security check — merchant can only see their own payments
        if (!payment.getMerchantId().equals(merchantId)) {
            throw new RuntimeException("Unauthorized");
        }

        return mapToResponse(payment);
    }

    // ─────────────────────────────────────────
    // GET PAYMENT STATUS
    // ─────────────────────────────────────────
    public PaymentStatusResponse getPaymentStatus(UUID paymentId, UUID merchantId) {
        // First check Redis cache
        String cachedStatus = redisTemplate.opsForValue()
                .get("payment:status:" + paymentId);

        if (cachedStatus != null) {
            log.info("Status from cache for payment: {}", paymentId);
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!payment.getMerchantId().equals(merchantId)) {
            throw new RuntimeException("Unauthorized");
        }

        PaymentStatusResponse response = new PaymentStatusResponse();
        response.setPaymentId(payment.getId());
        response.setStatus(payment.getStatus());
        response.setBankRefId(payment.getBankRefId());
        response.setFailureReason(payment.getFailureReason());
        response.setUpdatedAt(payment.getUpdatedAt());

        return response;
    }

    // ─────────────────────────────────────────
    // LIST PAYMENTS (PAGINATED)
    // ─────────────────────────────────────────
    public Page<PaymentResponse> listPayments(UUID merchantId,
                                              PaymentStatus status,
                                              Pageable pageable) {
        if (status != null) {
            return paymentRepository
                    .findByMerchantIdAndStatus(merchantId, status, pageable)
                    .map(this::mapToResponse);
        }
        return paymentRepository
                .findByMerchantId(merchantId, pageable)
                .map(this::mapToResponse);
    }

    // ─────────────────────────────────────────
    // HELPER — Map Payment to Response
    // ─────────────────────────────────────────
    private PaymentResponse mapToResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setMerchantId(payment.getMerchantId());
        response.setAmount(payment.getAmount());
        response.setCurrency(payment.getCurrency());
        response.setStatus(payment.getStatus());
        response.setBankAdapter(payment.getBankAdapter());
        response.setBankRefId(payment.getBankRefId());
        response.setMetadata(payment.getMetadata());
        response.setFailureReason(payment.getFailureReason());
        response.setCreatedAt(payment.getCreatedAt());
        response.setUpdatedAt(payment.getUpdatedAt());
        return response;
    }
}
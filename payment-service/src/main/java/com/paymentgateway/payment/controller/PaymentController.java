package com.paymentgateway.payment.controller;

import com.paymentgateway.payment.dto.PaymentRequest;
import com.paymentgateway.payment.dto.PaymentResponse;
import com.paymentgateway.payment.dto.PaymentStatusResponse;
import com.paymentgateway.payment.model.PaymentStatus;
import com.paymentgateway.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ─────────────────────────────────────────
    // POST /v1/payments
    // Initiate a new payment
    // ─────────────────────────────────────────
    @PostMapping
    public ResponseEntity<PaymentResponse> initiatePayment(
            @RequestHeader("X-Merchant-Id") String merchantId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {

        log.info("Payment request from merchant: {}", merchantId);

        PaymentResponse response = paymentService.initiatePayment(
                UUID.fromString(merchantId),
                idempotencyKey,
                request
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────
    // GET /v1/payments/{id}
    // Get payment by ID
    // ─────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPayment(
            @RequestHeader("X-Merchant-Id") String merchantId,
            @PathVariable UUID id) {

        PaymentResponse response = paymentService.getPaymentById(
                id,
                UUID.fromString(merchantId)
        );

        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────
    // GET /v1/payments/{id}/status
    // Poll payment status
    // ─────────────────────────────────────────
    @GetMapping("/{id}/status")
    public ResponseEntity<PaymentStatusResponse> getPaymentStatus(
            @RequestHeader("X-Merchant-Id") String merchantId,
            @PathVariable UUID id) {

        PaymentStatusResponse response = paymentService.getPaymentStatus(
                id,
                UUID.fromString(merchantId)
        );

        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────
    // GET /v1/payments
    // List payments with pagination
    // ─────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Page<PaymentResponse>> listPayments(
            @RequestHeader("X-Merchant-Id") String merchantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) PaymentStatus status) {

        Pageable pageable = PageRequest.of(
                page, size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<PaymentResponse> response = paymentService.listPayments(
                UUID.fromString(merchantId),
                status,
                pageable
        );

        return ResponseEntity.ok(response);
    }
}
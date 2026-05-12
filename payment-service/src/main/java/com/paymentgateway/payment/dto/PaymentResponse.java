package com.paymentgateway.payment.dto;

import com.paymentgateway.payment.model.PaymentStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PaymentResponse {

    private UUID id;
    private UUID merchantId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String bankAdapter;
    private String bankRefId;
    private String metadata;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
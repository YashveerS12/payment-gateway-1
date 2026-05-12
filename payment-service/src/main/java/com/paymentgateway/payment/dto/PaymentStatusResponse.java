package com.paymentgateway.payment.dto;

import com.paymentgateway.payment.model.PaymentStatus;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PaymentStatusResponse {

    private UUID paymentId;
    private PaymentStatus status;
    private String bankRefId;
    private String failureReason;
    private LocalDateTime updatedAt;
}
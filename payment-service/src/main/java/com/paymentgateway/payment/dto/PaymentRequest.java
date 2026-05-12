package com.paymentgateway.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    private String currency = "INR";

    // Extra data from merchant — orderId, customerId etc.
    private String metadata;

    // Which bank to use — HDFC, ICICI, SBI, AXIS
    // If not provided, system auto selects
    private String bankAdapter;
}
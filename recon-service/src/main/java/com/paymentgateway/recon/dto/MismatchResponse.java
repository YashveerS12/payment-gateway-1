package com.paymentgateway.recon.dto;

import com.paymentgateway.recon.model.MismatchType;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MismatchResponse {

    private UUID id;
    private LocalDate reconDate;
    private UUID paymentId;
    private BigDecimal ledgerAmount;
    private BigDecimal transactionAmount;
    private MismatchType mismatchType;
    private String mismatchDescription;
    private Boolean resolved;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
package com.paymentgateway.recon.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@Entity
@Table(name = "recon_records")
public class ReconRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "recon_date", nullable = false)
    private LocalDate reconDate;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "ledger_amount", precision = 15, scale = 2)
    private BigDecimal ledgerAmount;

    @Column(name = "transaction_amount", precision = 15, scale = 2)
    private BigDecimal transactionAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "mismatch_type", columnDefinition = "mismatch_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private MismatchType mismatchType;

    @Column(name = "mismatch_description")
    private String mismatchDescription;

    @Column(name = "resolved", nullable = false)
    private Boolean resolved = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
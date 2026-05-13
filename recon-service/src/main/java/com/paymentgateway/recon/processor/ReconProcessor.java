package com.paymentgateway.recon.processor;

import com.paymentgateway.recon.model.MismatchType;
import com.paymentgateway.recon.model.ReconRecord;
import com.paymentgateway.recon.repository.ReconRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReconProcessor {

    private final ReconRecordRepository reconRecordRepository;
    private final JdbcTemplate jdbcTemplate;

    // ─────────────────────────────────────────
    // Main reconciliation logic
    // Compares payments table vs mock ledger
    // ─────────────────────────────────────────
    public void process(LocalDate reconDate) {
        log.info("Starting reconciliation for date: {}", reconDate);
        jdbcTemplate.update(
                "DELETE FROM recon_records WHERE recon_date = ?", reconDate
        );

        // Step 1 — Get all payments for the date from DB
        List<Map<String, Object>> payments = jdbcTemplate.queryForList("""
    SELECT id, amount, status::text, bank_ref_id
    FROM payments
    WHERE DATE(created_at) = ?
    AND status::text IN ('SUCCESS', 'FAILED')
""", reconDate);

        log.info("Found {} payments for date: {}", payments.size(), reconDate);

        // Step 2 — Process each payment
        for (Map<String, Object> payment : payments) {
            processPayment(payment, reconDate);
        }

        log.info("Reconciliation complete for date: {}", reconDate);
    }

    // ─────────────────────────────────────────
    // Process individual payment
    // ─────────────────────────────────────────
    private void processPayment(Map<String, Object> payment, LocalDate reconDate) {
        String paymentId   = payment.get("id").toString();
        BigDecimal amount  = (BigDecimal) payment.get("amount");
        String status      = payment.get("status").toString();
        String bankRefId   = payment.get("bank_ref_id") != null
                ? payment.get("bank_ref_id").toString() : null;

        // Step 3 — Simulate ledger check
        // In real world — call bank API or read bank CSV file
        LedgerEntry ledgerEntry = getMockLedgerEntry(paymentId, amount, bankRefId);

        // Step 4 — Compare and detect mismatches
        if (ledgerEntry == null) {
            // Payment in DB but not in bank ledger
            saveMismatch(reconDate, paymentId, amount, null,
                    MismatchType.MISSING_IN_LEDGER,
                    "Payment exists in DB but not in bank ledger");

        } else if (ledgerEntry.amount.compareTo(amount) != 0) {
            // Amount mismatch
            saveMismatch(reconDate, paymentId, amount, ledgerEntry.amount,
                    MismatchType.AMOUNT_MISMATCH,
                    "DB amount: " + amount + " | Ledger amount: " + ledgerEntry.amount);

        } else if (!status.equals(ledgerEntry.status)) {
            // Status mismatch
            saveMismatch(reconDate, paymentId, amount, ledgerEntry.amount,
                    MismatchType.STATUS_MISMATCH,
                    "DB status: " + status + " | Ledger status: " + ledgerEntry.status);

        } else {
            // All good — save matched record
            saveMatched(reconDate, paymentId, amount);
        }
    }

    // ─────────────────────────────────────────
    // Mock ledger — simulates bank response
    // In real world — read from bank CSV or API
    // ─────────────────────────────────────────
    private LedgerEntry getMockLedgerEntry(String paymentId,
                                           BigDecimal amount,
                                           String bankRefId) {
        // Simulate 95% match rate
        double random = Math.random();

        if (random < 0.02) {
            // 2% — missing in ledger
            return null;
        } else if (random < 0.04) {
            // 2% — amount mismatch
            return new LedgerEntry(
                    amount.subtract(new BigDecimal("50")),
                    "SUCCESS"
            );
        } else if (random < 0.05) {
            // 1% — status mismatch
            return new LedgerEntry(amount, "FAILED");
        } else {
            // 95% — perfect match
            return new LedgerEntry(amount, "SUCCESS");
        }
    }

    // ─────────────────────────────────────────
    // Save mismatch record
    // ─────────────────────────────────────────
    private void saveMismatch(LocalDate reconDate,
                              String paymentId,
                              BigDecimal transactionAmount,
                              BigDecimal ledgerAmount,
                              MismatchType mismatchType,
                              String description) {
        ReconRecord record = new ReconRecord();
        record.setReconDate(reconDate);
        record.setPaymentId(java.util.UUID.fromString(paymentId));
        record.setTransactionAmount(transactionAmount);
        record.setLedgerAmount(ledgerAmount);
        record.setMismatchType(mismatchType);
        record.setMismatchDescription(description);
        record.setResolved(false);

        reconRecordRepository.save(record);
        log.info("Mismatch saved: {} | {}", mismatchType, paymentId);
    }

    // ─────────────────────────────────────────
    // Save matched record
    // ─────────────────────────────────────────
    private void saveMatched(LocalDate reconDate,
                             String paymentId,
                             BigDecimal amount) {
        ReconRecord record = new ReconRecord();
        record.setReconDate(reconDate);
        record.setPaymentId(java.util.UUID.fromString(paymentId));
        record.setTransactionAmount(amount);
        record.setLedgerAmount(amount);
        record.setResolved(true);

        reconRecordRepository.save(record);
    }

    // ─────────────────────────────────────────
    // Inner class — Ledger entry
    // ─────────────────────────────────────────
    private static class LedgerEntry {
        BigDecimal amount;
        String status;

        LedgerEntry(BigDecimal amount, String status) {
            this.amount = amount;
            this.status = status;
        }
    }
}
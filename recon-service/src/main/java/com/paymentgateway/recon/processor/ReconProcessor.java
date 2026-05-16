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
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReconProcessor {

    private final ReconRecordRepository reconRecordRepository;
    private final JdbcTemplate jdbcTemplate;

    public void process(LocalDate reconDate) {
        log.info("Starting reconciliation for date: {}", reconDate);

        // DELETE existing records for this date first
        jdbcTemplate.update(
                "DELETE FROM recon_records WHERE recon_date = ?", reconDate
        );

        // Fetch payments with merchant_id
        List<Map<String, Object>> payments = jdbcTemplate.queryForList("""
            SELECT id, amount, status::text, bank_ref_id, merchant_id
            FROM payments
            WHERE DATE(created_at) = ?
            AND status::text IN ('SUCCESS', 'FAILED')
        """, reconDate);

        log.info("Found {} payments for date: {}", payments.size(), reconDate);

        for (Map<String, Object> payment : payments) {
            processPayment(payment, reconDate);
        }

        log.info("Reconciliation complete for date: {}", reconDate);
    }

    private void processPayment(Map<String, Object> payment, LocalDate reconDate) {
        String paymentId   = payment.get("id").toString();
        BigDecimal amount  = (BigDecimal) payment.get("amount");
        String status      = payment.get("status").toString();
        String bankRefId   = payment.get("bank_ref_id") != null
                ? payment.get("bank_ref_id").toString() : null;

        // Get merchantId from payment
        UUID merchantId = null;
        if (payment.get("merchant_id") != null) {
            merchantId = UUID.fromString(payment.get("merchant_id").toString());
        }

        LedgerEntry ledgerEntry = getMockLedgerEntry(paymentId, amount, bankRefId);

        if (ledgerEntry == null) {
            saveMismatch(reconDate, paymentId, amount, null,
                    MismatchType.MISSING_IN_LEDGER,
                    "Payment exists in DB but not in bank ledger",
                    merchantId);

        } else if (ledgerEntry.amount.compareTo(amount) != 0) {
            saveMismatch(reconDate, paymentId, amount, ledgerEntry.amount,
                    MismatchType.AMOUNT_MISMATCH,
                    "DB amount: " + amount + " | Ledger amount: " + ledgerEntry.amount,
                    merchantId);

        } else if (!status.equals(ledgerEntry.status)) {
            saveMismatch(reconDate, paymentId, amount, ledgerEntry.amount,
                    MismatchType.STATUS_MISMATCH,
                    "DB status: " + status + " | Ledger status: " + ledgerEntry.status,
                    merchantId);

        } else {
            saveMatched(reconDate, paymentId, amount, merchantId);
        }
    }

    private LedgerEntry getMockLedgerEntry(String paymentId,
                                           BigDecimal amount,
                                           String bankRefId) {
        double random = Math.random();

        if (random < 0.02) {
            return null;
        } else if (random < 0.04) {
            return new LedgerEntry(amount.subtract(new BigDecimal("50")), "SUCCESS");
        } else if (random < 0.05) {
            return new LedgerEntry(amount, "FAILED");
        } else {
            return new LedgerEntry(amount, "SUCCESS");
        }
    }

    private void saveMismatch(LocalDate reconDate,
                              String paymentId,
                              BigDecimal transactionAmount,
                              BigDecimal ledgerAmount,
                              MismatchType mismatchType,
                              String description,
                              UUID merchantId) {
        ReconRecord record = new ReconRecord();
        record.setReconDate(reconDate);
        record.setPaymentId(UUID.fromString(paymentId));
        record.setTransactionAmount(transactionAmount);
        record.setLedgerAmount(ledgerAmount);
        record.setMismatchType(mismatchType);
        record.setMismatchDescription(description);
        record.setResolved(false);
        record.setMerchantId(merchantId); // ← NEW

        reconRecordRepository.save(record);
        log.info("Mismatch saved: {} | {}", mismatchType, paymentId);
    }

    private void saveMatched(LocalDate reconDate,
                             String paymentId,
                             BigDecimal amount,
                             UUID merchantId) {
        ReconRecord record = new ReconRecord();
        record.setReconDate(reconDate);
        record.setPaymentId(UUID.fromString(paymentId));
        record.setTransactionAmount(amount);
        record.setLedgerAmount(amount);
        record.setResolved(true);
        record.setMerchantId(merchantId); // ← NEW

        reconRecordRepository.save(record);
    }

    private static class LedgerEntry {
        BigDecimal amount;
        String status;

        LedgerEntry(BigDecimal amount, String status) {
            this.amount = amount;
            this.status = status;
        }
    }
}
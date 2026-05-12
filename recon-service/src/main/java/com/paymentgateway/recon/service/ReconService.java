package com.paymentgateway.recon.service;

import com.paymentgateway.recon.dto.MismatchResponse;
import com.paymentgateway.recon.dto.ReconSummaryResponse;
import com.paymentgateway.recon.model.MismatchType;
import com.paymentgateway.recon.model.ReconRecord;
import com.paymentgateway.recon.processor.ReconProcessor;
import com.paymentgateway.recon.report.CsvReportGenerator;
import com.paymentgateway.recon.repository.ReconRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReconService {

    private final ReconRecordRepository reconRecordRepository;
    private final ReconProcessor reconProcessor;
    private final CsvReportGenerator csvReportGenerator;

    // ─────────────────────────────────────────
    // Trigger reconciliation for a date
    // ─────────────────────────────────────────
    public void triggerRecon(LocalDate reconDate) {
        log.info("Triggering recon for date: {}", reconDate);
        reconProcessor.process(reconDate);
        log.info("Recon completed for date: {}", reconDate);
    }

    // ─────────────────────────────────────────
    // Get summary for a date
    // ─────────────────────────────────────────
    public ReconSummaryResponse getSummary(LocalDate reconDate) {
        long total      = reconRecordRepository.countByReconDate(reconDate);
        long mismatched = reconRecordRepository
                .countByReconDateAndResolved(reconDate, false);
        long matched    = total - mismatched;
        long unresolved = mismatched;

        ReconSummaryResponse response = new ReconSummaryResponse();
        response.setReconDate(reconDate);
        response.setTotalTransactions(total);
        response.setMatched(matched);
        response.setMismatched(mismatched);
        response.setUnresolved(unresolved);
        response.setStatus(mismatched == 0 ? "CLEAN" : "HAS_MISMATCHES");

        return response;
    }

    // ─────────────────────────────────────────
    // Get all mismatches for a date
    // ─────────────────────────────────────────
    public List<MismatchResponse> getMismatches(LocalDate reconDate,
                                                MismatchType type) {
        List<ReconRecord> records;

        if (type != null) {
            records = reconRecordRepository
                    .findByReconDateAndMismatchType(reconDate, type);
        } else {
            records = reconRecordRepository
                    .findByReconDateAndResolved(reconDate, false);
        }

        return records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────
    // Export CSV report
    // ─────────────────────────────────────────
    public byte[] exportCsv(LocalDate reconDate) {
        return csvReportGenerator.generateReport(reconDate);
    }

    // ─────────────────────────────────────────
    // Helper — map to response
    // ─────────────────────────────────────────
    private MismatchResponse mapToResponse(ReconRecord record) {
        MismatchResponse response = new MismatchResponse();
        response.setId(record.getId());
        response.setReconDate(record.getReconDate());
        response.setPaymentId(record.getPaymentId());
        response.setLedgerAmount(record.getLedgerAmount());
        response.setTransactionAmount(record.getTransactionAmount());
        response.setMismatchType(record.getMismatchType());
        response.setMismatchDescription(record.getMismatchDescription());
        response.setResolved(record.getResolved());
        response.setResolvedAt(record.getResolvedAt());
        response.setCreatedAt(record.getCreatedAt());
        return response;
    }
}
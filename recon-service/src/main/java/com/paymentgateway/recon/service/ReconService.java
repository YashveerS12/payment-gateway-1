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
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReconService {

    private final ReconRecordRepository reconRecordRepository;
    private final ReconProcessor reconProcessor;
    private final CsvReportGenerator csvReportGenerator;

    // Trigger recon
    public void triggerRecon(LocalDate reconDate, String merchantId) {
        log.info("Triggering recon for date: {} merchant: {}", reconDate, merchantId);
        reconProcessor.process(reconDate);
        log.info("Recon completed for date: {}", reconDate);
    }

    public void triggerRecon(LocalDate reconDate) {
        triggerRecon(reconDate, null);
    }

    // Get summary filtered by merchant
    public ReconSummaryResponse getSummary(LocalDate reconDate, String merchantId) {
        long total;
        long mismatched;

        if (merchantId != null && !merchantId.isEmpty()) {
            UUID mId = UUID.fromString(merchantId);
            total      = reconRecordRepository.countByReconDateAndMerchantId(reconDate, mId);
            mismatched = reconRecordRepository.countByReconDateAndMerchantIdAndResolved(reconDate, mId, false);
        } else {
            total      = reconRecordRepository.countByReconDate(reconDate);
            mismatched = reconRecordRepository.countByReconDateAndResolved(reconDate, false);
        }

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

    public ReconSummaryResponse getSummary(LocalDate reconDate) {
        return getSummary(reconDate, null);
    }

    // Get mismatches filtered by merchant
    public List<MismatchResponse> getMismatches(LocalDate reconDate, MismatchType type, String merchantId) {
        List<ReconRecord> records;
        UUID mId = (merchantId != null && !merchantId.isEmpty()) ? UUID.fromString(merchantId) : null;

        if (mId != null && type != null) {
            records = reconRecordRepository.findByReconDateAndMismatchTypeAndMerchantId(reconDate, type, mId);
        } else if (mId != null) {
            records = reconRecordRepository.findByReconDateAndMerchantIdAndResolved(reconDate, mId, false);
        } else if (type != null) {
            records = reconRecordRepository.findByReconDateAndMismatchType(reconDate, type);
        } else {
            records = reconRecordRepository.findByReconDateAndResolved(reconDate, false);
        }

        return records.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<MismatchResponse> getMismatches(LocalDate reconDate, MismatchType type) {
        return getMismatches(reconDate, type, null);
    }

    // Export CSV
    public byte[] exportCsv(LocalDate reconDate, String merchantId) {
        return csvReportGenerator.generateReport(reconDate);
    }

    public byte[] exportCsv(LocalDate reconDate) {
        return exportCsv(reconDate, null);
    }

    // Map to response
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
package com.paymentgateway.recon.controller;

import com.paymentgateway.recon.dto.MismatchResponse;
import com.paymentgateway.recon.dto.ReconSummaryResponse;
import com.paymentgateway.recon.model.MismatchType;
import com.paymentgateway.recon.service.ReconService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/v1/recon")
@RequiredArgsConstructor
public class ReconController {

    private final ReconService reconService;

    @GetMapping("/summary")
    public ResponseEntity<ReconSummaryResponse> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestHeader(value = "X-Merchant-Id", required = false) String merchantId) {

        log.info("Getting recon summary for date: {} merchant: {}", date, merchantId);
        ReconSummaryResponse summary = reconService.getSummary(date, merchantId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/mismatches")
    public ResponseEntity<List<MismatchResponse>> getMismatches(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) MismatchType type,
            @RequestHeader(value = "X-Merchant-Id", required = false) String merchantId) {

        log.info("Getting mismatches for date: {} type: {} merchant: {}", date, type, merchantId);
        List<MismatchResponse> mismatches = reconService.getMismatches(date, type, merchantId);
        return ResponseEntity.ok(mismatches);
    }

    @PostMapping("/trigger")
    public ResponseEntity<Map<String, String>> triggerRecon(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestHeader(value = "X-Merchant-Id", required = false) String merchantId) {

        log.info("Triggering recon for date: {} merchant: {}", date, merchantId);
        new Thread(() -> reconService.triggerRecon(date, merchantId)).start();

        return ResponseEntity.ok(Map.of(
                "status", "TRIGGERED",
                "date", date.toString(),
                "message", "Reconciliation started for " + date
        ));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestHeader(value = "X-Merchant-Id", required = false) String merchantId) {

        log.info("Exporting CSV for date: {} merchant: {}", date, merchantId);
        byte[] csvBytes = reconService.exportCsv(date, merchantId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=recon-" + date + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
}
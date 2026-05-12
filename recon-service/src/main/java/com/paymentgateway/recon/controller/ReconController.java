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

    // ─────────────────────────────────────────
    // GET /v1/recon/summary?date=2025-06-01
    // Get daily recon summary
    // ─────────────────────────────────────────
    @GetMapping("/summary")
    public ResponseEntity<ReconSummaryResponse> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        log.info("Getting recon summary for date: {}", date);
        ReconSummaryResponse summary = reconService.getSummary(date);
        return ResponseEntity.ok(summary);
    }

    // ─────────────────────────────────────────
    // GET /v1/recon/mismatches?date=2025-06-01&type=AMOUNT_MISMATCH
    // List mismatched records
    // ─────────────────────────────────────────
    @GetMapping("/mismatches")
    public ResponseEntity<List<MismatchResponse>> getMismatches(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,
            @RequestParam(required = false) MismatchType type) {

        log.info("Getting mismatches for date: {} type: {}", date, type);
        List<MismatchResponse> mismatches = reconService.getMismatches(date, type);
        return ResponseEntity.ok(mismatches);
    }

    // ─────────────────────────────────────────
    // POST /v1/recon/trigger
    // Manually trigger recon job
    // ─────────────────────────────────────────
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, String>> triggerRecon(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        log.info("Manually triggering recon for date: {}", date);

        // Run in background thread so API returns immediately
        new Thread(() -> reconService.triggerRecon(date)).start();

        return ResponseEntity.ok(Map.of(
                "status", "TRIGGERED",
                "date", date.toString(),
                "message", "Reconciliation started for " + date
        ));
    }

    // ─────────────────────────────────────────
    // GET /v1/recon/export?date=2025-06-01
    // Download CSV report
    // ─────────────────────────────────────────
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        log.info("Exporting CSV for date: {}", date);
        byte[] csvBytes = reconService.exportCsv(date);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=recon-" + date + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
}
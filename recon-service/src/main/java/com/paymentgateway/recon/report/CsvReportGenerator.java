package com.paymentgateway.recon.report;

import com.paymentgateway.recon.model.ReconRecord;
import com.paymentgateway.recon.repository.ReconRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CsvReportGenerator {

    private final ReconRecordRepository reconRecordRepository;

    // ─────────────────────────────────────────
    // Generate CSV report for a date
    // ─────────────────────────────────────────
    public byte[] generateReport(LocalDate reconDate) {
        log.info("Generating CSV report for date: {}", reconDate);

        // Get all recon records for the date
        List<ReconRecord> records = reconRecordRepository
                .findByReconDate(reconDate);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(outputStream);

        // Write CSV header
        writer.println(
                "ID," +
                        "Recon Date," +
                        "Payment ID," +
                        "Transaction Amount," +
                        "Ledger Amount," +
                        "Mismatch Type," +
                        "Description," +
                        "Resolved," +
                        "Created At"
        );

        // Write each record
        for (ReconRecord record : records) {
            writer.println(String.join(",",
                    safe(record.getId()),
                    safe(record.getReconDate()),
                    safe(record.getPaymentId()),
                    safe(record.getTransactionAmount()),
                    safe(record.getLedgerAmount()),
                    safe(record.getMismatchType()),
                    safeDescription(record.getMismatchDescription()),
                    safe(record.getResolved()),
                    safe(record.getCreatedAt())
            ));
        }

        writer.flush();
        writer.close();

        log.info("CSV report generated with {} records", records.size());
        return outputStream.toByteArray();
    }

    // ─────────────────────────────────────────
    // Helper — safely convert to string
    // ─────────────────────────────────────────
    private String safe(Object value) {
        return value != null ? value.toString() : "";
    }

    // ─────────────────────────────────────────
    // Helper — handle description with commas
    // Wrap in quotes to avoid CSV breaking
    // ─────────────────────────────────────────
    private String safeDescription(String value) {
        if (value == null) return "";
        // Wrap in quotes — description may contain commas
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
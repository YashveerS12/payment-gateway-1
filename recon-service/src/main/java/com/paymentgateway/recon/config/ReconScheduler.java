package com.paymentgateway.recon.config;

import com.paymentgateway.recon.service.ReconService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReconScheduler {

    private final ReconService reconService;

    // ─────────────────────────────────────────
    // Runs every day at 2:00 AM
    // Reconciles previous day (T-1)
    // ─────────────────────────────────────────
    @Scheduled(cron = "${recon.cron:0 0 2 * * *}")
    public void runDailyRecon() {
        // Always reconcile previous day (T-1)
        LocalDate yesterday = LocalDate.now().minusDays(1);

        log.info("========================================");
        log.info("Daily Recon Job Started for: {}", yesterday);
        log.info("========================================");

        try {
            reconService.triggerRecon(yesterday);
            log.info("Daily Recon Job Completed for: {}", yesterday);

        } catch (Exception e) {
            log.error("Daily Recon Job FAILED for: {} | Error: {}",
                    yesterday, e.getMessage());
        }
    }
}
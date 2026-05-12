package com.paymentgateway.recon.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ReconSummaryResponse {

    private LocalDate reconDate;
    private long totalTransactions;
    private long matched;
    private long mismatched;
    private long unresolved;
    private String status;
}
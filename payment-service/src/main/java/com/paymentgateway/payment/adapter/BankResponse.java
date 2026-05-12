package com.paymentgateway.payment.adapter;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BankResponse {

    private boolean success;
    private String bankRefId;
    private String failureReason;

    // Static factory methods for clean code
    public static BankResponse success(String bankRefId) {
        return new BankResponse(true, bankRefId, null);
    }

    public static BankResponse failure(String reason) {
        return new BankResponse(false, null, reason);
    }
}
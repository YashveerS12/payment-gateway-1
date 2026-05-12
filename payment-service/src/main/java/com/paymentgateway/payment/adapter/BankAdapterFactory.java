package com.paymentgateway.payment.adapter;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

// Factory Pattern — decides which bank adapter to use
@Component
@RequiredArgsConstructor
public class BankAdapterFactory {

    private final HdfcAdapter hdfcAdapter;
    private final IciciAdapter iciciAdapter;
    private final SbiAdapter sbiAdapter;

    public BankAdapter getAdapter(String bankName) {
        if (bankName == null) {
            // Default to HDFC if no bank specified
            return hdfcAdapter;
        }

        return switch (bankName.toUpperCase()) {
            case "HDFC"  -> hdfcAdapter;
            case "ICICI" -> iciciAdapter;
            case "SBI"   -> sbiAdapter;
            default      -> hdfcAdapter;
        };
    }
}
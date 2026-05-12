package com.paymentgateway.payment.adapter;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

@Component
public class HdfcAdapter implements BankAdapter {

    @Override
    public BankResponse processPayment(String paymentId,
                                       BigDecimal amount,
                                       String currency) {
        // Mock HDFC bank call
        // In real world — call HDFC payment API here
        try {
            // Simulate network delay
            Thread.sleep(500);

            // Simulate 90% success rate
            if (Math.random() > 0.1) {
                String bankRefId = "HDFC" + System.currentTimeMillis()
                        + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                return BankResponse.success(bankRefId);
            } else {
                return BankResponse.failure("HDFC: Insufficient funds");
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return BankResponse.failure("HDFC: Request interrupted");
        }
    }

    @Override
    public String getBankName() {
        return "HDFC";
    }
}
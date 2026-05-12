package com.paymentgateway.payment.adapter;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

@Component
public class SbiAdapter implements BankAdapter {

    @Override
    public BankResponse processPayment(String paymentId,
                                       BigDecimal amount,
                                       String currency) {
        // Mock SBI bank call
        try {
            Thread.sleep(600);

            if (Math.random() > 0.1) {
                String bankRefId = "SBI" + System.currentTimeMillis()
                        + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                return BankResponse.success(bankRefId);
            } else {
                return BankResponse.failure("SBI: Daily limit exceeded");
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return BankResponse.failure("SBI: Request interrupted");
        }
    }

    @Override
    public String getBankName() {
        return "SBI";
    }
}
package com.paymentgateway.payment.adapter;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

@Component
public class IciciAdapter implements BankAdapter {

    @Override
    public BankResponse processPayment(String paymentId,
                                       BigDecimal amount,
                                       String currency) {
        // Mock ICICI bank call
        try {
            Thread.sleep(400);

            if (Math.random() > 0.1) {
                String bankRefId = "ICICI" + System.currentTimeMillis()
                        + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                return BankResponse.success(bankRefId);
            } else {
                return BankResponse.failure("ICICI: Transaction declined");
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return BankResponse.failure("ICICI: Request interrupted");
        }
    }

    @Override
    public String getBankName() {
        return "ICICI";
    }
}
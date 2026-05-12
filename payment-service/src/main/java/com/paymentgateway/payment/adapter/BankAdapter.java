package com.paymentgateway.payment.adapter;

import java.math.BigDecimal;

// Strategy Pattern — Interface
// Every bank must implement this
public interface BankAdapter {

    // Process payment and return bank reference ID
    BankResponse processPayment(String paymentId, BigDecimal amount, String currency);

    // Get bank name
    String getBankName();
}
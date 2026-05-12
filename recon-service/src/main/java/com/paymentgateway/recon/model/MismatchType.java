package com.paymentgateway.recon.model;

public enum MismatchType {
    AMOUNT_MISMATCH,
    MISSING_IN_LEDGER,
    MISSING_IN_DB,
    DUPLICATE,
    STATUS_MISMATCH,
    EXTRA_IN_LEDGER
}
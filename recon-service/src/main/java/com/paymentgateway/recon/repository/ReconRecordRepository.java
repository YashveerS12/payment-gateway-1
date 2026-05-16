package com.paymentgateway.recon.repository;

import com.paymentgateway.recon.model.MismatchType;
import com.paymentgateway.recon.model.ReconRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReconRecordRepository extends JpaRepository<ReconRecord, UUID> {

    // ─── Existing methods ─────────────────────
    List<ReconRecord> findByReconDate(LocalDate reconDate);

    List<ReconRecord> findByReconDateAndMismatchType(
            LocalDate reconDate, MismatchType mismatchType);

    List<ReconRecord> findByReconDateAndResolved(
            LocalDate reconDate, Boolean resolved);

    long countByReconDate(LocalDate reconDate);

    long countByReconDateAndResolved(LocalDate reconDate, Boolean resolved);

    @Query("""
        SELECT COUNT(r) FROM ReconRecord r
        WHERE r.reconDate = :reconDate
        AND r.mismatchType IS NULL
    """)
    long countMatchedByDate(LocalDate reconDate);

    // ─── Merchant filtered methods ─────────────
    List<ReconRecord> findByReconDateAndMerchantId(
            LocalDate reconDate, UUID merchantId);

    List<ReconRecord> findByReconDateAndMerchantIdAndResolved(
            LocalDate reconDate, UUID merchantId, Boolean resolved);

    List<ReconRecord> findByReconDateAndMismatchTypeAndMerchantId(
            LocalDate reconDate, MismatchType mismatchType, UUID merchantId);

    long countByReconDateAndMerchantId(
            LocalDate reconDate, UUID merchantId);

    long countByReconDateAndMerchantIdAndResolved(
            LocalDate reconDate, UUID merchantId, Boolean resolved);
}
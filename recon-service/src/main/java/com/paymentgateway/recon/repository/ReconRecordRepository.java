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

    // Get all mismatches for a date
    List<ReconRecord> findByReconDate(LocalDate reconDate);

    // Get mismatches by date and type
    List<ReconRecord> findByReconDateAndMismatchType(
            LocalDate reconDate,
            MismatchType mismatchType
    );

    // Get unresolved mismatches
    List<ReconRecord> findByReconDateAndResolved(
            LocalDate reconDate,
            Boolean resolved
    );

    // Count total mismatches for a date
    long countByReconDate(LocalDate reconDate);

    // Count unresolved mismatches
    long countByReconDateAndResolved(LocalDate reconDate, Boolean resolved);

    // Summary query — total matched vs mismatched
    @Query("""
        SELECT COUNT(r) FROM ReconRecord r
        WHERE r.reconDate = :reconDate
        AND r.mismatchType IS NULL
    """)
    long countMatchedByDate(LocalDate reconDate);
}
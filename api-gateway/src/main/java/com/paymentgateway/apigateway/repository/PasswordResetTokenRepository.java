package com.paymentgateway.apigateway.repository;

import com.paymentgateway.apigateway.model.PasswordResetToken;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    // Delete all tokens for a merchant when password is reset
    @Transactional
    void deleteByMerchantId(UUID merchantId);
}
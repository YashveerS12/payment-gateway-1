package com.paymentgateway.apigateway.repository;

import com.paymentgateway.apigateway.model.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, UUID> {
    Optional<Merchant> findByApiKey(String apiKey);
    Optional<Merchant> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByApiKey(String apiKey);
}

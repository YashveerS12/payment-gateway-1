package com.paymentgateway.apigateway.controller;

import com.paymentgateway.apigateway.config.EmailService;
import com.paymentgateway.apigateway.dto.*;
import com.paymentgateway.apigateway.model.Merchant;
import com.paymentgateway.apigateway.model.PasswordResetToken;
import com.paymentgateway.apigateway.repository.MerchantRepository;
import com.paymentgateway.apigateway.repository.PasswordResetTokenRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final MerchantRepository merchantRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // ─────────────────────────────────────────
    // POST /v1/auth/forgot-password
    // ─────────────────────────────────────────
    @Transactional
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        log.info("Password reset requested for email: {}", request.getEmail());

        // Always return same response — prevents email enumeration attacks
        String genericResponse = "If this email is registered you will receive a reset token shortly.";

        merchantRepository.findByEmail(request.getEmail())
                .filter(Merchant::getIsActive)
                .ifPresent(merchant -> {
                    // Delete old tokens for this merchant
                    tokenRepository.deleteByMerchantId(merchant.getId());

                    // Generate cryptographically secure token
                    SecureRandom random = new SecureRandom();
                    byte[] tokenBytes = new byte[32];
                    random.nextBytes(tokenBytes);
                    String rawToken = HexFormat.of().formatHex(tokenBytes);

                    // Hash token before storing
                    String tokenHash = passwordEncoder.encode(rawToken);

                    // Save with 15 min expiry
                    PasswordResetToken resetToken = new PasswordResetToken();
                    resetToken.setMerchantId(merchant.getId());
                    resetToken.setTokenHash(tokenHash);
                    resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
                    tokenRepository.save(resetToken);

                    // TODO: Replace with real email service in production
                    // For now — token shown in console
                    emailService.sendPasswordResetEmail(
                            merchant.getEmail(),
                            merchant.getName(),
                            rawToken
                    );
                });

        return ResponseEntity.ok(Map.of("message", genericResponse));
    }

    // ─────────────────────────────────────────
    // POST /v1/auth/reset-password
    // ─────────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        return tokenRepository.findAll().stream()
                .filter(t -> !t.getUsed()
                        && t.getExpiresAt().isAfter(LocalDateTime.now())
                        && passwordEncoder.matches(request.getToken(), t.getTokenHash()))
                .findFirst()
                .map(token -> merchantRepository.findById(token.getMerchantId())
                        .map(merchant -> {
                            merchant.setPassword(
                                    passwordEncoder.encode(request.getNewPassword())
                            );
                            merchantRepository.save(merchant);

                            token.setUsed(true);
                            tokenRepository.save(token);

                            log.info("Password reset successful for: {}", merchant.getEmail());

                            return ResponseEntity.ok(Map.of(
                                    "message", "Password reset successful. Please login with your new password."
                            ));
                        })
                        .orElse(ResponseEntity.badRequest()
                                .body(Map.of("error", "Merchant not found"))))
                .orElse(ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid or expired token. Please request a new one.")));
    }

    // ─────────────────────────────────────────
    // POST /v1/auth/change-password
    // ─────────────────────────────────────────
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {

        String merchantId = SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal().toString();

        return merchantRepository.findById(UUID.fromString(merchantId))
                .map(merchant -> {
                    if (!passwordEncoder.matches(request.getCurrentPassword(), merchant.getPassword())) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Current password is incorrect"));
                    }

                    merchant.setPassword(passwordEncoder.encode(request.getNewPassword()));
                    merchantRepository.save(merchant);

                    log.info("Password changed for merchant: {}", merchant.getEmail());

                    return ResponseEntity.ok(Map.of(
                            "message", "Password changed successfully."
                    ));
                })
                .orElse(ResponseEntity.badRequest()
                        .body(Map.of("error", "Merchant not found")));
    }
}
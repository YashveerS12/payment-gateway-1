package com.paymentgateway.apigateway.controller;

import com.paymentgateway.apigateway.config.JwtUtils;
import com.paymentgateway.apigateway.dto.*;
import com.paymentgateway.apigateway.model.Merchant;
import com.paymentgateway.apigateway.repository.MerchantRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class AuthController {

    private final MerchantRepository merchantRepository;
    private final JwtUtils jwtUtils;

    // POST /v1/merchants/register
    @PostMapping("/merchants/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterMerchantRequest request) {

        if (merchantRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("{\"error\": \"Email already registered\"}");
        }

        Merchant merchant = new Merchant();
        merchant.setName(request.getName());
        merchant.setEmail(request.getEmail());
        merchant.setCallbackUrl(request.getCallbackUrl());
        // Generate unique API key
        merchant.setApiKey("pgw_" + UUID.randomUUID().toString().replace("-", ""));

        merchantRepository.save(merchant);

        MerchantResponse res = new MerchantResponse();
        res.setId(merchant.getId());
        res.setName(merchant.getName());
        res.setEmail(merchant.getEmail());
        res.setApiKey(merchant.getApiKey());
        res.setCallbackUrl(merchant.getCallbackUrl());
        res.setRateLimit(merchant.getRateLimit());
        res.setIsActive(merchant.getIsActive());

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    // POST /v1/auth/token
    @PostMapping("/auth/token")
    public ResponseEntity<?> getToken(@Valid @RequestBody TokenRequest request) {

        return merchantRepository.findByApiKey(request.getApiKey())
            .filter(Merchant::getIsActive)
            .map(merchant -> {
                String token = jwtUtils.generateToken(merchant.getId().toString());
                return ResponseEntity.ok(new TokenResponse(token, "Bearer", 86400));
            })
            .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(null));
    }

    // GET /v1/merchants/me
    @GetMapping("/merchants/me")
    public ResponseEntity<?> getProfile() {
        // Read merchantId from Security Context
        String merchantId = SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal()
                .toString();

        return merchantRepository.findById(UUID.fromString(merchantId))
                .map(merchant -> {
                    MerchantResponse res = new MerchantResponse();
                    res.setId(merchant.getId());
                    res.setName(merchant.getName());
                    res.setEmail(merchant.getEmail());
                    res.setApiKey(merchant.getApiKey());
                    res.setCallbackUrl(merchant.getCallbackUrl());
                    res.setRateLimit(merchant.getRateLimit());
                    res.setIsActive(merchant.getIsActive());
                    return ResponseEntity.ok(res);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

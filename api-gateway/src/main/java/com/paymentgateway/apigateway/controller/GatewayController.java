package com.paymentgateway.apigateway.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class GatewayController {

    private final RestTemplate restTemplate;

    @Value("${payment-service.url:http://localhost:8081}")
    private String paymentServiceUrl;

    @Value("${recon-service.url:http://localhost:8082}")
    private String reconServiceUrl;

    @Value("${notification-service.url:http://localhost:3002}")
    private String notificationServiceUrl;

    // /v1/payments/** → :8081
    @RequestMapping("/v1/payments/**")
    public ResponseEntity<Object> routeToPaymentService(
            @RequestBody(required = false) Object body,
            HttpServletRequest request) {
        String merchantId = getMerchantId();
        String targetUrl = paymentServiceUrl + request.getRequestURI();
        String queryString = request.getQueryString();
        if (queryString != null) targetUrl += "?" + queryString;
        log.info("Routing {} {} → Payment Service", request.getMethod(), request.getRequestURI());
        return forward(targetUrl, body, request, merchantId);
    }

    // /v1/recon/export → special CSV handler
    @GetMapping("/v1/recon/export")
    public ResponseEntity<byte[]> exportRecon(
            @RequestParam String date,
            HttpServletRequest request) {

        String merchantId = getMerchantId();
        String targetUrl = reconServiceUrl + "/v1/recon/export?date=" + date;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Merchant-Id", merchantId);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    targetUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    byte[].class
            );

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=recon-" + date + ".csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(response.getBody());

        } catch (Exception e) {
            log.error("CSV export error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
    }

    // /v1/recon/** → :8082
    @RequestMapping("/v1/recon/**")
    public ResponseEntity<Object> routeToReconService(
            @RequestBody(required = false) Object body,
            HttpServletRequest request) {
        String merchantId = getMerchantId();
        String targetUrl = reconServiceUrl + request.getRequestURI();
        String queryString = request.getQueryString();
        if (queryString != null) targetUrl += "?" + queryString;
        log.info("Routing {} {} → Recon Service", request.getMethod(), request.getRequestURI());
        return forward(targetUrl, body, request, merchantId);
    }

    // /v1/webhooks/** → :3002
    @RequestMapping("/v1/webhooks/**")
    public ResponseEntity<Object> routeToNotificationService(
            @RequestBody(required = false) Object body,
            HttpServletRequest request) {
        String merchantId = getMerchantId();
        String targetUrl = notificationServiceUrl + request.getRequestURI();
        String queryString = request.getQueryString();

        // ← CHANGE THIS
        if (queryString != null) {
            targetUrl += "?" + queryString + "&merchantId=" + merchantId;
        } else {
            targetUrl += "?merchantId=" + merchantId;
        }

        log.info("Routing {} {} → Notification Service", request.getMethod(), request.getRequestURI());
        return forward(targetUrl, body, request, merchantId);
    }

    private ResponseEntity<Object> forward(String targetUrl, Object body,
                                           HttpServletRequest request, String merchantId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Merchant-Id", merchantId);

            String idempotencyKey = request.getHeader("Idempotency-Key");
            if (idempotencyKey != null) headers.set("Idempotency-Key", idempotencyKey);

            HttpEntity<Object> entity = new HttpEntity<>(body, headers);
            HttpMethod method = HttpMethod.valueOf(request.getMethod());

            return restTemplate.exchange(targetUrl, method, entity, Object.class);

        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Gateway routing error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Service unavailable: " + e.getMessage()));
        }
    }

    private String getMerchantId() {
        return SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal().toString();
    }
}
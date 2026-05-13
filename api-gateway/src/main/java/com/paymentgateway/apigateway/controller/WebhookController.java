package com.paymentgateway.apigateway.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final RestTemplate restTemplate;

    @Value("${notification-service.url:http://localhost:3001}")
    private String notificationServiceUrl;

    // GET /v1/webhooks/logs
    @GetMapping("/logs")
    public ResponseEntity<Object> getWebhookLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {

        String merchantId = SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal().toString();

        StringBuilder url = new StringBuilder(
                notificationServiceUrl + "/v1/webhooks/logs?page=" + page + "&size=" + size
        );
        if (status != null && !status.isEmpty()) {
            url.append("&status=").append(status);
        }
        url.append("&merchantId=").append(merchantId);

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Merchant-Id", merchantId);

        try {
            return restTemplate.exchange(
                    url.toString(),
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Object.class
            );
        } catch (Exception e) {
            // Return empty response if notification service not available
            return ResponseEntity.ok(Map.of(
                    "content", java.util.List.of(),
                    "totalElements", 0,
                    "totalPages", 0,
                    "message", "Notification service unavailable"
            ));
        }
    }

    // POST /v1/webhooks/{id}/retry
    @PostMapping("/{id}/retry")
    public ResponseEntity<Object> retryWebhook(@PathVariable String id) {

        String merchantId = SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal().toString();

        String url = notificationServiceUrl + "/v1/webhooks/" + id + "/retry";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Merchant-Id", merchantId);
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            return restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(headers),
                    Object.class
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Notification service unavailable"));
        }
    }

    // GET /v1/webhooks/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Object> getWebhookLog(@PathVariable String id) {

        String merchantId = SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal().toString();

        String url = notificationServiceUrl + "/v1/webhooks/" + id;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Merchant-Id", merchantId);

        try {
            return restTemplate.exchange(url, HttpMethod.GET,
                    new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
package com.paymentgateway.apigateway.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class MerchantResponse {
    private UUID id;
    private String name;
    private String email;
    private String apiKey;
    private String callbackUrl;
    private Integer rateLimit;
    private Boolean isActive;
}

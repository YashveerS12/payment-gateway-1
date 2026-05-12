package com.paymentgateway.apigateway.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TokenRequest {
    @NotBlank(message = "API key is required")
    private String apiKey;
}

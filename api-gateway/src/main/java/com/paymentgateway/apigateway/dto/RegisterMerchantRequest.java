package com.paymentgateway.apigateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterMerchantRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Please enter a valid email address")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Callback URL is required")
    @Pattern(regexp = "^https://.*", message = "Callback URL must start with https://")
    private String callbackUrl;
}
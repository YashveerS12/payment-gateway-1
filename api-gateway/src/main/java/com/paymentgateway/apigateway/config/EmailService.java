package com.paymentgateway.apigateway.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetEmail(String toEmail, String merchantName, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Payment Gateway — Password Reset Request");
            message.setText(
                    "Hello " + merchantName + ",\n\n" +
                            "We received a request to reset your Payment Gateway password.\n\n" +
                            "Your reset token (valid for 15 minutes only):\n\n" +
                            resetToken + "\n\n" +
                            "Enter this token on the reset password page to set your new password.\n\n" +
                            "If you did not request this, please ignore this email.\n" +
                            "Your password will remain unchanged.\n\n" +
                            "Security tip: Never share this token with anyone.\n\n" +
                            "Payment Gateway Team"
            );

            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send reset email: " + e.getMessage());
        }
    }
}
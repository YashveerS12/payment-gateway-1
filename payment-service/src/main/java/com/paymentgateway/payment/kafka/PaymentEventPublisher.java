package com.paymentgateway.payment.kafka;

import com.paymentgateway.payment.model.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.payment-initiated}")
    private String paymentInitiatedTopic;

    @Value("${kafka.topics.payment-completed}")
    private String paymentCompletedTopic;

    @Value("${kafka.topics.payment-failed}")
    private String paymentFailedTopic;

    // ─────────────────────────────────────────
    // Publish payment.initiated event
    // ─────────────────────────────────────────
    public void publishPaymentInitiated(Payment payment) {
        Map<String, Object> event = buildEvent(payment, "payment.initiated");

        kafkaTemplate.send(paymentInitiatedTopic,
                payment.getId().toString(),
                event);

        log.info("Published payment.initiated event for payment: {}",
                payment.getId());
    }

    // ─────────────────────────────────────────
    // Publish payment.completed event
    // ─────────────────────────────────────────
    public void publishPaymentCompleted(Payment payment) {
        Map<String, Object> event = buildEvent(payment, "payment.completed");

        kafkaTemplate.send(paymentCompletedTopic,
                payment.getId().toString(),
                event);

        log.info("Published payment.completed event for payment: {}",
                payment.getId());
    }

    // ─────────────────────────────────────────
    // Publish payment.failed event
    // ─────────────────────────────────────────
    public void publishPaymentFailed(Payment payment) {
        Map<String, Object> event = buildEvent(payment, "payment.failed");
        event.put("failureReason", payment.getFailureReason());

        kafkaTemplate.send(paymentFailedTopic,
                payment.getId().toString(),
                event);

        log.info("Published payment.failed event for payment: {}",
                payment.getId());
    }

    // ─────────────────────────────────────────
    // Helper — Build event payload
    // ─────────────────────────────────────────
    private Map<String, Object> buildEvent(Payment payment, String eventType) {
        Map<String, Object> event = new HashMap<>();

        // Event metadata
        event.put("eventId",    "evt_" + payment.getId().toString().substring(0, 8));
        event.put("eventType",  eventType);
        event.put("timestamp",  LocalDateTime.now().toString());

        // Payment payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentId",   payment.getId().toString());
        payload.put("merchantId",  payment.getMerchantId().toString());
        payload.put("amount",      payment.getAmount());
        payload.put("currency",    payment.getCurrency());
        payload.put("status",      payment.getStatus().name());
        payload.put("bankAdapter", payment.getBankAdapter());
        payload.put("bankRefId",   payment.getBankRefId());

        event.put("payload", payload);

        return event;
    }
}
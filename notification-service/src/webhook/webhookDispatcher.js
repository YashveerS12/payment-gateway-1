const axios = require('axios');
const WebhookLog = require('../models/webhookLog');

// Exponential backoff delays (in ms)
// Attempt 1 → 30 seconds
// Attempt 2 → 60 seconds
// Attempt 3 → 120 seconds
const RETRY_DELAYS = [30000, 60000, 120000];

const webhookDispatcher = {

  // ─────────────────────────────────────────
  // Dispatch webhook to merchant
  // ─────────────────────────────────────────
  async dispatch(webhookLogId, merchantId, callbackUrl, payload) {
    console.log(`Dispatching webhook to: ${callbackUrl}`);

    // Get current log
    const logs = await WebhookLog.getPendingRetries();
    const log = logs.find(l => l.id === webhookLogId);
    const attemptCount = log ? log.attempt_count + 1 : 1;

    try {
      // POST to merchant's callback URL
      const response = await axios.post(callbackUrl, payload, {
        timeout: 5000,  // 5 second timeout
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'payment-gateway'
        }
      });

      // SUCCESS — merchant responded with 2xx
      await WebhookLog.updateAttempt({
        id:           webhookLogId,
        status:       'DELIVERED',
        responseCode: response.status,
        attemptCount: attemptCount,
        nextRetryAt:  null
      });

      console.log(` Webhook delivered to ${callbackUrl} | Status: ${response.status}`);
      return true;

    } catch (error) {
      const responseCode = error.response?.status || 0;
      console.error(` Webhook failed for ${callbackUrl} | Attempt: ${attemptCount}`);

      // Check if we should retry
      if (attemptCount < 3) {
        // Calculate next retry time
        const delayMs = RETRY_DELAYS[attemptCount - 1];
        const nextRetryAt = new Date(Date.now() + delayMs);

        await WebhookLog.updateAttempt({
          id:           webhookLogId,
          status:       'PENDING',
          responseCode: responseCode,
          attemptCount: attemptCount,
          nextRetryAt:  nextRetryAt
        });

        console.log(`Retry scheduled at: ${nextRetryAt}`);
      } else {
        // Max retries reached — mark as FAILED
        await WebhookLog.updateAttempt({
          id:           webhookLogId,
          status:       'FAILED',
          responseCode: responseCode,
          attemptCount: attemptCount,
          nextRetryAt:  null
        });

        console.log(` Webhook permanently failed after 3 attempts`);
      }

      return false;
    }
  },

  // ─────────────────────────────────────────
  // Send webhook for a payment event
  // ─────────────────────────────────────────
  async sendWebhook(eventType, paymentData) {
    const { merchantId, paymentId } = paymentData;

    // Get merchant callback URL
    const callbackUrl = await WebhookLog.getMerchantCallbackUrl(merchantId);

    if (!callbackUrl) {
      console.log(`No callback URL for merchant: ${merchantId}`);
      return;
    }

    // Build webhook payload
    const payload = {
      eventType,
      paymentId,
      merchantId,
      data: paymentData,
      timestamp: new Date().toISOString()
    };

    // Save to DB first
    const log = await WebhookLog.create({
      paymentId,
      merchantId,
      eventType,
      payload
    });

    // Dispatch immediately
    await this.dispatch(log.id, merchantId, callbackUrl, payload);
  }
};

module.exports = webhookDispatcher;
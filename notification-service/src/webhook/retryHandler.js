const WebhookLog = require('../models/webhookLog');
const webhookDispatcher = require('./webhookDispatcher');

// Runs every 30 seconds
// Picks up all pending webhooks and retries them
const RETRY_INTERVAL_MS = 30000;

const retryHandler = {

  // ─────────────────────────────────────────
  // Start retry scheduler
  // ─────────────────────────────────────────
  start() {
    console.log('🔄 Webhook retry scheduler started');

    setInterval(async () => {
      await this.processPendingRetries();
    }, RETRY_INTERVAL_MS);
  },

  // ─────────────────────────────────────────
  // Process all pending retries
  // ─────────────────────────────────────────
  async processPendingRetries() {
    try {
      // Get all webhooks that need retry
      const pendingWebhooks = await WebhookLog.getPendingRetries();

      if (pendingWebhooks.length === 0) return;

      console.log(`🔄 Processing ${pendingWebhooks.length} pending webhooks`);

      // Process each pending webhook
      for (const webhook of pendingWebhooks) {

        // Get merchant callback URL
        const callbackUrl = await WebhookLog.getMerchantCallbackUrl(
          webhook.merchant_id
        );

        if (!callbackUrl) {
          console.log(`No callback URL for merchant: ${webhook.merchant_id}`);
          continue;
        }

        // Retry dispatch
        let payload;
        try {
          payload = typeof webhook.payload === 'string' 
            ? JSON.parse(webhook.payload) 
            : webhook.payload;
        } catch (e) {
          payload = {};
        }
        
        await webhookDispatcher.dispatch(
          webhook.id,
          webhook.merchant_id,
          callbackUrl,
          payload
        );
      }

    } catch (error) {
      console.error('❌ Retry handler error:', error.message);
    }
  }
};

module.exports = retryHandler;
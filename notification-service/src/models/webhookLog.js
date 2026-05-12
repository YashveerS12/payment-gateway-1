const pool = require('../config/db');

const WebhookLog = {

  // Create new webhook log entry
  async create({ paymentId, merchantId, eventType, payload }) {
    const query = `
      INSERT INTO webhook_logs 
        (payment_id, merchant_id, event_type, payload, attempt_count, status)
      VALUES 
        ($1, $2, $3, $4, 0, 'PENDING')
      RETURNING *
    `;
    const values = [paymentId, merchantId, eventType, JSON.stringify(payload)];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Update webhook log after delivery attempt
  async updateAttempt({ id, status, responseCode, attemptCount, nextRetryAt }) {
    const query = `
      UPDATE webhook_logs
      SET 
        status          = $1,
        response_code   = $2,
        attempt_count   = $3,
        next_retry_at   = $4,
        last_attempt_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    const values = [status, responseCode, attemptCount, nextRetryAt, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get pending webhooks that need retry
  async getPendingRetries() {
    const query = `
      SELECT * FROM webhook_logs
      WHERE status = 'PENDING'
        AND attempt_count < 3
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Get merchant callback URL
  async getMerchantCallbackUrl(merchantId) {
    const query = `
      SELECT callback_url FROM merchants
      WHERE id = $1 AND is_active = true
    `;
    const result = await pool.query(query, [merchantId]);
    return result.rows[0]?.callback_url;
  }
};

module.exports = WebhookLog;
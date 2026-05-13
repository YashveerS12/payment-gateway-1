const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /v1/webhooks/logs
router.get('/logs', async (req, res) => {
  const { page = 0, size = 10, status, merchantId } = req.query;
  const offset = page * size;

  try {
    let query = `
      SELECT 
        wl.id,
        wl.payment_id,
        wl.merchant_id,
        wl.event_type,
        wl.attempt_count,
        wl.response_code,
        wl.status,
        wl.last_attempt_at,
        wl.created_at,
        m.callback_url as callback_url
      FROM webhook_logs wl
      LEFT JOIN merchants m ON wl.merchant_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (merchantId) {
      params.push(merchantId);
      query += ` AND wl.merchant_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND wl.status = $${params.length}`;
    }

    query += ` ORDER BY wl.created_at DESC`;

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM webhook_logs wl WHERE 1=1 
       ${merchantId ? `AND wl.merchant_id = '${merchantId}'` : ''}
       ${status ? `AND wl.status = '${status}'` : ''}`
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    params.push(parseInt(size));
    query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      content: result.rows,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      page: parseInt(page),
      size: parseInt(size)
    });

  } catch (err) {
    console.error('Error fetching webhook logs:', err);
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

// GET /v1/webhooks/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM webhook_logs WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch webhook log' });
  }
});

// POST /v1/webhooks/:id/retry
router.post('/:id/retry', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE webhook_logs 
       SET status = 'PENDING', attempt_count = 0, next_retry_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook log not found' });
    res.json({ message: 'Retry scheduled', log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule retry' });
  }
});

module.exports = router;
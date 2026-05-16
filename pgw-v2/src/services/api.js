const BASE_URL = '';

// POST/PUT — needs Content-Type
const postHeaders = (token, idempotencyKey = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  return headers;
};

// GET — NO Content-Type (avoids CORS preflight)
const getAuthHeaders = (token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// ─── Auth APIs ───────────────────────────────
export const registerMerchant = async (data) => {
  const res = await fetch(`${BASE_URL}/v1/merchants/register`, {
    method: 'POST', headers: postHeaders(), body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
};

export const loginMerchant = async (email, password) => {
  const res = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST', headers: postHeaders(),
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Invalid email or password');
  return res.json();
};

export const getMerchantProfile = async (token) => {
  const res = await fetch(`${BASE_URL}/v1/merchants/me`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to get profile');
  return res.json();
};

// ─── Payment APIs ─────────────────────────────
export const initiatePayment = async (token, idempotencyKey, data) => {
  const res = await fetch(`${BASE_URL}/v1/payments`, {
    method: 'POST',
    headers: postHeaders(token, idempotencyKey),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Payment failed');
  }
  return res.json();
};

export const listPayments = async (token, page = 0, size = 10, status = '') => {
  const params = new URLSearchParams({ page, size });
  if (status) params.append('status', status);
  const res = await fetch(`${BASE_URL}/v1/payments?${params}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
};

export const getPaymentById = async (token, id) => {
  const res = await fetch(`${BASE_URL}/v1/payments/${id}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Payment not found');
  return res.json();
};

export const getPaymentStatus = async (token, id) => {
  const res = await fetch(`${BASE_URL}/v1/payments/${id}/status`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to get status');
  return res.json();
};

// ─── Recon APIs — all through Gateway :8080 ───
export const triggerRecon = async (token, date) => {
  const res = await fetch(`${BASE_URL}/v1/recon/trigger?date=${date}`, {
    method: 'POST',
    headers: postHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to trigger recon');
  return res.json();
};

export const getReconSummary = async (token, date) => {
  const res = await fetch(`${BASE_URL}/v1/recon/summary?date=${date}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('No recon data for this date');
  return res.json();
};

export const getReconMismatches = async (token, date, type = '') => {
  const params = new URLSearchParams({ date });
  if (type) params.append('type', type);
  const res = await fetch(`${BASE_URL}/v1/recon/mismatches?${params}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch mismatches');
  return res.json();
};

export const exportReconCsv = async (token, date) => {
  const res = await fetch(`${BASE_URL}/v1/recon/export?date=${date}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `recon-${date}.csv`; a.click();
  window.URL.revokeObjectURL(url);
};

// ─── Webhook APIs ─────────────────────────────
export const getWebhookLogs = async (token, page = 0, size = 10, status = '') => {
  const params = new URLSearchParams({ page, size });
  if (status) params.append('status', status);
  const res = await fetch(`${BASE_URL}/v1/webhooks/logs?${params}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch webhook logs');
  return res.json();
};

export const retryWebhook = async (token, id) => {
  const res = await fetch(`${BASE_URL}/v1/webhooks/${id}/retry`, {
    method: 'POST', headers: postHeaders(token)
  });
  if (!res.ok) throw new Error('Retry failed');
  return res.json();
};
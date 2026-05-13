require('dotenv').config();
const express = require('express');
const { startConsumer } = require('./src/consumers/paymentConsumer');
const webhookRoutes = require('./src/routes/webhookRoutes');

const app = express();
app.use(express.json());

// CORS for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const PORT = process.env.PORT || 3002;

// Health check
app.get('/actuator/health', (req, res) => {
  res.json({ status: 'UP', service: 'notification-service' });
});

// Webhook routes
app.use('/v1/webhooks', webhookRoutes);

// Start Express server
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

// Start Kafka consumer
startConsumer().catch(err => {
  console.error('Failed to start Kafka consumer:', err);
  process.exit(1);
});
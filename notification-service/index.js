require('dotenv').config();
const express = require('express');
const { startConsumer } = require('./src/consumers/paymentConsumer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/actuator/health', (req, res) => {
  res.json({ status: 'UP', service: 'notification-service' });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

// Start Kafka consumer
startConsumer().catch(err => {
  console.error('Failed to start Kafka consumer:', err);
  process.exit(1);
});
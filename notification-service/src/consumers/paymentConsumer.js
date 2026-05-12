const { consumer } = require('../config/kafka');
const webhookDispatcher = require('../webhook/webhookDispatcher');
const retryHandler = require('../webhook/retryHandler');

const TOPICS = {
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED:    'payment.failed'
};

const startConsumer = async () => {
  try {
    // Connect to Kafka
    await consumer.connect();
    console.log('✅ Kafka consumer connected');

    // Subscribe to all payment topics
    await consumer.subscribe({
      topics: [
        TOPICS.PAYMENT_INITIATED,
        TOPICS.PAYMENT_COMPLETED,
        TOPICS.PAYMENT_FAILED
      ],
      fromBeginning: false  // only new messages
    });

    console.log('✅ Subscribed to topics:', Object.values(TOPICS));

    // Start retry handler in background
    retryHandler.start();

    // Process messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          // Parse message
          const event = JSON.parse(message.value.toString());
          console.log(`📨 Received event: ${topic} | PaymentId: ${event.payload?.paymentId}`);

          // Handle based on topic
          switch (topic) {

            case TOPICS.PAYMENT_COMPLETED:
              console.log(`✅ Payment completed: ${event.payload?.paymentId}`);
              await webhookDispatcher.sendWebhook(
                'payment.completed',
                event.payload
              );
              break;

            case TOPICS.PAYMENT_FAILED:
              console.log(`❌ Payment failed: ${event.payload?.paymentId}`);
              await webhookDispatcher.sendWebhook(
                'payment.failed',
                event.payload
              );
              break;

            case TOPICS.PAYMENT_INITIATED:
              // Just log — no webhook needed for initiated
              console.log(`🚀 Payment initiated: ${event.payload?.paymentId}`);
              break;

            default:
              console.log(`Unknown topic: ${topic}`);
          }

        } catch (error) {
          console.error('❌ Error processing message:', error.message);
        }
      }
    });

  } catch (error) {
    console.error('❌ Kafka consumer failed to start:', error.message);
    throw error;
  }
};

// Graceful shutdown
const stopConsumer = async () => {
  await consumer.disconnect();
  console.log('Kafka consumer disconnected');
};

process.on('SIGTERM', stopConsumer);
process.on('SIGINT',  stopConsumer);

module.exports = { startConsumer, stopConsumer };
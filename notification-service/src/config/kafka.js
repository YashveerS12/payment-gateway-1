const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Producer — for future use
const producer = kafka.producer();

// Consumer — listens to payment events
const consumer = kafka.consumer({
  groupId: 'notification-service-group'
});

module.exports = { kafka, producer, consumer };
# 💳 Distributed Payment Gateway

A backend-heavy, production-grade distributed payment system built with **Spring Boot**, **Apache Kafka**, **PostgreSQL**, **Redis**, and **Node.js**.

---

## 🏗️ Architecture

```
Merchant / Client
      │
      ▼  HTTPS / REST
┌─────────────┐
│ API Gateway │  :8080  — Auth, JWT, Rate Limiting
└──────┬──────┘
       │
  ┌────┼──────────────┐
  ▼    ▼              ▼
Payment Svc   Notification Svc   Recon Svc
  :8081           :3000            :8082
  │                │
  └────────────────┘
          │
      Apache Kafka
          │
  ┌───────┴────────┐
  │                │
PostgreSQL        Redis
(Primary DB)    (Cache + Idempotency)
```

---

## 🚀 Quick Start (One Command)

```bash
git clone https://github.com/YashveerS12/payment-gateway
cd payment-gateway
docker-compose up --build
```

| Service         | URL                          |
|-----------------|------------------------------|
| API Gateway     | http://localhost:8080        |
| Payment Service | http://localhost:8081        |
| Notification    | http://localhost:3000        |
| Recon Service   | http://localhost:8082        |
| Kafka UI        | http://localhost:9000        |
| PostgreSQL      | localhost:5432               |
| Redis           | localhost:6379               |

---

## 🧰 Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| API Gateway  | Spring Boot 3.x + Spring Security   |
| Payment Svc  | Spring Boot 3.x + JPA               |
| Notification | Node.js 20.x + Express              |
| Recon        | Spring Boot + Spring Batch 5.x      |
| Message Bus  | Apache Kafka 3.6                    |
| Primary DB   | PostgreSQL 16                       |
| Cache        | Redis 7.x                           |
| Container    | Docker + Docker Compose             |

---

## 📡 Key Kafka Topics

| Topic               | Partitions | Producer        | Consumer            |
|---------------------|------------|-----------------|---------------------|
| payment.initiated   | 3          | Payment Service | Notification Svc    |
| payment.completed   | 3          | Payment Service | Notification Svc    |
| payment.failed      | 3          | Payment Service | Notification Svc    |
| recon.completed     | 1          | Recon Service   | Reporting API       |

---

## 🗄️ Database Tables

- **merchants** — API keys, callback URLs, rate limits
- **payments** — Full payment lifecycle with idempotency
- **webhook_logs** — Delivery attempts with retry tracking
- **recon_records** — Daily reconciliation mismatches

---

## 🔑 Key Design Patterns

- **Idempotency** — Redis-based deduplication (24h TTL) for exactly-once payment processing
- **Strategy Pattern** — Pluggable bank adapters (HDFC, ICICI, SBI, AXIS)
- **Event-Driven** — Loose coupling via Kafka; services don't call each other directly
- **Exponential Backoff** — Webhook retry with 3 attempts
- **Spring Batch** — Daily reconciliation job at 2 AM

---

## 📁 Project Structure

```
payment-gateway/
├── api-gateway/          ← Spring Boot (Port 8080)
├── payment-service/      ← Spring Boot (Port 8081)
├── notification-service/ ← Node.js    (Port 3000)
├── recon-service/        ← Spring Batch (Port 8082)
├── docker-compose.yml
├── init-db.sql
└── README.md
```

---

## 🧪 Test with Postman

Import the collection from `/postman/payment-gateway.json` and set:
- `base_url` = `http://localhost:8080`
- `api_key` = `test-api-key-demo-1234567890abcdef`

---

## 💼 Interview Talking Points

- Idempotency & exactly-once semantics
- CAP theorem trade-offs
- Kafka partitioning strategy
- Eventual consistency in distributed systems
- Strategy pattern for extensible bank routing
- Redis TTL management
- Webhook retry with exponential backoff

---

*Built by Yashveer Singh — Resume Project Portfolio 2025*

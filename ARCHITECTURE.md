# Architecture Overview: Cortex AI

Cortex AI is designed with a **Decoupled Telemetry Architecture**. This design separates the user-facing application state from the analytical telemetry pipeline to ensure system stability under high load.

## 📡 Ingestion Flow

The life of a request in Cortex follows this path:

1. **Client Submission:** User sends a message via the Next.js frontend.
2. **Smart Routing:** The Edge API Route inspects the prompt and selects the optimal model (8B vs 70B).
3. **Response Streaming:** The Vercel AI SDK begins streaming the LLM response back to the user immediately.
4. **Asynchronous Background Task:** Using the Next.js `after()` API, the route triggers two parallel tasks *after* the response is sent:
    - **App State:** The redacted message is saved to **SQLite** (Prisma) for session history.
    - **Telemetry:** A rich inference event is produced to **Kafka**.
5. **Ingestion Worker:** A standalone Node.js process (using `kafkajs`) consumes from Kafka and performs bulk inserts into **ClickHouse**.

## ⚖️ Tradeoffs & Design Decisions

### Decoupling App State from Telemetry
By moving analytical logging to a Kafka -> ClickHouse pipeline, we avoid the "API Bottleneck" common in traditional architectures. If the telemetry database experiences high latency or downtime, the **User Experience is unaffected** because the Kafka producer operates in a non-blocking "fire-and-forget" mode.

- **SQLite:** Handles lightweight, relational session data for fast UI loads.
- **ClickHouse:** Handles heavy, time-series telemetry data for sub-second analytical queries.

### Compute Optimization
The **Smart Routing** heuristic achieves a significant reduction in operational cost and latency. By offloading simple greetings and short queries to the **8B parameter model**, we reserve the high-compute **70B parameter model** only for tasks where its reasoning depth is actually required.

## 🔒 Security: PII Redaction
The redaction utility is integrated at the **Ingestion Level**. This ensures that while the LLM receives the full context of the user's query, the persistent storage (ClickHouse and SQLite) never contains sensitive data like emails or phone numbers, significantly reducing the PII footprint of the entire organization.

## 🛠 Key Features

### 1. Smart Model Routing (Auto-Route)
Cortex intelligently chooses the best model for the job. By default, it inspects your prompt length:
- **Short Prompts (< 150 chars):** Uses `Llama 3.1 8B` for near-instant responses.
- **Complex Prompts (≥ 150 chars):** Uses `Llama 3.3 70B` for high-reasoning tasks.

### 2. Built-in PII Redaction
Privacy is a first-class citizen. Before any user message is persisted to the database or logged to telemetry, it passes through an optimized regex-based redaction engine that automatically masks **Email Addresses** and **Phone Numbers**.

### 3. Event-Driven Observability
Unlike standard apps that block the main thread to save logs, Cortex fires telemetry events to **Kafka**. A separate ingestion worker then handles the storage in **ClickHouse**, allowing the chat API to return responses immediately.

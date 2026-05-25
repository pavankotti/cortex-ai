import { Kafka } from 'kafkajs'
import { createClient } from '@clickhouse/client'

const kafka = new Kafka({
  clientId: 'clickhouse-ingestor',
  brokers: ['localhost:9092'],
})

const clickhouse = createClient({
  url: 'http://localhost:8123',
})

const consumer = kafka.consumer({ groupId: 'clickhouse-ingestion-group' })

async function run() {
  console.log('Connecting to Kafka...')
  await consumer.connect()
  console.log('Subscribing to topic: llm-inference-logs')
  await consumer.subscribe({ topic: 'llm-inference-logs', fromBeginning: true })

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return

      try {
        const rawValue = message.value.toString()
        const logData = JSON.parse(rawValue)

        console.log(`Ingesting log to ClickHouse: ${logData.id}`)

        // ClickHouse DateTime expects 'YYYY-MM-DD HH:MM:SS'
        // ISO string is 'YYYY-MM-DDTHH:MM:SS.mmmZ'
        const formattedTimestamp = logData.timestamp
          .replace('T', ' ')
          .replace(/\..*$/, '');

        // Format for ClickHouse insertion
        await clickhouse.insert({
          table: 'inference_logs',
          values: [
            {
              id: logData.id,
              sessionId: logData.sessionId,
              timestamp: formattedTimestamp,
              model: logData.model,
              provider: logData.provider,
              latency_ms: logData.latency_ms,
              prompt_tokens: logData.prompt_tokens,
              completion_tokens: logData.completion_tokens,
              redacted_prompt: logData.redacted_prompt,
            },
          ],
          format: 'JSONEachRow',
        })

        console.log('Log ingested successfully.')
      } catch (error) {
        console.error('Error processing Kafka message for ClickHouse:', error)
      }
    },
  })
}

run().catch(error => {
  console.error('Fatal error in Kafka Consumer:', error)
  process.exit(1)
})

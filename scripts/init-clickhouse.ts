import { createClient } from '@clickhouse/client'
import { Kafka } from 'kafkajs'

async function initInfra() {
  // --- ClickHouse Setup ---
  const clickhouse = createClient({
    url: 'http://localhost:8123',
  })

  console.log('Connecting to ClickHouse...')

  try {
    // Use .command() for DDL (Data Definition Language) to avoid stream warnings
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS inference_logs (
          id UUID,
          sessionId String,
          timestamp DateTime,
          model String,
          provider String,
          latency_ms Int32,
          prompt_tokens Int32,
          completion_tokens Int32,
          redacted_prompt String
        ) ENGINE = MergeTree()
        ORDER BY timestamp
      `,
    })
    console.log('✅ ClickHouse: Table "inference_logs" ensured.')
  } catch (error) {
    console.error('❌ ClickHouse Error:', error)
  } finally {
    await clickhouse.close()
  }

  // --- Kafka Setup ---
  const kafka = new Kafka({
    clientId: 'infra-init',
    brokers: ['localhost:9092'],
  })

  const admin = kafka.admin()
  console.log('Connecting to Kafka Admin...')

  try {
    await admin.connect()
    const topics = await admin.listTopics()
    
    if (!topics.includes('llm-inference-logs')) {
      console.log('Creating Kafka topic: llm-inference-logs...')
      await admin.createTopics({
        topics: [{
          topic: 'llm-inference-logs',
          numPartitions: 1,
          replicationFactor: 1,
        }],
      })
      console.log('✅ Kafka: Topic "llm-inference-logs" created.')
    } else {
      console.log('ℹ️ Kafka: Topic "llm-inference-logs" already exists.')
    }
  } catch (error) {
    console.error('❌ Kafka Error:', error)
  } finally {
    await admin.disconnect()
  }
}

initInfra().catch(console.error)

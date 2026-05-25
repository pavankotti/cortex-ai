import { Kafka, Partitioners } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'cortex-logger',
  brokers: ['localhost:9092'],
})

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
})

/**
 * Produces a telemetry log message to the Kafka 'llm-inference-logs' topic.
 * Gracefully handles connection/disconnection and logs errors without crashing the app.
 */
export async function produceLog(logData: any) {
  try {
    await producer.connect()
    await producer.send({
      topic: 'llm-inference-logs',
      messages: [
        { value: JSON.stringify(logData) },
      ],
    })
    console.log('Kafka: Log produced to llm-inference-logs')
  } catch (error) {
    console.error('Kafka Error: Failed to produce log message:', error)
  } finally {
    try {
      await producer.disconnect()
    } catch (disconnectError) {
      console.error('Kafka Error: Failed to disconnect producer:', disconnectError)
    }
  }
}

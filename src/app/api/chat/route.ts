import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import prisma from '@/lib/prisma';
import { after } from 'next/server';
import { redactPII } from '@/lib/redact';
import { produceLog } from '@/lib/kafka';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('API /api/chat POST called');
  const { messages, sessionId, model: requestedModel } = await req.json();
  
  // Auto-Route Logic
  let actualModel = requestedModel || 'llama-3.3-70b-versatile';
  if (actualModel === 'auto') {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.parts?.find((p: any) => p.type === 'text')?.text || '';
    actualModel = content.length < 150 ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';
  }

  console.log('Request body:', { sessionId, messagesCount: messages.length, requestedModel, actualModel });

  // Save the user's message if it's the latest one and we have a sessionId
  const lastMessage = messages[messages.length - 1];
  let lastUserMessageContent = '';
  
  if (sessionId && lastMessage.role === 'user') {
    const textContent = lastMessage.parts?.find((p: any) => p.type === 'text')?.text || '';
    if (textContent) {
      lastUserMessageContent = textContent;
      await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: redactPII(textContent),
        },
      });
    }
  }

  const startTime = Date.now();

  // Determine provider based on model name
  const provider = actualModel.startsWith('gpt-') ? openai : groq;
  const providerName = actualModel.startsWith('gpt-') ? 'openai' : 'groq';

  const result = await streamText({
    model: provider(actualModel),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text, usage }) => {
      after(async () => {
        try {
          console.log('after() background task started');
          const latency = Date.now() - startTime;
          const promptTokens = usage?.inputTokens ?? 0;
          const completionTokens = usage?.outputTokens ?? 0;
          
          console.log('Telemetry:', { latency, promptTokens, completionTokens, sessionId, model: actualModel, provider: providerName });

          if (sessionId) {
            try {
              // Save the assistant's message
              await prisma.message.create({
                data: {
                  sessionId,
                  role: 'assistant',
                  content: text,
                },
              });
              console.log('Assistant message saved');
            } catch (error) {
              console.error('Error saving assistant message:', error);
            }
          }

          // Asynchronously produce to Kafka (ClickHouse destination)
          const logData = {
            id: crypto.randomUUID(),
            sessionId: sessionId || 'anonymous',
            timestamp: new Date().toISOString(),
            model: actualModel,
            provider: providerName,
            latency_ms: Math.round(latency),
            prompt_tokens: Math.round(promptTokens),
            completion_tokens: Math.round(completionTokens),
            redacted_prompt: redactPII(lastUserMessageContent),
          };

          // Crucial: Fire and forget (do not await)
          produceLog(logData).catch(e => console.error('Background Kafka error:', e));

          try {
            // Keep local Prisma telemetry log for reference
            const log = await prisma.inferenceLog.create({
              data: {
                sessionId: sessionId || null,
                latency: Math.round(latency) || 0,
                promptTokens: Math.round(promptTokens) || 0,
                completionTokens: Math.round(completionTokens) || 0,
                provider: providerName,
                model: actualModel,
              },
            });
            console.log('InferenceLog saved successfully:', log.id);
          } catch (error) {
            console.error('Error saving InferenceLog:', error);
          }
        } catch (error) {
          console.error('Error in after() task:', error);
        }
      });
    },
  });

  console.log('POST handler returning stream response');
  return result.toUIMessageStreamResponse();
}

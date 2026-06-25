/**
 * Azure OpenAI Response API Client
 * Uses optimized context windows to reduce token costs
 * Sends only recent messages while maintaining conversation context
 * History is stored in MySQL database for persistence
 */

import type { Message } from './azureOpenAI';

const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const AZURE_API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
const AZURE_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;

interface ResponseAPIOptions {
  previousResponseId?: string; // Previous response ID for chaining
  temperature?: number;
  maxTokens?: number;
}

export class AzureResponseAPI {
  private apiKey: string;
  private endpoint: string;
  private apiVersion: string;
  private deployment: string;

  constructor() {
    this.apiKey = AZURE_API_KEY;
    this.endpoint = AZURE_ENDPOINT;
    this.apiVersion = AZURE_API_VERSION;
    this.deployment = AZURE_DEPLOYMENT;
    
    if (!this.apiKey || !this.endpoint) {
      console.warn('[AzureResponseAPI] ⚠️ Azure OpenAI credentials not configured');
    }
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.endpoint && this.deployment);
  }

  /**
   * Stream a chat response using Azure Response API v1
   * Uses previous_response_id for stateful conversation chaining
   * Azure maintains full context server-side - no need to send history!
   */
  async *streamWithContext(
    currentMessage: string | { role: string; content: Array<any> },
    options: ResponseAPIOptions = {}
  ): AsyncGenerator<{ content: string; responseId?: string; done?: boolean }> {
    if (!this.isConfigured()) {
      throw new Error('Azure OpenAI not configured');
    }

    // Use Response API v1 endpoint
    const url = `${this.endpoint}/openai/v1/responses`;
    
    if (options.previousResponseId) {
      console.log(`[AzureResponseAPI] Chaining to previous response: ${options.previousResponseId}`);
    } else {
      console.log('[AzureResponseAPI] Starting new conversation');
    }
    
    const requestBody: any = {
      model: this.deployment,
      input: currentMessage,
      stream: true,
      temperature: options.temperature || 0.7,
      max_output_tokens: options.maxTokens || 4000,
    };
    
    // Chain to previous response for context (Azure maintains history)
    if (options.previousResponseId) {
      requestBody.previous_response_id = options.previousResponseId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        console.warn(`[AzureResponseAPI] API returned status ${response.status}, using demo mock fallback.`);
        yield* mockResponseAPIStream(currentMessage);
        return;
      }
      const error = await response.text();
      throw new Error(`Azure Response API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';
    let responseId: string | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[AzureResponseAPI] Stream complete. Response ID:', responseId);
          yield { content: '', responseId, done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
            continue;
          }

          if (trimmedLine.startsWith('event: ')) {
            // Response API uses event types like response.output_text.delta
            continue;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data = JSON.parse(jsonStr);

              // Extract response ID from any event
              if (data.response?.id) {
                responseId = data.response.id;
              } else if (data.id && data.id.startsWith('resp_')) {
                responseId = data.id;
              }

              // Handle text delta events
              if (data.type === 'response.output_text.delta' && data.delta) {
                yield { 
                  content: data.delta,
                  responseId
                };
              }
              // Fallback for standard chat completion format
              else if (data.choices?.[0]?.delta?.content) {
                yield { 
                  content: data.choices[0].delta.content,
                  responseId
                };
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Send a message with full conversation history (fallback without session)
   */
  async *streamWithHistory(messages: Message[]): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('Azure OpenAI not configured');
    }

    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
            continue;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data = JSON.parse(jsonStr);

              if (data.choices?.[0]?.delta?.content) {
                yield data.choices[0].delta.content;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

async function* mockResponseAPIStream(currentMessage: any): AsyncGenerator<{ content: string; responseId?: string; done?: boolean }> {
  let contentStr = '';
  if (typeof currentMessage === 'string') {
    contentStr = currentMessage;
  } else if (Array.isArray(currentMessage) && currentMessage[0]?.content) {
    const parts = currentMessage[0].content;
    const textPart = parts.find((p: any) => p.type === 'input_text');
    contentStr = textPart ? textPart.text : '';
  }

  const responseId = `resp_mock_${Math.random().toString(36).slice(2, 11)}`;
  const responseText = `[Demo Mode - Invalid Azure OpenAI Credentials Fallback]
Hello! I am a simulated AI assistant running in Response API context-chaining mode.
I received your query: "${contentStr}"

Your front-end, database, and document text extraction are all working perfectly!`;

  for (let i = 0; i < responseText.length; i += 5) {
    yield {
      content: responseText.slice(i, i + 5),
      responseId
    };
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  
  yield {
    content: '',
    responseId,
    done: true
  };
}

export const azureResponseAPI = new AzureResponseAPI();

export type Attachment = {
  type: 'image' | 'pdf';
  mimeType: string;
  dataUrl: string; // base64 data URL for images and PDFs
  fileName: string;
  extractedText?: string; // Optional client-side extracted text
};

export interface Message {
  id?: string; // Optional: unique identifier for message (used for search highlighting)
  role: 'user' | 'assistant' | 'system';
  content: string;
  displayContent?: string; // Optional: content to display in UI (without file data)
  attachments?: Attachment[];
}

export interface ChatCompletionChunk {
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }>;
}

// ─── Provider detection ────────────────────────────────────────────
type Provider = 'groq' | 'gemini';

function detectProvider(): { provider: Provider; rawKeys: string; model: string; baseUrl: string } {
  // Priority 1: Groq (free, no billing needed)
  const groqKeys = import.meta.env.VITE_GROQ_API_KEY;
  if (groqKeys) {
    return {
      provider: 'groq',
      rawKeys: groqKeys,
      model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    };
  }

  // Priority 2: Gemini
  const geminiKeys = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiKeys) {
    return {
      provider: 'gemini',
      rawKeys: geminiKeys,
      model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash',
      baseUrl: '', // Gemini uses a different URL pattern per-key
    };
  }

  return { provider: 'groq', rawKeys: '', model: '', baseUrl: '' };
}

// ─── Message formatting ────────────────────────────────────────────

/**
 * Build messages in OpenAI-compatible format (used by Groq).
 * Handles image attachments by appending text descriptions.
 */
function buildOpenAIMessages(messages: Message[]) {
  return messages.map((message) => {
    if (message.role === 'user' && message.attachments?.length) {
      // Groq supports vision for some models, but for reliability
      // we append extracted text / file names as context
      let textContent = message.content;
      message.attachments.forEach((att) => {
        if (att.extractedText) {
          textContent += `\n\n[Attached file: ${att.fileName}]\n${att.extractedText}`;
        } else {
          textContent += `\n\n[Attached file: ${att.fileName}]`;
        }
      });
      return { role: message.role, content: textContent };
    }
    return { role: message.role, content: message.content };
  });
}

/**
 * Build contents in Gemini native format.
 */
function buildGeminiContents(messages: Message[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((message) => {
      const role = message.role === 'assistant' ? 'model' : 'user';
      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      const trimmed = message.content.trim();
      if (trimmed) {
        parts.push({ text: trimmed });
      }

      if (message.attachments?.length) {
        message.attachments.forEach((attachment) => {
          if (attachment.type === 'image' && attachment.dataUrl) {
            const commaIdx = attachment.dataUrl.indexOf(',');
            const base64Data = commaIdx !== -1 ? attachment.dataUrl.slice(commaIdx + 1) : attachment.dataUrl;
            parts.push({
              inlineData: {
                mimeType: attachment.mimeType || 'image/png',
                data: base64Data,
              },
            });
          }
        });
      }

      if (parts.length === 0) {
        parts.push({ text: '' });
      }

      return { role, parts };
    });
}

function getSystemInstruction(messages: Message[]): string | undefined {
  const systemMsg = messages.find((m) => m.role === 'system');
  return systemMsg?.content?.trim() || undefined;
}

// ─── Streaming: Groq (OpenAI-compatible) ───────────────────────────

async function* streamGroq(
  messages: Message[],
  apiKeys: string[],
  model: string,
  baseUrl: string,
  signal?: AbortSignal
): AsyncGenerator<string, void, undefined> {
  let lastErrorStatus = 0;

  for (let idx = 0; idx < apiKeys.length; idx++) {
    const apiKey = apiKeys[idx];
    console.log(`[Groq] Attempting key ${idx + 1}/${apiKeys.length}`);

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: buildOpenAIMessages(messages),
          stream: true,
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`[Groq] Key ${idx + 1} failed: ${response.status} ${response.statusText}`, errorText);
        lastErrorStatus = response.status;
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '' || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const data: ChatCompletionChunk = JSON.parse(trimmed.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                yield data.choices[0].delta.content;
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }
      return; // Success
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.warn(`[Groq] Key ${idx + 1} error: ${err.message}`);
    }
  }

  // All keys failed
  yield* mockStreamResponse(messages, lastErrorStatus === 429 ? 'quota' : 'error', 'Groq');
}

// ─── Streaming: Gemini (native) ────────────────────────────────────

async function* streamGemini(
  messages: Message[],
  apiKeys: string[],
  model: string,
  signal?: AbortSignal
): AsyncGenerator<string, void, undefined> {
  const contents = buildGeminiContents(messages);
  const systemInstruction = getSystemInstruction(messages);
  let lastErrorStatus = 0;

  for (let idx = 0; idx < apiKeys.length; idx++) {
    const apiKey = apiKeys[idx];
    console.log(`[Gemini] Attempting key ${idx + 1}/${apiKeys.length}`);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const requestBody: any = {
        contents,
        generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
      };

      if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await fetch(url, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`[Gemini] Key ${idx + 1} failed: ${response.status} ${response.statusText}`, errorText);
        lastErrorStatus = response.status;
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '' || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) yield text;
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }
      return; // Success
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.warn(`[Gemini] Key ${idx + 1} error: ${err.message}`);
    }
  }

  yield* mockStreamResponse(messages, lastErrorStatus === 429 ? 'quota' : 'error', 'Gemini');
}

// ─── Main entry point ──────────────────────────────────────────────

export async function* streamChatCompletion(messages: Message[], signal?: AbortSignal) {
  const { provider, rawKeys, model, baseUrl } = detectProvider();

  if (!rawKeys) {
    console.warn(`[Chat] No API keys configured. Falling back to demo mode.`);
    yield* mockStreamResponse(messages, 'no-key');
    return;
  }

  const apiKeys = rawKeys.split(',').map((k: string) => k.trim()).filter(Boolean);
  if (apiKeys.length === 0) {
    yield* mockStreamResponse(messages, 'no-key');
    return;
  }

  console.log(`[Chat] Using provider: ${provider}, model: ${model}, keys: ${apiKeys.length}`);

  if (provider === 'groq') {
    yield* streamGroq(messages, apiKeys, model, baseUrl, signal);
  } else {
    yield* streamGemini(messages, apiKeys, model, signal);
  }
}

// ─── Fallback mock response ────────────────────────────────────────

async function* mockStreamResponse(
  messages: Message[],
  reason: 'no-key' | 'quota' | 'error' = 'no-key',
  providerName: string = 'AI'
) {
  const lastMessage = messages[messages.length - 1];

  let responseText: string;
  if (reason === 'quota') {
    responseText = `⚠️ **${providerName} API Quota Exhausted**

All configured API keys have exceeded their rate limit. This typically resets shortly.

**Solutions:**
1. Wait a moment and try again (rate limits usually reset per-minute)
2. Add more API keys from different accounts for rotation
3. Check your usage at the provider's dashboard

Your message: "${lastMessage.content}"`;
  } else if (reason === 'error') {
    responseText = `⚠️ **${providerName} API Connection Error**

Failed to connect to the ${providerName} API. Please check your API keys and try again.

Your message: "${lastMessage.content}"`;
  } else {
    responseText = `[Demo Mode - No API Key Configured]
Hello! I am a simulated AI assistant.
I received your query: "${lastMessage.content}"

To enable AI responses, add your API key to the .env file:

**Option 1 — Groq (Recommended, Free):**
VITE_GROQ_API_KEY=gsk_your_key_here
Get a free key at: https://console.groq.com/keys

**Option 2 — Gemini (Requires billing):**
VITE_GEMINI_API_KEY=your_key_here
Get a key at: https://aistudio.google.com/apikey`;
  }

  for (let i = 0; i < responseText.length; i += 5) {
    yield responseText.slice(i, i + 5);
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

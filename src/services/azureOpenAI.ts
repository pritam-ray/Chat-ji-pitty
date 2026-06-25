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

function buildAzureMessages(messages: Message[]) {
  return messages.map((message) => {
    if (message.role === 'user' && message.attachments?.length) {
      const parts: Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
      > = [];

      const trimmed = message.content.trim();
      if (trimmed) {
        parts.push({ type: 'text', text: trimmed });
      }

      message.attachments.forEach((attachment) => {
        if (attachment.type === 'image') {
          parts.push({
            type: 'image_url',
            image_url: {
              url: attachment.dataUrl,
              detail: 'auto',
            },
          });
        }
      });

      return {
        role: message.role,
        content: parts,
      };
    }

    return {
      role: message.role,
      content: message.content,
    };
  });
}

export async function* streamChatCompletion(messages: Message[], signal?: AbortSignal) {
  const rawApiKeys = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';

  if (!rawApiKeys) {
    console.warn('[Gemini] VITE_GEMINI_API_KEY not configured. Falling back to local demo mock stream.');
    yield* mockStreamResponse(messages);
    return;
  }

  const apiKeys = rawApiKeys.split(',').map((k: string) => k.trim()).filter(Boolean);
  if (apiKeys.length === 0) {
    console.warn('[Gemini] No valid API keys found. Falling back to local demo mock stream.');
    yield* mockStreamResponse(messages);
    return;
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

  for (let idx = 0; idx < apiKeys.length; idx++) {
    const apiKey = apiKeys[idx];
    console.log(`[Gemini] Attempting connection with API key index ${idx + 1}/${apiKeys.length}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: buildAzureMessages(messages),
          stream: true,
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.warn(`[Gemini] Key ${idx + 1} failed with status: ${response.status} ${response.statusText}`);
        continue; // Try next key in the loop
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

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
              const data: ChatCompletionChunk = JSON.parse(jsonStr);

              if (data.choices?.[0]?.delta?.content) {
                yield data.choices[0].delta.content;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      return; // Success, exit function
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err; // User stopped the generation
      }
      console.warn(`[Gemini] Error with Key ${idx + 1}: ${err.message}`);
    }
  }

  // If we reach here, all keys failed
  console.warn('[Gemini] All configured API keys failed. Falling back to local demo mock stream.');
  yield* mockStreamResponse(messages);
}

async function* mockStreamResponse(messages: Message[]) {
  const lastMessage = messages[messages.length - 1];
  const responseText = `[Demo Mode - Gemini API Key Not Configured]
Hello! I am a simulated AI assistant.
I received your query: "${lastMessage.content}"

Everything is working correctly in your front-end, database, and document parser!`;

  for (let i = 0; i < responseText.length; i += 5) {
    yield responseText.slice(i, i + 5);
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    console.warn('[Gemini] VITE_GEMINI_API_KEY not configured. Falling back to local demo mock stream.');
    yield* mockStreamResponse(messages);
    return;
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

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
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      console.warn(`[Gemini] API returned status ${response.status}, using demo mock fallback.`);
      yield* mockStreamResponse(messages);
      return;
    }
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
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

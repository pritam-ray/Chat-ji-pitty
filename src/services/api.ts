import { supabase } from './supabase';

export interface Conversation {
  id: string;
  title: string;
  azure_response_id?: string;
  created_at: number;
  updated_at: number;
  messages: any[];
}

const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!isSupabaseConfigured) {
  console.log('[API] Supabase not configured. Using localStorage fallback for persistence.');
}

const LOCAL_STORAGE_KEY = 'chat-ji-pitty-db-conversations';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function getLocalConversations(): Conversation[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalConversations(convs: Conversation[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(convs));
}

// Helper to get active Supabase user if configured and logged in
async function getActiveUser() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (e) {
    return null;
  }
}

// Fetch all conversations from Supabase (or localStorage) - scoped to user_id
export async function fetchConversations(): Promise<Conversation[]> {
  const user = await getActiveUser();
  if (!user) {
    return getLocalConversations().sort((a, b) => b.updated_at - a.updated_at);
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*, messages(*, attachments(*))')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[Supabase] fetchConversations error:', error);
    throw error;
  }

  return (conversations || []).map((conv: any) => ({
    id: conv.id,
    title: conv.title,
    azure_response_id: conv.azure_response_id || undefined,
    created_at: Number(conv.created_at),
    updated_at: Number(conv.updated_at),
    messages: (conv.messages || [])
      .sort((a: any, b: any) => Number(a.created_at) - Number(b.created_at))
      .map((msg: any) => ({
        id: String(msg.id),
        role: msg.role,
        content: msg.content,
        displayContent: msg.display_content || undefined,
        attachments: (msg.attachments || []).map((att: any) => ({
          type: att.type,
          mimeType: att.mime_type,
          dataUrl: att.file_data,
          fileName: att.file_name,
          fileSize: att.file_size || undefined,
        }))
      }))
  }));
}

// Get single conversation - scoped to user_id
export async function fetchConversation(id: string): Promise<Conversation> {
  const user = await getActiveUser();
  if (!user) {
    const local = getLocalConversations().find(c => c.id === id);
    if (!local) throw new Error('Conversation not found');
    return local;
  }

  const { data: conv, error } = await supabase
    .from('conversations')
    .select('*, messages(*, attachments(*))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('[Supabase] fetchConversation error:', error);
    throw error;
  }

  return {
    id: conv.id,
    title: conv.title,
    azure_response_id: conv.azure_response_id || undefined,
    created_at: Number(conv.created_at),
    updated_at: Number(conv.updated_at),
    messages: (conv.messages || [])
      .sort((a: any, b: any) => Number(a.created_at) - Number(b.created_at))
      .map((msg: any) => ({
        id: String(msg.id),
        role: msg.role,
        content: msg.content,
        displayContent: msg.display_content || undefined,
        attachments: (msg.attachments || []).map((att: any) => ({
          type: att.type,
          mimeType: att.mime_type,
          dataUrl: att.file_data,
          fileName: att.file_name,
          fileSize: att.file_size || undefined,
        }))
      }))
  };
}

// Create new conversation in Supabase - includes user_id
export async function createConversation(
  id: string, 
  title: string, 
  azureResponseId?: string
): Promise<Conversation> {
  const now = Date.now();
  const user = await getActiveUser();

  if (!user) {
    const convs = getLocalConversations();
    const newConv: Conversation = {
      id,
      title: title || 'New chat',
      azure_response_id: azureResponseId,
      created_at: now,
      updated_at: now,
      messages: []
    };
    convs.push(newConv);
    saveLocalConversations(convs);
    return newConv;
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      id,
      title: title || 'New chat',
      azure_response_id: azureResponseId || null,
      created_at: now,
      updated_at: now,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] createConversation error:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    azure_response_id: data.azure_response_id || undefined,
    created_at: Number(data.created_at),
    updated_at: Number(data.updated_at),
    messages: []
  };
}

// Update conversation title
export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const user = await getActiveUser();
  if (!user) {
    const convs = getLocalConversations();
    const target = convs.find(c => c.id === id);
    if (target) {
      target.title = title;
      target.updated_at = Date.now();
      saveLocalConversations(convs);
    }
    return;
  }

  const { error } = await supabase
    .from('conversations')
    .update({
      title,
      updated_at: Date.now()
    })
    .eq('id', id);

  if (error) {
    console.error('[Supabase] updateConversationTitle error:', error);
    throw error;
  }
}

// Update conversation Azure response ID
export async function updateConversationResponse(id: string, azureResponseId: string): Promise<void> {
  const user = await getActiveUser();
  if (!user) {
    const convs = getLocalConversations();
    const target = convs.find(c => c.id === id);
    if (target) {
      target.azure_response_id = azureResponseId;
      target.updated_at = Date.now();
      saveLocalConversations(convs);
    }
    return;
  }

  const { error } = await supabase
    .from('conversations')
    .update({
      azure_response_id: azureResponseId,
      updated_at: Date.now()
    })
    .eq('id', id);

  if (error) {
    console.error('[Supabase] updateConversationResponse error:', error);
    throw error;
  }
}

// Delete conversation
export async function deleteConversation(id: string): Promise<void> {
  const user = await getActiveUser();
  if (!user) {
    const convs = getLocalConversations().filter(c => c.id !== id);
    saveLocalConversations(convs);
    return;
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] deleteConversation error:', error);
    throw error;
  }
}

// Add message to conversation
export async function addMessage(
  conversationId: string,
  role: string,
  content: string,
  displayContent?: string,
  attachments?: any[]
): Promise<void> {
  const now = Date.now();
  const user = await getActiveUser();

  if (!user) {
    const convs = getLocalConversations();
    const target = convs.find(c => c.id === conversationId);
    if (target) {
      const newMessage = {
        id: Math.random().toString(36).slice(2, 11),
        role,
        content,
        displayContent: displayContent || content,
        created_at: now,
        attachments: attachments || []
      };
      target.messages.push(newMessage);
      target.updated_at = now;
      saveLocalConversations(convs);
    }
    return;
  }

  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      role,
      content,
      display_content: displayContent || content,
      created_at: now
    }])
    .select()
    .single();

  if (messageError) {
    console.error('[Supabase] addMessage error:', messageError);
    throw messageError;
  }

  if (attachments && attachments.length > 0) {
    const attachmentInserts = attachments.map(att => ({
      message_id: message.id,
      type: att.type,
      mime_type: att.mimeType,
      file_name: att.fileName,
      file_size: att.fileSize || null,
      file_data: att.dataUrl,
      created_at: now
    }));

    const { error: attError } = await supabase
      .from('attachments')
      .insert(attachmentInserts);

    if (attError) {
      console.error('[Supabase] addMessage attachments error:', attError);
      throw attError;
    }
  }

  // Update conversation's updated_at timestamp
  const { error: convError } = await supabase
    .from('conversations')
    .update({ updated_at: now })
    .eq('id', conversationId);

  if (convError) {
    console.error('[Supabase] addMessage conversation timestamp update error:', convError);
  }
}

// Delete last message from conversation (used for regeneration)
export async function deleteLastMessage(conversationId: string): Promise<void> {
  const user = await getActiveUser();
  if (!user) {
    const convs = getLocalConversations();
    const target = convs.find(c => c.id === conversationId);
    if (target && target.messages.length > 0) {
      target.messages.pop();
      target.updated_at = Date.now();
      saveLocalConversations(convs);
    }
    return;
  }

  // Get the last message ID for this conversation
  const { data: messages, error: fetchError } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error('[Supabase] deleteLastMessage fetch error:', fetchError);
    throw fetchError;
  }

  if (messages && messages.length > 0) {
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messages[0].id);

    if (deleteError) {
      console.error('[Supabase] deleteLastMessage delete error:', deleteError);
      throw deleteError;
    }
  }
}

// Azure session management (stubbed out for backwards compatibility)
export async function saveAzureSession(
  _sessionId: string,
  _conversationId: string,
  _modelName?: string,
  _totalTokens?: number
): Promise<void> {
  // Not used in Gemini mode, but kept for compatibility
}

export async function getAzureSession(_conversationId: string): Promise<any> {
  return null;
}

// Web Search API (Proxy to stateless Express proxy)
export async function searchWeb(message: string, conversationId?: string): Promise<{
  success: boolean;
  response: string;
  usedWebSearch: boolean;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/chat/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, conversationId })
  });
  if (!response.ok) throw new Error('Web search failed');
  return response.json();
}

export async function searchWebStream(
  message: string,
  conversationId: string | undefined,
  onToken: (token: string) => void,
  onComplete: (usedWebSearch: boolean) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/search/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, conversationId })
    });

    if (!response.ok) {
      throw new Error('Web search stream failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              onError(data.error);
              return;
            }
            
            if (data.token) {
              onToken(data.token);
            }
            
            if (data.done) {
              onComplete(data.usedWebSearch || false);
              return;
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
}

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Moon, Sun, Menu, Bot, Plus, Search } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { SearchModal } from './components/SearchModal';
import { LandingPage } from './components/LandingPage';
import { WelcomePage } from './components/WelcomePage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { ProfilePage } from './components/ProfilePage';
import { useAuth } from './contexts/AuthContext';
import { Attachment, Message, streamChatCompletion } from './services/azureOpenAI';
import * as api from './services/api';
import type { Conversation } from './types/chat';

const THEME_STORAGE_KEY = 'chat-ji-pitty-theme';
const ACTIVE_CONVERSATION_KEY = 'chat-ji-pitty-active-conversation';
const SHOW_WELCOME_KEY = 'chat-ji-pitty-show-welcome';
const DEFAULT_TITLE = 'New chat';

type Theme = 'dark' | 'light';

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
}

const createConversation = (): Conversation => {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const timestamp = Date.now();

  return {
    id,
    title: DEFAULT_TITLE,
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    azureResponseId: undefined,
  };
};

const loadInitialConversationState = (): ConversationState => {
  return { conversations: [], activeConversationId: null };
};

const summarizeTitle = (conversation: Conversation, content: string) => {
  if (conversation.title !== DEFAULT_TITLE) {
    return conversation.title;
  }

  const cleaned = content.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return DEFAULT_TITLE;
  }

  return cleaned.length > 40 ? `${cleaned.slice(0, 40).trim()}…` : cleaned;
};

function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function App() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(SHOW_WELCOME_KEY) === 'true';
    }
    return false;
  });
  const [conversationState, setConversationState] = useState<ConversationState>(() => loadInitialConversationState());
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme());
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | undefined>(undefined);
  const [searchQueryForHighlight, setSearchQueryForHighlight] = useState<string | undefined>(undefined);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);

  const { conversations, activeConversationId } = conversationState;
  const activeConversation = activeConversationId ? conversations.find((conversation) => conversation.id === activeConversationId) : null;
  const messages = activeConversation?.messages ?? [];

  const scrollToBottom = (immediate = false) => {
    const now = Date.now();
    if (!immediate && now - lastScrollTime.current < 100) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        lastScrollTime.current = Date.now();
      }, 100);
      return;
    }
    
    lastScrollTime.current = now;
    messagesEndRef.current?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'end' });
  };

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom(true);
    }
  }, [messages.length, isLoading]);

  // Clear highlighting when clicking anywhere
  useEffect(() => {
    const handleClick = () => {
      if (highlightedMessageId) {
        setHighlightedMessageId(undefined);
        setSearchQueryForHighlight(undefined);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [highlightedMessageId]);

  // Check for password reset redirect in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type === 'recovery') {
      setShowResetPassword(true);
      // Clear query params from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Handle profile page routing
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      if (path === '/profile' && isAuthenticated) {
        setShowProfile(true);
      } else if (path !== '/profile' && showProfile) {
        setShowProfile(false);
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, [isAuthenticated, showProfile]);

  // Load conversations from database on mount (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    
    const loadFromDatabase = async () => {
      try {
        const dbConversations = await api.fetchConversations();
        
        if (dbConversations.length > 0) {
          const mapped = dbConversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            messages: (conv.messages || []).map((msg: any) => ({
              ...msg,
              id: msg.id || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11)),
            })),
            createdAt: conv.created_at,
            updatedAt: conv.updated_at,
            azureResponseId: conv.azure_response_id,
          }));
          
          const sorted = mapped.sort((a, b) => b.updatedAt - a.updatedAt);
          const storedActiveId = window.localStorage.getItem(ACTIVE_CONVERSATION_KEY);
          
          if (storedActiveId && sorted.some(c => c.id === storedActiveId)) {
            setConversationState({
              conversations: sorted,
              activeConversationId: storedActiveId,
            });
            setShouldShowWelcome(false);
            window.localStorage.removeItem(SHOW_WELCOME_KEY);
          } else {
            const showWelcome = window.localStorage.getItem(SHOW_WELCOME_KEY) === 'true';
            setConversationState({
              conversations: sorted,
              activeConversationId: null,
            });
            setShouldShowWelcome(showWelcome);
          }
        } else {
          const showWelcome = window.localStorage.getItem(SHOW_WELCOME_KEY) === 'true';
          setConversationState({
            conversations: [],
            activeConversationId: null,
          });
          setShouldShowWelcome(showWelcome);
        }
      } catch (error) {
        console.error('Failed to load from database:', error);
      }
    };
    
    loadFromDatabase();
  }, [isAuthenticated, authLoading]);

  // Save active conversation ID to localStorage and clear welcome flag
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeConversationId) {
      window.localStorage.setItem(ACTIVE_CONVERSATION_KEY, activeConversationId);
      setShouldShowWelcome(false);
      window.localStorage.removeItem(SHOW_WELCOME_KEY);
    }
  }, [activeConversationId]);

  // Set welcome flag when user logs in
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const hasStoredConversation = window.localStorage.getItem(ACTIVE_CONVERSATION_KEY);
      if (!hasStoredConversation) {
        setShouldShowWelcome(true);
        window.localStorage.setItem(SHOW_WELCOME_KEY, 'true');
      }
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    const nextClass = theme === 'light' ? 'theme-light' : 'theme-dark';
    root.classList.add(nextClass);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateConversationById = (
    conversationId: string,
    updater: (conversation: Conversation) => Conversation,
  ) => {
    setConversationState((prev) => {
      const index = prev.conversations.findIndex((conversation) => conversation.id === conversationId);
      if (index === -1) {
        return prev;
      }

      const target = prev.conversations[index];
      const updatedConversation = updater(target);
      const remaining = prev.conversations.filter((_, idx) => idx !== index);

      return {
        ...prev,
        conversations: [updatedConversation, ...remaining],
      };
    });
  };

  const handleRenameConversation = async (conversationId: string) => {
    const target = conversations.find((conversation) => conversation.id === conversationId);
    if (!target) {
      return;
    }

    const initialTitle = target.title === DEFAULT_TITLE ? '' : target.title;
    const nextTitle = window.prompt('Rename conversation', initialTitle) ?? undefined;
    if (nextTitle === undefined) {
      return;
    }

    const trimmed = nextTitle.trim() || DEFAULT_TITLE;
    
    try {
      await api.updateConversationTitle(conversationId, trimmed);
    } catch (error) {
      console.error('Failed to update title in database:', error);
    }
    
    updateConversationById(conversationId, (conversation) => ({
      ...conversation,
      title: trimmed,
      updatedAt: Date.now(),
    }));
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const confirmDelete = window.confirm('Delete this conversation?');
    if (!confirmDelete) return;

    try {
      await api.deleteConversation(conversationId);
    } catch (error) {
      console.error('Failed to delete from database:', error);
    }

    setConversationState((prev) => {
      const remaining = prev.conversations.filter((conversation) => conversation.id !== conversationId);
      if (remaining.length === 0) {
        return {
          conversations: [],
          activeConversationId: null,
        };
      }

      const nextActiveId = prev.activeConversationId === conversationId ? remaining[0].id : prev.activeConversationId;
      return {
        conversations: remaining,
        activeConversationId: nextActiveId,
      };
    });

    if (activeConversationId === conversationId) {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId: string, messageId?: string, searchQuery?: string) => {
    const currentActive = conversationState.conversations.find((c) => c.id === conversationState.activeConversationId);
    
    if (currentActive && currentActive.messages.length === 0 && conversationState.activeConversationId !== conversationId) {
      try {
        await api.deleteConversation(currentActive.id);
      } catch (error) {
        console.error('Failed to delete empty conversation:', error);
      }
    }

    setConversationState((prev) => {
      if (!prev.conversations.some((conversation) => conversation.id === conversationId)) {
        return prev;
      }

      const currentActive = prev.conversations.find((c) => c.id === prev.activeConversationId);
      let updatedConversations = prev.conversations;
      
      if (currentActive && currentActive.messages.length === 0 && prev.activeConversationId !== conversationId) {
        updatedConversations = prev.conversations.filter((c) => c.id !== currentActive.id);
      }

      return {
        conversations: updatedConversations,
        activeConversationId: conversationId,
      };
    });
    
    if (messageId && searchQuery) {
      setHighlightedMessageId(messageId);
      setSearchQueryForHighlight(searchQuery);
      
      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      setHighlightedMessageId(undefined);
      setSearchQueryForHighlight(undefined);
    }
    
    setIsSidebarOpen(false);
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  const handleRegenerateResponse = async () => {
    if (!activeConversation || isLoading) return;
    
    const messages = activeConversation.messages;
    if (messages.length < 2) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;
    
    const lastUserMessageIndex = messages.length - 2;
    const lastUserMessage = messages[lastUserMessageIndex];
    if (lastUserMessage.role !== 'user') return;
    
    try {
      await api.deleteLastMessage(activeConversation.id);
    } catch (error) {
      console.error('Failed to delete last message:', error);
      alert('Failed to regenerate response. Please try again.');
      return;
    }
    
    const updatedMessages = messages.slice(0, -1);
    updateConversationById(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: updatedMessages,
    }));

    const conversationId = activeConversation.id;
    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const assistantMessage: Message = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11),
        role: 'assistant',
        content: '',
      };

      updateConversationById(conversationId, (conversation) => ({
        ...conversation,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: Date.now(),
      }));

      // Use Web Search if it was originally search or search toggle is active
      if (webSearchEnabled) {
        console.log('[Regenerate] Using Web Search');
        try {
          await api.searchWebStream(
            lastUserMessage.content,
            conversationId,
            (token: string) => {
              if (controller.signal.aborted) return;
              assistantMessage.content += token;
              updateConversationById(conversationId, (conversation) => ({
                ...conversation,
                messages: [...updatedMessages, { ...assistantMessage }],
                updatedAt: Date.now(),
              }));
              scrollToBottom();
            },
            async () => {
              try {
                await api.addMessage(conversationId, 'assistant', assistantMessage.content);
              } catch (error) {
                console.error('[Regenerate] Failed to save assistant message:', error);
              }
              setIsLoading(false);
              setAbortController(null);
            },
            (error: string) => {
              console.error('[Regenerate] Web search error:', error);
              assistantMessage.content = 'Failed to generate search results.';
              updateConversationById(conversationId, (conversation) => ({
                ...conversation,
                messages: [...updatedMessages, { ...assistantMessage }],
                updatedAt: Date.now(),
              }));
              setIsLoading(false);
              setAbortController(null);
            }
          );
          return;
        } catch (error) {
          console.error('[Regenerate] Web search failed:', error);
        }
      }

      // Standard completions
      for await (const chunk of streamChatCompletion(updatedMessages, controller.signal)) {
        if (controller.signal.aborted) break;

        assistantMessage.content += chunk;
        updateConversationById(conversationId, (conversation) => {
          const updated = [...conversation.messages];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0) {
            updated[lastIndex] = { ...updated[lastIndex], content: assistantMessage.content };
          }
          return { ...conversation, messages: updated, updatedAt: Date.now() };
        });
        scrollToBottom();
      }

      if (assistantMessage.content) {
        try {
          await api.addMessage(conversationId, 'assistant', assistantMessage.content);
        } catch (error) {
          console.error('[Regenerate] Failed to save message:', error);
        }
      }
    } catch (error: any) {
      console.error('Regenerate error:', error);
      if (error.name !== 'AbortError') {
        alert('Failed to regenerate response. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleNewConversation = async () => {
    const currentActive = conversations.find((c) => c.id === activeConversationId);
    if (currentActive && currentActive.messages.length === 0) {
      setIsSidebarOpen(false);
      return;
    }

    if (currentActive && currentActive.messages.length === 0) {
      try {
        await api.deleteConversation(currentActive.id);
      } catch (error) {
        console.error('Failed to delete empty conversation:', error);
      }
    }

    const conversation = createConversation();
    
    setShouldShowWelcome(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SHOW_WELCOME_KEY);
    }
    
    setConversationState((prev) => {
      const updatedConversations = currentActive && currentActive.messages.length === 0
        ? prev.conversations.filter((c) => c.id !== currentActive.id)
        : prev.conversations;
      
      return {
        conversations: [conversation, ...updatedConversations],
        activeConversationId: conversation.id,
      };
    });
    setIsSidebarOpen(false);
    setIsLoading(false);
  };

  const handleSendMessage = async (
    content: string,
    displayContent?: string,
    _fileName?: string,
    attachments?: Attachment[],
    useWebSearch?: boolean,
  ) => {
    // If no active conversation, create one first
    if (!activeConversationId) {
      const conversation = createConversation();
      
      try {
        await api.createConversation(conversation.id, conversation.title);
      } catch (error) {
        console.error('Failed to create conversation in database:', error);
        alert('Failed to create new conversation. Please try again.');
        return;
      }
      
      setConversationState((prev) => ({
        conversations: [conversation, ...prev.conversations],
        activeConversationId: conversation.id,
      }));
      
      setTimeout(() => {
        handleSendMessage(content, displayContent, _fileName, attachments, useWebSearch);
      }, 100);
      return;
    }

    const conversationId = activeConversationId;
    const currentActive = conversations.find(c => c.id === conversationId);
    const isFirstMessage = currentActive ? currentActive.messages.length === 0 : true;
    
    if (isFirstMessage) {
      try {
        await api.createConversation(conversationId, DEFAULT_TITLE);
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          console.error('Failed to create conversation in database:', error);
        }
      }
    }

    const userMessage: Message = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11),
      role: 'user',
      content,
      displayContent: displayContent || content,
      attachments,
    };

    const conversationMessages = currentActive ? currentActive.messages : [];
    const updatedMessages = [...conversationMessages, userMessage];

    try {
      await api.addMessage(
        conversationId,
        'user',
        content,
        displayContent,
        attachments
      );
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    updateConversationById(conversationId, (conversation) => ({
      ...conversation,
      messages: updatedMessages,
      updatedAt: Date.now(),
    }));

    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const assistantMessage: Message = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11),
        role: 'assistant',
        content: '',
      };

      updateConversationById(conversationId, (conversation) => ({
        ...conversation,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: Date.now(),
      }));

      // Use Web Search proxy stream if enabled
      if (useWebSearch) {
        console.log('[App] Using stateless Web Search proxy');
        try {
          await api.searchWebStream(
            content,
            conversationId,
            (token: string) => {
              if (controller.signal.aborted) return;
              assistantMessage.content += token;
              updateConversationById(conversationId, (conversation) => ({
                ...conversation,
                messages: [...updatedMessages, { ...assistantMessage }],
                updatedAt: Date.now(),
              }));
              scrollToBottom();
            },
            async () => {
              try {
                await api.addMessage(conversationId, 'assistant', assistantMessage.content);
              } catch (error) {
                console.error('[App] Failed to save assistant message:', error);
              }

              // Update title dynamically on first response
              if (isFirstMessage && assistantMessage.content) {
                const generatedTitle = summarizeTitle(activeConversation || { title: DEFAULT_TITLE } as any, content);
                await api.updateConversationTitle(conversationId, generatedTitle);
                updateConversationById(conversationId, (conversation) => ({
                  ...conversation,
                  title: generatedTitle,
                }));
              }

              setIsLoading(false);
              setAbortController(null);
            },
            (error: string) => {
              console.error('[App] Web search stream failed:', error);
              assistantMessage.content = 'I apologize, but I encountered an error while searching the web.';
              updateConversationById(conversationId, (conversation) => ({
                ...conversation,
                messages: [...updatedMessages, { ...assistantMessage }],
                updatedAt: Date.now(),
              }));
              setIsLoading(false);
              setAbortController(null);
            }
          );
          return;
        } catch (error) {
          console.error('[App] Web search failed, falling back to Gemini:', error);
        }
      }

      // Standard Gemini API streaming
      const MAX_CONTEXT_MESSAGES = 20;
      const messageHistory = updatedMessages.slice(-MAX_CONTEXT_MESSAGES);

      for await (const chunk of streamChatCompletion(messageHistory, controller.signal)) {
        if (controller.signal.aborted) break;

        assistantMessage.content += chunk;
        updateConversationById(conversationId, (conversation) => {
          const updated = [...conversation.messages];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0) {
            updated[lastIndex] = { ...updated[lastIndex], content: assistantMessage.content };
          }
          return { ...conversation, messages: updated, updatedAt: Date.now() };
        });
        scrollToBottom();
      }

      if (assistantMessage.content) {
        try {
          await api.addMessage(conversationId, 'assistant', assistantMessage.content);
        } catch (error) {
          console.error('Failed to save assistant message:', error);
        }
      }

      if (isFirstMessage && assistantMessage.content) {
        const generatedTitle = summarizeTitle(activeConversation || { title: DEFAULT_TITLE } as any, content);
        await api.updateConversationTitle(conversationId, generatedTitle);
        updateConversationById(conversationId, (conversation) => ({
          ...conversation,
          title: generatedTitle,
        }));
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        console.log('Generation stopped by user');
      } else {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
        };
        updateConversationById(conversationId, (conversation) => {
          const updated = [...conversation.messages];
          if (updated.length && updated[updated.length - 1].role === 'assistant') {
            updated[updated.length - 1] = errorMessage;
          } else {
            updated.push(errorMessage);
          }
          return {
            ...conversation,
            messages: updated,
            updatedAt: Date.now(),
          };
        });
      }
    } finally {
      setAbortController(null);
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLanding) {
      return (
        <LandingPage 
          onGetStarted={() => {
            setShowLanding(false);
            setShowSignup(true);
          }}
          onLogin={() => {
            setShowLanding(false);
            setShowSignup(false);
          }}
        />
      );
    }

    if (showResetPassword) {
      return (
        <ResetPasswordPage 
          onSuccess={() => {
            setShowResetPassword(false);
            setShowSignup(false);
            setShowForgotPassword(false);
            setShowLanding(true);
          }} 
        />
      );
    }

    if (showForgotPassword) {
      return (
        <ForgotPasswordPage 
          onBack={() => {
            setShowForgotPassword(false);
            setShowSignup(false);
          }} 
        />
      );
    }

    return showSignup ? (
      <SignupPage onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginPage 
        onSwitchToSignup={() => setShowSignup(true)}
        onForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  if (showProfile) {
    return <ProfilePage onBack={() => {
      setShowProfile(false);
      window.history.pushState({}, '', '/');
    }} />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300">
      <div
        className={`sidebar-overlay md:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        conversations={conversations}
        onSelectMessage={(conversationId, messageId, searchQuery) => {
          setIsSearchModalOpen(false);
          if (conversationId !== activeConversationId) {
            handleSelectConversation(conversationId);
          }
          setHighlightedMessageId(messageId);
          setSearchQueryForHighlight(searchQuery);
          setTimeout(() => {
            const messageElement = document.getElementById(`message-${messageId}`);
            messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }}
      />

      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isOpen={isSidebarOpen}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onClose={() => setIsSidebarOpen(false)}
        shouldFocusSearch={shouldFocusSearch}
        onSearchFocused={() => setShouldFocusSearch(false)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        user={user}
        onOpenProfile={() => {
          window.history.pushState({}, '', '/profile');
          setShowProfile(true);
        }}
        onLogout={logout}
      />

      {/* Icon bar visible when sidebar is closed on desktop */}
      <div className={`hidden md:flex flex-col items-center gap-2 bg-[var(--bg-panel)] border-r border-[var(--border-strong)] py-2 transition-all duration-300 ${isSidebarOpen ? 'w-0 opacity-0 overflow-hidden' : 'w-14 opacity-100'}`}>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-control)] text-[var(--text-primary)] transition hover:bg-[var(--bg-control-hover)]"
          title="Open sidebar"
          aria-label="Open chat history"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={handleNewConversation}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-control)] text-[var(--text-primary)] transition hover:bg-[var(--bg-control-hover)]"
          title="New chat"
          aria-label="New chat"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-control)] text-[var(--text-primary)] transition hover:bg-[var(--bg-control-hover)]"
          title="Search chats"
          aria-label="Search chats"
        >
          <Search className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-[var(--border-strong)] bg-[var(--bg-panel)]/95 backdrop-blur-md transition-colors relative z-40">
          <div className="flex w-full items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4">
            <button
              type="button"
              className="inline-flex md:hidden h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-control)] text-[var(--text-primary)] transition hover:bg-[var(--bg-control-hover)]"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open chat history"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
            </button>
            <div className="accent-badge hidden h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-full md:flex">
              <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">Chat-ji-Pitty</h1>
              <p className="text-xs sm:text-sm text-[var(--text-tertiary)] truncate">Powered by Gemini AI</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-control)] px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-control-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-[var(--accent)]" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--accent)]" />
                )}
                <span className="hidden sm:inline">
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[var(--bg-app)] transition-colors">
          <div className="w-full px-3 py-4 sm:px-6 sm:py-8 h-full">
            {shouldShowWelcome && !activeConversationId ? (
              <WelcomePage 
                onNewChat={handleNewConversation}
                userName={user?.username}
              />
            ) : !activeConversationId || messages.length === 0 ? (
              <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-8 text-center">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-panel)] border-2 border-[var(--border-subtle)]">
                    <MessageSquare className="h-8 w-8 text-[var(--text-tertiary)]" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-normal text-[var(--text-primary)]">How can I help you today?</h2>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-10">
                {messages.map((message, index) => {
                  const isLastAssistant = message.role === 'assistant' && index === messages.length - 1;
                  return (
                    <ChatMessage 
                      key={index} 
                      message={message}
                      isHighlighted={highlightedMessageId === message.id}
                      searchQuery={highlightedMessageId === message.id ? searchQueryForHighlight : undefined}
                      onRegenerate={isLastAssistant ? handleRegenerateResponse : undefined}
                      isLastAssistantMessage={isLastAssistant}
                    />
                  );
                })}
                {isLoading && messages[messages.length - 1]?.content === '' && (
                  <div className="chat-row chat-row-assistant">
                    <div className="chat-avatar chat-avatar-assistant">
                      <Bot className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="chat-card chat-card-assistant">
                      <header className="chat-card-header">
                        <span className="chat-card-label">AI Assistant</span>
                      </header>
                      <div className="chat-card-body">
                        <div className="flex gap-2">
                          <span className="typing-dot"></span>
                          <span className="typing-dot dot-2"></span>
                          <span className="typing-dot dot-3"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        <ChatInput 
          onSend={handleSendMessage} 
          isGenerating={isLoading} 
          onStop={handleStopGeneration}
          webSearchEnabled={webSearchEnabled}
          onWebSearchToggle={setWebSearchEnabled}
        />
      </div>
    </div>
  );
}

export default App;

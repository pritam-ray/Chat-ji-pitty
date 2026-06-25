import { useEffect, useState } from 'react';
import { Plus, MessageSquare, X, MoreHorizontal, ChevronLeft, Search, User, LogOut, Settings } from 'lucide-react';
import type { Conversation } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onClose: () => void;
  shouldFocusSearch?: boolean;
  onSearchFocused?: () => void;
  onOpenSearch?: () => void;
  user: { username: string; email: string } | null;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;

  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diff / 60_000));
    return `${minutes}m ago`;
  }
  if (diff < 86_400_000) {
    const hours = Math.max(1, Math.floor(diff / 3_600_000));
    return `${hours}h ago`;
  }
  const days = Math.max(1, Math.floor(diff / 86_400_000));
  return `${days}d ago`;
}

export function Sidebar({
  conversations,
  activeConversationId,
  isOpen,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onClose,
  onOpenSearch,
  user,
  onOpenProfile,
  onLogout,
  onOpenLogin,
}: SidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.conversation-actions')) {
        setOpenMenuId(null);
      }
      if (!target?.closest('.user-menu-wrapper')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setOpenMenuId(null);
      setShowUserMenu(false);
    }
  }, [isOpen]);

  return (
    <aside
      className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'} bg-[var(--bg-panel)] text-[var(--text-primary)]`}
      aria-label="Chat history"
      aria-hidden={!isOpen}
    >
      <div className="sidebar-header">
        <button
          type="button"
          onClick={onNewConversation}
          className="new-chat-button"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span>New chat</span>
        </button>
        <div className="sidebar-header-actions">
          <button
            type="button"
            className="sidebar-close hidden md:inline-flex"
            onClick={onClose}
            aria-label="Hide sidebar"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            className="sidebar-close md:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <button
          type="button"
          className="search-input-wrapper cursor-pointer hover:bg-[var(--bg-control-hover)] transition"
          onClick={onOpenSearch}
        >
          <Search className="search-icon" aria-hidden />
          <span className="search-input text-left text-[var(--text-tertiary)]">
            Search chats...
          </span>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Recent conversations">
        {conversations.length === 0 ? (
          <p className="sidebar-empty">No conversations yet</p>
        ) : (
          <ul className="conversation-list">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const fullTitle = conversation.title || 'New chat';
              const truncatedTitle = fullTitle.length > 20 ? `${fullTitle.slice(0, 20).trim()}…` : fullTitle;

              return (
                <li key={conversation.id} className="conversation-row">
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className={`conversation-item ${isActive ? 'is-active' : ''}`}
                    title={fullTitle}
                  >
                    <MessageSquare className="h-4 w-4 flex-none" aria-hidden />
                    <div className="conversation-meta">
                      <span className="conversation-title">{truncatedTitle}</span>
                      <span className="conversation-time">{formatRelativeTime(conversation.updatedAt)}</span>
                    </div>
                  </button>
                  <div className="conversation-actions">
                    <button
                      type="button"
                      className="conversation-action-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId((prev) => (prev === conversation.id ? null : conversation.id));
                      }}
                      aria-label="Conversation actions"
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden />
                    </button>
                    {openMenuId === conversation.id ? (
                      <div className="conversation-menu">
                        <button
                          type="button"
                          className="conversation-menu-item"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId(null);
                            onRenameConversation(conversation.id);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="conversation-menu-item is-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId(null);
                            onDeleteConversation(conversation.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-[var(--border-subtle)] p-3">
        <div className="relative user-menu-wrapper">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-control-hover)] transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {user?.username || 'Guest User'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">
                {user?.email || 'Sign in to save history'}
              </p>
            </div>
            <MoreHorizontal className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
          </button>
 
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-lg z-50">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProfile();
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-control-hover)] transition rounded-t-lg"
                  >
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-control-hover)] transition border-t border-[var(--border-subtle)] rounded-b-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenLogin();
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-control-hover)] transition rounded-lg"
                >
                  <User className="h-4 w-4 text-[var(--accent)]" />
                  <span>Log In / Sign Up</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

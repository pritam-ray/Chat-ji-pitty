import { useEffect, useRef } from 'react';
import { User, Bot, Image as ImageIcon, FileText } from 'lucide-react';
import type { Attachment, Message } from '../services/azureOpenAI';
import { renderMarkdownToHTML } from '../utils/markdown';
import 'katex/dist/katex.min.css';

interface ChatMessageProps {
  message: Message;
  isHighlighted?: boolean;
  searchQuery?: string;
}

const COPY_ICON = `
  <svg class="copy-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
  </svg>
`;

const SUCCESS_ICON = `
  <svg class="copy-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
  </svg>
`;

function MarkdownContent({ content, searchQuery }: { content: string; searchQuery?: string }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    
    // Highlight search query if provided
    if (searchQuery && searchQuery.trim()) {
      const textNodes: Node[] = [];
      const walker = document.createTreeWalker(
        contentRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }
      
      textNodes.forEach((textNode) => {
        const text = textNode.textContent || '';
        const lowerText = text.toLowerCase();
        const lowerQuery = searchQuery.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        
        if (index !== -1 && textNode.parentElement) {
          const before = text.slice(0, index);
          const match = text.slice(index, index + searchQuery.length);
          const after = text.slice(index + searchQuery.length);
          
          const span = document.createElement('span');
          if (before) span.appendChild(document.createTextNode(before));
          
          const mark = document.createElement('mark');
          mark.className = 'search-highlight-active';
          mark.textContent = match;
          span.appendChild(mark);
          
          if (after) span.appendChild(document.createTextNode(after));
          
          textNode.parentElement.replaceChild(span, textNode);
        }
      });
    }
    
    const codeBlocks = contentRef.current.querySelectorAll('pre.code-block');

    codeBlocks.forEach((block) => {
      if (block.parentElement?.classList.contains('code-block-wrapper')) {
        return;
      }

      const codeElement = block.querySelector('code');
      if (!codeElement) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      block.parentNode?.insertBefore(wrapper, block);
      wrapper.appendChild(block);

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'copy-button';
      copyButton.setAttribute('aria-label', 'Copy code to clipboard');
      copyButton.innerHTML = COPY_ICON;

      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeElement.textContent || '');
          copyButton.classList.add('is-copied');
          copyButton.innerHTML = SUCCESS_ICON;
          setTimeout(() => {
            copyButton.classList.remove('is-copied');
            copyButton.innerHTML = COPY_ICON;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });

      wrapper.appendChild(copyButton);
    });
  }, [content, searchQuery]);

  const html = renderMarkdownToHTML(content);

  return (
    <div
      ref={contentRef}
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.type === 'image') {
    return (
      <figure className="overflow-hidden rounded-2xl border border-[var(--border-attachment)] bg-[var(--bg-attachment)]">
        <img
          src={attachment.dataUrl}
          alt={attachment.fileName}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
        <figcaption className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-tertiary)]">
          <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          <span className="truncate">{attachment.fileName}</span>
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-attachment)] bg-[var(--bg-attachment)] px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-control-hover)]/60 text-[var(--accent)]">
        <FileText className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{attachment.fileName}</p>
        <span className="text-xs uppercase text-[var(--text-tertiary)]">{attachment.mimeType}</span>
      </div>
    </div>
  );
}

export function ChatMessage({ message, isHighlighted, searchQuery }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const label = isUser ? 'You' : isAssistant ? 'ChatGPT' : 'System';
  const displayContent = isUser ? message.displayContent || message.content : message.content;

  const rowClass = `chat-row ${isUser ? 'chat-row-user' : 'chat-row-assistant'} ${isHighlighted ? 'message-highlighted' : ''}`;
  const avatarClass = `chat-avatar ${
    isUser ? 'chat-avatar-user' : 'chat-avatar-assistant'
  }`;
  const cardClass = `chat-card ${
    isUser ? 'chat-card-user' : isAssistant ? 'chat-card-assistant' : 'chat-card-system'
  }`;
  const shouldShowHeader = !isUser;

  return (
    <article className={rowClass} data-message-id={message.id}>
      <div className={avatarClass} aria-hidden>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className={cardClass}>
        {shouldShowHeader ? (
          <header className="chat-card-header">
            <span className="chat-card-label">{label}</span>
          </header>
        ) : null}
        <div className="chat-card-body">
          {isAssistant ? (
            <MarkdownContent content={displayContent} searchQuery={searchQuery} />
          ) : (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text-primary)]">
              {searchQuery && searchQuery.trim() ? (
                (() => {
                  const lowerContent = displayContent.toLowerCase();
                  const lowerQuery = searchQuery.toLowerCase();
                  const index = lowerContent.indexOf(lowerQuery);
                  
                  if (index === -1) return displayContent;
                  
                  const before = displayContent.slice(0, index);
                  const match = displayContent.slice(index, index + searchQuery.length);
                  const after = displayContent.slice(index + searchQuery.length);
                  
                  return (
                    <>
                      {before}
                      <mark className="search-highlight-active">{match}</mark>
                      {after}
                    </>
                  );
                })()
              ) : (
                displayContent
              )}
            </p>
          )}
        </div>
        {message.attachments?.length ? (
          <div className="chat-card-attachments">
            {message.attachments.map((attachment, index) => (
              <AttachmentPreview key={`${attachment.fileName}-${index}`} attachment={attachment} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Attachment } from '../services/azureOpenAI';
import { extractTextFromFile } from '../utils/pdfExtractor';

interface ChatInputProps {
  onSend: (message: string, displayMessage?: string, fileName?: string, attachments?: Attachment[]) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      resetFileInput();
      return;
    }

    setAttachedFile(file);
    setIsProcessingFile(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const attachmentType = file.type.startsWith('image/') ? 'image' : 'pdf';
      
      let extractedText: string | undefined;
      if (attachmentType === 'pdf') {
        try {
          extractedText = await extractTextFromFile(file);
        } catch (err) {
          console.error('Failed to extract text from file:', err);
          alert(`Warning: Could not extract text from this document: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
      
      setAttachment({
        type: attachmentType,
        mimeType: file.type,
        dataUrl,
        fileName: file.name,
        extractedText,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Could not read the selected file. Please try another file.');
      setAttachedFile(null);
      setAttachment(null);
    } finally {
      setIsProcessingFile(false);
      resetFileInput();
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setAttachment(null);
    resetFileInput();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!(trimmedInput || attachment) || disabled || isProcessingFile) {
      return;
    }

    let displayContent = trimmedInput;
    let apiContent = trimmedInput;
    const attachments: Attachment[] = [];

    if (attachment) {
      attachments.push(attachment);
      const icon = attachment.type === 'image' ? '🖼️' : '📎';
      const label = attachment.type === 'image' ? 'Image' : 'PDF';
      displayContent = displayContent
        ? `${displayContent}\n\n${icon} ${label} attached: ${attachment.fileName}`
        : `${icon} ${label} attached: ${attachment.fileName}`;

      if (attachment.extractedText) {
        apiContent = apiContent
          ? `[File Content: ${attachment.fileName}]\n${attachment.extractedText}\n\nUser: ${apiContent}`
          : `[File Content: ${attachment.fileName}]\n${attachment.extractedText}`;
      }
    }

    onSend(apiContent, displayContent, attachedFile?.name, attachments.length ? attachments : undefined);
    setInput('');
    handleRemoveFile();
  };

  const sendDisabled = disabled || isProcessingFile || (!input.trim() && !attachment);

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--border-strong)] bg-[var(--bg-panel)] px-3 py-3 sm:px-4 sm:py-4 transition-colors duration-300">
      <div className="mx-auto w-full max-w-4xl space-y-2 sm:space-y-3">
        {attachedFile && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-control)] px-4 py-3 text-[var(--text-primary)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-control-hover)]/80 text-[var(--text-primary)]">
                <Paperclip className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <span className="block text-sm font-medium">
                  {isProcessingFile ? 'Processing...' : attachedFile.name}
                </span>
                {attachment && (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {attachment.type === 'image' ? 'Image' : 'PDF'} attachment
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-control-hover)]"
              title="Remove attachment"
              aria-label="Remove attachment"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessingFile}
            className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-control)] text-[var(--text-primary)] transition hover:bg-[var(--bg-control-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.txt,.md,.doc,.docx,image/*"
            className="hidden"
            aria-label="Attachment input"
            title="Attachment input"
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isProcessingFile ? 'Processing file...' : 'Message Chat-ji-Pitty'}
            disabled={disabled || isProcessingFile}
            className="chat-input-field flex-1 rounded-xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-[15px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-0"
            aria-label="Message input"
            title="Message input"
          />

          <button
            type="submit"
            disabled={sendDisabled}
            className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--bg-control)] disabled:text-[var(--text-tertiary)]"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </button>
        </div>
      </div>
    </form>
  );
}

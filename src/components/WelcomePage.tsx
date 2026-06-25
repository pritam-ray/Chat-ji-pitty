import { MessageSquare, Sparkles, Image, FileText, Zap, Globe } from 'lucide-react';

interface WelcomePageProps {
  onNewChat: () => void;
  userName?: string;
}

export function WelcomePage({ onNewChat, userName }: WelcomePageProps) {
  const suggestions = [
    {
      icon: Sparkles,
      title: "Get creative ideas",
      description: "for a new project or hobby",
    },
    {
      icon: FileText,
      title: "Analyze documents",
      description: "Upload PDFs and get insights",
    },
    {
      icon: Image,
      title: "Understand images",
      description: "Upload photos for detailed analysis",
    },
    {
      icon: Globe,
      title: "Learn something new",
      description: "Ask about any topic you're curious about",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8 overflow-hidden">
      <div className="max-w-3xl w-full text-center space-y-6">
        {/* Welcome Header */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {userName ? `Welcome back, ${userName}!` : "What's on your mind today?"}
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            Start a conversation and get instant, intelligent responses
          </p>
        </div>

        {/* Suggestions Grid */}
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={onNewChat}
              className="group p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-control-hover)] hover:border-[var(--accent)] transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-muted-bg)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)] transition-colors">
                  <suggestion.icon className="h-5 w-5 text-[var(--accent)] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    {suggestion.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Start Button */}
        <div className="mt-6">
          <button
            onClick={onNewChat}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-medium hover:bg-[var(--accent-hover)] transition shadow-md hover:shadow-lg"
          >
            <Sparkles className="h-5 w-5" />
            Start a new chat
          </button>
        </div>

        {/* Features Footer */}
        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-tertiary)]">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Lightning fast responses</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Multimodal support</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Context-aware conversations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

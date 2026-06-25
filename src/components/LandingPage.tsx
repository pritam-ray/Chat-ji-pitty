import { MessageSquare, Sparkles, Lock, Zap, Globe, Shield } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Chat-ji-Pitty</span>
            </div>
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-control-hover)] rounded-lg transition"
            >
              Log in
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[var(--text-primary)] bg-clip-text text-transparent">
            Welcome to Chat-ji-Pitty
          </h1>
          <p className="text-xl text-[var(--text-secondary)] mb-8 leading-relaxed">
            Experience the power of AI conversations powered by Gemini AI. 
            Get instant answers, creative inspiration, and intelligent assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-[var(--accent)] text-white rounded-xl font-semibold text-lg hover:bg-[var(--accent-hover)] transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-4 bg-[var(--bg-control)] text-[var(--text-primary)] rounded-xl font-semibold text-lg hover:bg-[var(--bg-control-hover)] transition border border-[var(--border-subtle)]"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
          <div className="bg-[var(--bg-panel)] rounded-2xl p-8 border border-[var(--border-subtle)] hover:border-[var(--accent)] transition">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-muted-bg)] flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
            <p className="text-[var(--text-secondary)]">
              Powered by Azure OpenAI with optimized token usage for blazing fast responses.
            </p>
          </div>

          <div className="bg-[var(--bg-panel)] rounded-2xl p-8 border border-[var(--border-subtle)] hover:border-[var(--accent)] transition">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-muted-bg)] flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
            <p className="text-[var(--text-secondary)]">
              Your conversations are encrypted and stored securely with JWT authentication.
            </p>
          </div>

          <div className="bg-[var(--bg-panel)] rounded-2xl p-8 border border-[var(--border-subtle)] hover:border-[var(--accent)] transition">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-muted-bg)] flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Multimodal Support</h3>
            <p className="text-[var(--text-secondary)]">
              Upload images, PDFs, and more. Get intelligent responses across multiple formats.
            </p>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-20 max-w-4xl mx-auto bg-[var(--bg-panel)] rounded-2xl p-8 border border-[var(--border-subtle)]">
          <h2 className="text-2xl font-bold mb-6 text-center">What You Can Do</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted-bg)] flex items-center justify-center flex-shrink-0 mt-1">
                <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Natural Conversations</h4>
                <p className="text-sm text-[var(--text-secondary)]">Chat naturally with AI that remembers context</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted-bg)] flex items-center justify-center flex-shrink-0 mt-1">
                <Lock className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Save Your Chats</h4>
                <p className="text-sm text-[var(--text-secondary)]">Access your conversation history anytime</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted-bg)] flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Smart Responses</h4>
                <p className="text-sm text-[var(--text-secondary)]">Get accurate, context-aware answers instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted-bg)] flex items-center justify-center flex-shrink-0 mt-1">
                <Globe className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">File Analysis</h4>
                <p className="text-sm text-[var(--text-secondary)]">Upload and analyze images, PDFs, and documents</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-[var(--text-tertiary)]">
            <p>Powered by Gemini AI • Built with React & TypeScript</p>
            <p className="mt-2">© 2025 Chat-ji-Pitty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

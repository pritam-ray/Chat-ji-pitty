import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface ResetPasswordPageProps {
  onSuccess: () => void;
}

export function ResetPasswordPage({ onSuccess }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500 mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Password Reset!</h1>
          <p className="text-[var(--text-secondary)]">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-muted-bg)] border-2 border-[var(--accent)] mb-4">
            <Lock className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Reset Password</h1>
          <p className="text-[var(--text-secondary)]">Enter your new password below</p>
        </div>

        {/* Form */}
        <div className="bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-strong)] p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full pl-11 pr-12 py-3 bg-[var(--bg-control)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-control)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

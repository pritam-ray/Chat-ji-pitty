import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, Loader2, Check, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabase';

export function ProfilePage({ onBack }: { onBack: () => void }) {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Sync form data with context user
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
        }
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Update user in context
      if (data.user) {
        const metadata = data.user.user_metadata || {};
        updateUser({
          id: data.user.id,
          email: data.user.email || '',
          username: metadata.username || '',
          firstName: metadata.first_name || '',
          lastName: metadata.last_name || '',
        });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-app)]">
      <div className="flex-1 flex flex-col w-full px-3 sm:px-4 md:px-6">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-app)] border-b border-[var(--border-subtle)] py-4 sm:py-6 flex items-center gap-3 sm:gap-4 z-10">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--accent-muted-bg)] flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] truncate">Profile Settings</h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">Manage your account information</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Message */}
            {message && (
              <div className={`rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/50 text-green-500' 
                  : 'bg-red-500/10 border border-red-500/50 text-red-500'
              }`}>
                {message.type === 'success' ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <X className="h-4 w-4 sm:h-5 sm:w-5" />}
                <span className="text-xs sm:text-sm font-medium">{message.text}</span>
              </div>
            )}

            {/* Profile Information */}
            <div className="bg-[var(--bg-control)] rounded-xl p-4 sm:p-6 border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">Profile Information</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition text-xs sm:text-sm font-medium"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Email cannot be changed</p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!isEditing}
                    required
                    className="w-full px-4 py-3 bg-[var(--bg-control)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[var(--accent)] transition"
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter your first name"
                    className="w-full px-4 py-3 bg-[var(--bg-control)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[var(--accent)] transition"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter your last name"
                    className="w-full px-4 py-3 bg-[var(--bg-control)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[var(--accent)] transition"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          username: user?.username || '',
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                        });
                      }}
                      disabled={loading}
                      className="px-4 py-3 bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-control)] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Password Section */}
            <div className="bg-[var(--bg-control)] rounded-xl p-6 border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Password</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {isChangingPassword ? 'Enter your new password' : '••••••••••••'}
                  </p>
                </div>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-control)] transition text-sm font-medium"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {isChangingPassword && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        className="w-full pl-11 pr-12 py-3 bg-[var(--bg-control)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-control)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ newPassword: '', confirmPassword: '' });
                      }}
                      disabled={loading}
                      className="px-4 py-3 bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-control)] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

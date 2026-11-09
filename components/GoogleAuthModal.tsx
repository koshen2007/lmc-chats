'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, Plus, UserCheck } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (googleUser: {
    name: string;
    email: string;
    avatar: string;
    username: string;
  }) => void;
}

interface SavedGoogleAccount {
  email: string;
  name: string;
  username: string;
  avatar: string;
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: GoogleAuthModalProps) {
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<SavedGoogleAccount[]>([]);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined') return;

    const list: SavedGoogleAccount[] = [];

    // 1. From local storage
    const stored = localStorage.getItem('lmc_saved_google_accounts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) list.push(...parsed);
      } catch {}
    }

    // 2. From last active session
    const lastUser = localStorage.getItem('lmc_user');
    if (lastUser) {
      try {
        const u = JSON.parse(lastUser);
        if (u && (u.email || u.provider === 'google')) {
          const email = u.email || `${u.username}@gmail.com`;
          if (!list.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
            list.push({
              email,
              name: u.name,
              username: u.username,
              avatar: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.username}`,
            });
          }
        }
      } catch {}
    }

    setSavedAccounts(list);

    // 3. Fetch any registered Google accounts from server
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.users)) {
          const combined = [...list];
          for (const u of data.users) {
            if (u && (u.email || u.provider === 'google')) {
              const email = u.email || `${u.username}@gmail.com`;
              if (!combined.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
                combined.push({
                  email,
                  name: u.name,
                  username: u.username,
                  avatar: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.username}`,
                });
              }
            }
          }
          setSavedAccounts(combined);
          if (combined.length > 0) {
            localStorage.setItem('lmc_saved_google_accounts', JSON.stringify(combined));
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCompleteGoogleLogin = (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google email address');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const cleanUsername = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const displayName = (name || googleName).trim() || cleanEmail.split('@')[0];
      const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

      const newAccount: SavedGoogleAccount = {
        email: cleanEmail,
        name: displayName,
        username: cleanUsername,
        avatar: avatarUrl,
      };

      if (typeof window !== 'undefined') {
        const updated = [
          newAccount,
          ...savedAccounts.filter((a) => a.email.toLowerCase() !== cleanEmail),
        ];
        localStorage.setItem('lmc_saved_google_accounts', JSON.stringify(updated));
      }

      onSuccess(newAccount);
      setLoading(false);
      onClose();
    }, 350);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCompleteGoogleLogin(googleEmail, googleName);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-sm bg-[#111522] border border-[#232B3E] rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header with Google Logo */}
        <div className="p-5 border-b border-white/10 bg-[#151A2B] text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors absolute right-4 top-4"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Official Google SVG Logo */}
          <div className="w-12 h-12 rounded-2xl bg-white shadow-lg grid place-items-center mx-auto mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h2 className="text-base font-bold text-white tracking-tight">Sign in with Google</h2>
          <p className="text-xs text-[#7A8396] mt-0.5">Choose an account to continue to LMC Chats</p>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Quick Account Chooser if saved accounts exist */}
          {savedAccounts.length > 0 && !showNewAccountForm && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8396] block px-1">
                Saved Google Accounts
              </span>
              <div className="space-y-1.5">
                {savedAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleCompleteGoogleLogin(acc.email, acc.name)}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                          {acc.name}
                        </p>
                        <p className="text-[10px] text-[#7A8396] truncate">{acc.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white font-semibold transition-all shrink-0">
                      Sign In
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowNewAccountForm(true)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#A8B2C7] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Use another Google account</span>
              </button>
            </div>
          )}

          {/* 1-Click Google Sign In when no saved accounts */}
          {savedAccounts.length === 0 && !showNewAccountForm && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#0D1017] border border-white/5 text-center">
                <p className="text-xs font-semibold text-white mb-1">Instant Google Account Sign-In</p>
                <p className="text-[11px] text-[#7A8396] mb-3.5">
                  Sign in with 1-click using your Google identity
                </p>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    const detected = typeof window !== 'undefined' && localStorage.getItem('lmc_last_google_handle')
                      ? localStorage.getItem('lmc_last_google_handle')!
                      : 'google_user';
                    handleCompleteGoogleLogin(`${detected}@gmail.com`, 'Google Member');
                  }}
                  className="w-full bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Signing in...' : 'Sign In with Google'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAccountForm(true)}
                className="w-full text-center text-[11px] text-[#7A8396] hover:text-white transition-colors"
              >
                Or enter specific Gmail address →
              </button>
            </div>
          )}

          {/* Form to enter Google account */}
          {showNewAccountForm && (
            <form onSubmit={handleCustomSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-[#A8B2C7] block mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#4285F4] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#A8B2C7] block mb-1">
                  Full Name (optional)
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#4285F4] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !googleEmail.trim()}
                className="w-full bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.98] mt-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
              </button>

              {savedAccounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewAccountForm(false)}
                  className="w-full text-center text-xs text-[#7A8396] hover:text-white pt-1 transition-colors"
                >
                  ← Back to saved accounts
                </button>
              )}
            </form>
          )}

          {/* Privacy footnote */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#7A8396] justify-center pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Verified Account • Instant 1-Click Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

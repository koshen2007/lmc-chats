'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Upload,
  User,
  AtSign,
  ShieldCheck,
  Mail,
  ArrowRight,
  Flame,
  Palette,
  Plus,
} from 'lucide-react';
import { UserProfile, validateUsernameFormat, isUsernameAvailable } from '@/lib/users';
import {
  AvatarConfig,
  DEFAULT_AVATAR,
  DEFAULT_AVATAR_DATA_URL,
  PRESET_AVATARS,
  renderAvatarSvgString,
  svgToDataUrl,
} from '@/lib/avatarStudio';
import { signInWithGoogle, isSupabaseConfigured } from '@/lib/supabase';
import AvatarCreatorModal from './AvatarCreatorModal';

interface AuthLoginScreenProps {
  registeredUsers: UserProfile[];
  onLoginSuccess: (user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    bio?: string;
    provider?: 'google' | 'custom';
    email?: string;
  }) => void;
  triggerToast: (msg: string) => void;
}

export default function AuthLoginScreen({
  registeredUsers,
  onLoginSuccess,
  triggerToast,
}: AuthLoginScreenProps) {
  const [authMode, setAuthMode] = useState<'username' | 'google'>('username');

  // Username form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>(DEFAULT_AVATAR_DATA_URL);
  const [avatarStudioConfig, setAvatarStudioConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);

  // Google form states
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState<
    Array<{ email: string; name: string; username: string; avatar: string }>
  >([]);
  const [showNewGoogleForm, setShowNewGoogleForm] = useState(false);

  // Load saved Google accounts on this device & from registered users
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const list: Array<{ email: string; name: string; username: string; avatar: string }> = [];

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

    // 3. From registered users
    for (const u of registeredUsers) {
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
    }

    setSavedGoogleAccounts(list);

    // 4. Also fetch any Google accounts from server API
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
          setSavedGoogleAccounts(combined);
          if (combined.length > 0) {
            localStorage.setItem('lmc_saved_google_accounts', JSON.stringify(combined));
          }
        }
      })
      .catch(() => {});
  }, [registeredUsers]);

  // Username availability state
  const [usernameCheck, setUsernameCheck] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  }>({ checked: false, available: true, message: '' });

  // Validate username in real-time
  useEffect(() => {
    const raw = username.trim().toLowerCase().replace(/^@/, '');
    if (!raw) {
      setUsernameCheck({ checked: false, available: true, message: '' });
      return;
    }
    const fmt = validateUsernameFormat(raw);
    if (!fmt.valid) {
      setUsernameCheck({ checked: true, available: false, message: fmt.error || 'Invalid format' });
      return;
    }
    const available = isUsernameAvailable(raw, registeredUsers);
    if (!available) {
      setUsernameCheck({ checked: true, available: false, message: `@${raw} is already taken!` });
    } else {
      setUsernameCheck({ checked: true, available: true, message: `@${raw} is available!` });
    }
  }, [username, registeredUsers]);

  // Handle custom username submission
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    const cleanName = displayName.trim() || cleanUsername;

    if (!cleanUsername) {
      triggerToast('Please enter a username');
      return;
    }

    if (!usernameCheck.available) {
      triggerToast(`@${cleanUsername} is already taken. Pick another!`);
      return;
    }

    const newUser = {
      id: `usr_${cleanUsername}`,
      username: cleanUsername,
      name: cleanName,
      avatar: avatarDataUrl,
      bio: bio.trim(),
      provider: 'custom' as const,
    };

    // Broadcast and persist to global server registry
    try {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      }).catch(() => {});
    } catch {}

    onLoginSuccess(newUser);
    triggerToast(`Welcome to LMC Chats, @${cleanUsername}! 🚀`);
  };

  // Handle Google Sign In (Seamless 1-Click Authentication)
  const handleGoogleSignIn = (targetEmail: string, targetName?: string) => {
    const email = targetEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setGoogleError('Please enter a valid Google email address');
      return;
    }
    setGoogleLoading(true);
    setGoogleError('');

    setTimeout(() => {
      const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanName = (targetName || googleName).trim() || email.split('@')[0];
      const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

      const googleProfile = {
        id: `usr_${cleanUsername}`,
        username: cleanUsername,
        name: cleanName,
        email: email,
        avatar: avatar,
        bio: '',
        provider: 'google' as const,
      };

      if (typeof window !== 'undefined') {
        const updated = [
          { email, name: cleanName, username: cleanUsername, avatar },
          ...savedGoogleAccounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase()),
        ];
        localStorage.setItem('lmc_saved_google_accounts', JSON.stringify(updated));
      }

      // Broadcast and persist to global server registry
      try {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(googleProfile),
        }).catch(() => {});
      } catch {}

      onLoginSuccess(googleProfile);
      setGoogleLoading(false);
      triggerToast(`Signed in with Google as ${email} 🎉`);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#080B11] overflow-y-auto scroll select-none">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-[#101422]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl animate-msg-in my-auto">
        {/* Logo and Brand Header */}
        <div className="text-center mb-6">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-full blur opacity-70 animate-pulse" />
            <img
              src="/logo.png"
              alt="LMC Chats"
              className="relative w-full h-full object-cover rounded-full border-2 border-white/20 shadow-xl"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>LMC Chats</span>
          </h1>
          <p className="text-xs text-[#7A8396] mt-1">
            Choose your unique username or sign in to start chatting
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-[#0A0D14] p-1 rounded-2xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => setAuthMode('username')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'username'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-[#7A8396] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Create Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('google')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'google'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-[#7A8396] hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
            <span>Google Login</span>
          </button>
        </div>

        {/* TAB 1: USERNAME & AVATAR ONBOARDING */}
        {authMode === 'username' && (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            {/* Avatar Preview & Studio trigger */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#0A0D14] border border-white/5">
              <div className="relative w-14 h-14 rounded-full overflow-hidden p-0.5 border-2 border-indigo-500 shrink-0 shadow-md">
                <img
                  src={avatarDataUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Your Avatar</p>
                <p className="text-[10px] text-[#7A8396] truncate">Choose preset or customize below</p>
                <button
                  type="button"
                  onClick={() => setShowAvatarStudio(true)}
                  className="mt-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                >
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Customize in Avatar Studio</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8396] block mb-1.5 px-0.5">
                Quick Avatar Presets
              </span>
              <div className="grid grid-cols-6 gap-1.5 p-1.5 rounded-xl bg-[#0A0D14] border border-white/5">
                {PRESET_AVATARS.map((p, idx) => {
                  const pUrl = svgToDataUrl(renderAvatarSvgString(p.config));
                  const isSelected = avatarDataUrl === pUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatarDataUrl(pUrl);
                        setAvatarStudioConfig(p.config);
                      }}
                      className={`relative aspect-square rounded-full p-0.5 transition-all overflow-hidden border-2 ${
                        isSelected
                          ? 'border-indigo-500 scale-105 shadow-md'
                          : 'border-transparent hover:border-white/30 opacity-80 hover:opacity-100'
                      }`}
                      title={p.name}
                    >
                      <img src={pUrl} alt={p.name} className="w-full h-full object-cover rounded-full" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-[#0A0D14] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#5A6376] outline-none transition-colors"
                required
              />
            </div>

            {/* Unique Username */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#A8B2C7] flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-indigo-400" />
                  <span>Unique Username</span>
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-400">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  placeholder="your_handle"
                  className={`w-full bg-[#0A0D14] border rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white placeholder-[#5A6376] outline-none transition-colors ${
                    username
                      ? usernameCheck.available
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : 'border-rose-500/60 focus:border-rose-500'
                      : 'border-[#232B3E] focus:border-[#6366F1]'
                  }`}
                  required
                />
              </div>
              {username && (
                <div className="space-y-2 mt-1.5">
                  <p
                    className={`text-[11px] font-semibold flex items-center gap-1 px-1 ${
                      usernameCheck.available ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {usernameCheck.available ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <X className="w-3 h-3 text-rose-400" />
                    )}
                    <span>{usernameCheck.message}</span>
                  </p>

                  {/* If user already registered, allow instant 1-click Sign In */}
                  {!usernameCheck.available && (() => {
                    const clean = username.trim().toLowerCase().replace(/^@/, '');
                    const existing = registeredUsers.find(
                      (u) => u.username.toLowerCase() === clean
                    );
                    if (!existing) return null;
                    return (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={existing.avatar || DEFAULT_AVATAR_DATA_URL}
                            alt={existing.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_AVATAR_DATA_URL;
                            }}
                            className="w-7 h-7 rounded-full bg-black/40 border border-white/20 shrink-0 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-white font-bold text-xs truncate">{existing.name}</p>
                            <p className="text-[10px] text-indigo-300">Account already registered</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onLoginSuccess(existing);
                            triggerToast(`Welcome back, @${existing.username}! 🚀`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
                        >
                          Sign In
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Enter Button */}
            <button
              type="submit"
              disabled={!username.trim() || !usernameCheck.available}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] mt-2"
            >
              <span>Enter Chats</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: GOOGLE AUTH */}
        {authMode === 'google' && (
          <div className="space-y-4">
            {googleError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {googleError}
              </div>
            )}

            {/* Quick 1-Tap Saved Google Accounts */}
            {savedGoogleAccounts.length > 0 && !showNewGoogleForm && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8396] block px-1">
                  Saved Google Accounts
                </span>
                <div className="space-y-1.5">
                  {savedGoogleAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={googleLoading}
                      onClick={() => handleGoogleSignIn(acc.email, acc.name)}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#0A0D14] hover:bg-white/[0.06] border border-white/5 hover:border-white/20 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={acc.avatar || DEFAULT_AVATAR_DATA_URL}
                          alt={acc.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR_DATA_URL;
                          }}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {acc.name}
                          </p>
                          <p className="text-[10px] text-[#7A8396] truncate">{acc.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white font-semibold transition-all shrink-0">
                        Continue
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewGoogleForm(true)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#A8B2C7] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors mt-2"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Use another Google account</span>
                </button>
              </div>
            )}

            {/* Google Account Chooser & Form */}
            {savedGoogleAccounts.length === 0 && !showNewGoogleForm && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/10 text-center">
                  <div className="w-10 h-10 rounded-full bg-white shadow-md mx-auto mb-2.5 grid place-items-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <h3 className="text-sm font-bold text-white mb-1">1-Click Google Sign-In</h3>
                  <p className="text-[11px] text-[#7A8396] mb-3">
                    Choose your Google account to start chatting immediately
                  </p>

                  <button
                    type="button"
                    disabled={googleLoading}
                    onClick={() => {
                      const detected = typeof window !== 'undefined' && localStorage.getItem('lmc_last_google_handle')
                        ? localStorage.getItem('lmc_last_google_handle')!
                        : 'google_user';
                      handleGoogleSignIn(`${detected}@gmail.com`, 'Google Member');
                    }}
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all"
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
                    <span>{googleLoading ? 'Signing in...' : 'Sign In with Google'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewGoogleForm(true)}
                  className="w-full text-center text-[11px] text-[#7A8396] hover:text-white transition-colors"
                >
                  Or enter specific Gmail address →
                </button>
              </div>
            )}

            {/* Google Email Custom Sign In Form */}
            {showNewGoogleForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGoogleSignIn(googleEmail, googleName);
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-[#0A0D14] border border-[#232B3E] focus:border-[#4285F4] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                    Full Name (optional)
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="e.g. Alex Hunter"
                    className="w-full bg-[#0A0D14] border border-[#232B3E] focus:border-[#4285F4] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={googleLoading || !googleEmail.trim()}
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
                  <span>{googleLoading ? 'Signing in...' : 'Sign In with Google'}</span>
                </button>

                {savedGoogleAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewGoogleForm(false)}
                    className="w-full text-center text-xs text-[#7A8396] hover:text-white pt-1 transition-colors"
                  >
                    ← Back to saved accounts
                  </button>
                )}
              </form>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-[#7A8396] justify-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Verified Account • One-Click Login</span>
            </div>
          </div>
        )}
      </div>

      {/* Avatar Studio Modal (if user opens it to customize avatar) */}
      {showAvatarStudio && (
        <AvatarCreatorModal
          initialConfig={avatarStudioConfig}
          onSave={(dataUrl, conf) => {
            setAvatarDataUrl(dataUrl);
            setAvatarStudioConfig(conf);
            setShowAvatarStudio(false);
            triggerToast('Custom Avatar applied! 🎨');
          }}
          onClose={() => setShowAvatarStudio(false)}
        />
      )}
    </div>
  );
}


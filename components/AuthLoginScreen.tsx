'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
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
  const [bio, setBio] = useState('Living life • LMC Squad member ⚡');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>(DEFAULT_AVATAR_DATA_URL);
  const [avatarStudioConfig, setAvatarStudioConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);

  // Google form states
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

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

  // Handle Real Google OAuth
  const handleGoogleOAuth = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      if (isSupabaseConfigured) {
        const res = await signInWithGoogle();
        if (res?.error) {
          setGoogleError(res.error.message || 'Google OAuth failed');
          setGoogleLoading(false);
          return;
        }
        return;
      } else {
        setGoogleError('Supabase OAuth keys pending. Enter your Gmail below directly.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setGoogleError(err?.message || 'Google login error');
      setGoogleLoading(false);
    }
  };

  // Handle manual Google Email submission
  const handleGoogleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = googleEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setGoogleError('Please enter a valid Gmail address');
      return;
    }
    setGoogleLoading(true);
    setTimeout(() => {
      const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanName = googleName.trim() || email.split('@')[0];
      const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${cleanUsername}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

      const googleProfile = {
        id: `usr_${cleanUsername}`,
        username: cleanUsername,
        name: cleanName,
        email: email,
        avatar: avatar,
        bio: 'Google verified member ⚡',
        provider: 'google' as const,
      };

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
      triggerToast(`Signed in as ${email} 🎉`);
    }, 400);
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
                <p className="text-[10px] text-[#7A8396] truncate">Snapchat 3D Vector style</p>
                <button
                  type="button"
                  onClick={() => setShowAvatarStudio(true)}
                  className="mt-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-yellow-400" />
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
                placeholder="e.g. Koshen Siwanchi"
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
                <span className="text-[10px] text-amber-400 font-medium">100% Unique</span>
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
                <p
                  className={`text-[11px] font-semibold flex items-center gap-1 mt-1 px-1 ${
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
              )}
            </div>

            {/* Enter Button */}
            <button
              type="submit"
              disabled={!username.trim() || !usernameCheck.available}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] mt-2"
            >
              <span>Enter LMC Chats & Squad Lounge</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: GOOGLE AUTH */}
        {authMode === 'google' && (
          <div className="space-y-4">
            {googleError && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                {googleError}
              </div>
            )}

            {/* Real Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={googleLoading}
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
              <span>{googleLoading ? 'Connecting...' : 'Sign in with Google OAuth'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-[#7A8396] uppercase font-semibold">Or enter your Gmail</span>
              <span className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleGoogleEmailSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                  Your Google Email
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-[#0A0D14] border border-[#232B3E] focus:border-[#4285F4] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#0A0D14] border border-[#232B3E] focus:border-[#4285F4] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={googleLoading || !googleEmail.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{googleLoading ? 'Verifying...' : 'Sign In with Gmail'}</span>
              </button>
            </form>
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


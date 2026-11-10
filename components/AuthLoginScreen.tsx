'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Upload,
  User,
  AtSign,
  Lock,
  ArrowRight,
  Palette,
  Camera,
  Sparkles,
  ShieldCheck,
  FileText,
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
  // Mode: 'register' for first-time Instagram onboarding, 'signin' for returning users
  const [mode, setMode] = useState<'register' | 'signin'>('register');

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>(DEFAULT_AVATAR_DATA_URL);
  const [avatarStudioConfig, setAvatarStudioConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);

  // Sign in state for returning users
  const [signinUsername, setSigninUsername] = useState('');
  const [signinError, setSigninError] = useState('');

  // Real-time username validation
  const [usernameCheck, setUsernameCheck] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  }>({ checked: false, available: true, message: '' });

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
      setUsernameCheck({ checked: true, available: false, message: `@${raw} is already taken! Pick another.` });
    } else {
      setUsernameCheck({ checked: true, available: true, message: `@${raw} is available!` });
    }
  }, [username, registeredUsers]);

  // Handle custom photo upload
  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Please upload an image smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarDataUrl(reader.result);
        triggerToast('Profile photo uploaded! 📸');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle new user registration (Instagram Style)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    const cleanName = displayName.trim() || cleanUsername;

    if (!cleanUsername) {
      triggerToast('Please choose a username');
      return;
    }

    if (!usernameCheck.available) {
      triggerToast(`@${cleanUsername} is already taken. Please pick another!`);
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
    triggerToast(`Welcome to LMC Chats, @${cleanUsername}! 🎉`);
  };

  // Handle returning user sign in
  const handleSigninSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = signinUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    if (!clean) {
      setSigninError('Please enter your username');
      return;
    }

    const matched = registeredUsers.find(
      (u) => (u.username || '').toLowerCase() === clean
    );

    if (!matched) {
      setSigninError(`No account found with username @${clean}. Please register!`);
      return;
    }

    onLoginSuccess(matched);
    triggerToast(`Welcome back, @${matched.username}! 👋`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-[#080B11] overflow-y-auto scroll select-none">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card (Instagram / Telegram Onboarding Style) */}
      <div className="relative w-full max-w-md bg-[#101422]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl animate-msg-in my-auto max-h-[92vh] overflow-y-auto scroll">
        {/* Brand & Header */}
        <div className="text-center mb-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2.5">
            <div className="absolute -inset-1 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-full blur opacity-75 animate-pulse" />
            <img
              src="/logo.png"
              alt="LMC Chats"
              className="relative w-full h-full object-cover rounded-full border-2 border-white/20 shadow-xl"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-[#8A94A6] mt-1 max-w-xs mx-auto">
            {mode === 'register'
              ? 'Join your college squad on LMC Chats — instant, encrypted & real-time.'
              : 'Enter your permanent username to access your chats.'}
          </p>
        </div>

        {/* Tab Toggle: New Profile vs Existing Account */}
        <div className="flex bg-[#0A0D14] p-1 rounded-2xl border border-white/5 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setSigninError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-[#7A8396] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>New Profile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setSigninError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-[#7A8396] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* REGISTRATION FORM (Instagram Onboarding Style) */}
        {mode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* 1. Display / Full Name */}
            <div>
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1.5">
                Full Name / Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full bg-[#0A0D14] border border-[#232B3E] focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#5A6376] outline-none transition-colors"
                required
              />
            </div>

            {/* 2. Permanent Username Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#A8B2C7] flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-indigo-400" />
                  <span>Choose Your Username</span>
                </label>
                <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Permanent Handle
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-400">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  placeholder="choose_unique_handle"
                  className={`w-full bg-[#0A0D14] border rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#5A6376] outline-none transition-colors font-mono ${
                    username
                      ? usernameCheck.available
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : 'border-rose-500/60 focus:border-rose-500'
                      : 'border-[#232B3E] focus:border-indigo-500'
                  }`}
                  required
                />
              </div>

              {/* Live Availability Notice */}
              {username ? (
                <p
                  className={`text-[11px] font-semibold flex items-center gap-1 mt-1.5 px-1 ${
                    usernameCheck.available ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {usernameCheck.available ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-rose-400 shrink-0" />
                  )}
                  <span>{usernameCheck.message}</span>
                </p>
              ) : (
                <p className="text-[10px] text-[#7A8396] mt-1 px-1 flex items-center gap-1">
                  <span>💡 Letters, numbers & underscores (3–20 chars). Cannot be changed later.</span>
                </p>
              )}
            </div>

            {/* 3. Avatar Selection (Instagram / Bitmoji Style) */}
            <div className="p-3 bg-[#0A0D14] rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden p-0.5 border-2 border-indigo-500 shrink-0 shadow-md bg-[#161C28]">
                  <img
                    src={avatarDataUrl || DEFAULT_AVATAR_DATA_URL}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">Profile Avatar</p>
                  <p className="text-[10px] text-[#7A8396] truncate">Pick a 3D character or upload photo</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setShowAvatarStudio(true)}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>3D Studio</span>
                    </button>
                    <span className="text-[#3A4356]">•</span>
                    <label className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer transition-colors">
                      <Camera className="w-3 h-3" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCustomPhotoUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Instant 1-Tap Presets */}
              <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-white/5">
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
                          ? 'border-indigo-500 scale-105 shadow-md ring-2 ring-indigo-500/40'
                          : 'border-transparent hover:border-white/30 opacity-80 hover:opacity-100'
                      }`}
                      title={p.name}
                    >
                      <img src={pUrl} alt="" className="w-full h-full object-cover rounded-full" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Bio / College Status Quote */}
            <div>
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                Bio / College Status <span className="text-[10px] text-[#7A8396] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. BTech '26 ⚡ Campus vibes & Chai lover"
                maxLength={80}
                className="w-full bg-[#0A0D14] border border-[#232B3E] focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
              />
            </div>

            {/* Submit / Enter Chats Button */}
            <button
              type="submit"
              disabled={!username.trim() || !usernameCheck.available}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] mt-2"
            >
              <span>Complete Setup & Start Chatting</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* RETURNING USER SIGN IN FORM */
          <form onSubmit={handleSigninSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1.5">
                Your Registered Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-400">@</span>
                <input
                  type="text"
                  value={signinUsername}
                  onChange={(e) => {
                    setSigninUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    setSigninError('');
                  }}
                  placeholder="enter_your_username"
                  className="w-full bg-[#0A0D14] border border-[#232B3E] focus:border-indigo-500 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#5A6376] outline-none transition-colors font-mono"
                  required
                  autoFocus
                />
              </div>
              {signinError && (
                <p className="text-xs text-rose-400 mt-1.5 px-1 font-medium">{signinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!signinUsername.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign In to Account</span>
            </button>

            {/* Quick list of registered accounts on this device */}
            {registeredUsers.length > 0 && (
              <div className="pt-3 border-t border-white/5 space-y-2">
                <p className="text-[10px] text-[#7A8396] uppercase font-bold tracking-wider">
                  Select Existing Profile
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto scroll">
                  {registeredUsers.map((u) => (
                    <button
                      key={u.id || u.username}
                      type="button"
                      onClick={() => {
                        onLoginSuccess(u);
                        triggerToast(`Signed in as @${u.username}! 🚀`);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-[#0A0D14] hover:bg-white/5 border border-white/5 transition-all text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatar || DEFAULT_AVATAR_DATA_URL}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover bg-[#161C28] border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-indigo-400 font-mono truncate">@{u.username}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Login
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* 3D Bitmoji Studio Modal */}
      {showAvatarStudio && (
        <AvatarCreatorModal
          initialConfig={avatarStudioConfig}
          onClose={() => setShowAvatarStudio(false)}
          onSave={(dataUrl, config) => {
            setAvatarDataUrl(dataUrl);
            setAvatarStudioConfig(config);
            setShowAvatarStudio(false);
            triggerToast('Avatar customized! ✨');
          }}
        />
      )}
    </div>
  );
}

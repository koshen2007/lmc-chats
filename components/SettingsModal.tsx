'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  User,
  Palette,
  Bell,
  BellOff,
  Smartphone,
  ShieldCheck,
  LogOut,
  Camera,
  Check,
  Copy,
  Upload,
  Sparkles,
  Download,
  Key,
  CheckCheck,
  Image as ImageIcon,
  AtSign,
  Lock,
  Crown,
} from 'lucide-react';
export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  status?: 'online' | 'idle' | 'dnd';
  role?: 'admin' | 'user';
  provider?: 'google' | 'custom';
  email?: string;
}

import {
  WallpaperPresetId,
  BubbleThemeId,
  WALLPAPER_PRESETS,
  BUBBLE_THEMES,
  getWallpaperStyle,
  getBubbleClass,
  getBubbleStyle,
} from '@/lib/theme';
import { DEFAULT_AVATAR_DATA_URL } from '@/lib/avatarStudio';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onUpdateProfile: (name: string, bio: string, avatar: string) => void;
  onOpenAvatarStudio: () => void;
  // Theme & Wallpapers
  wallpaperPreset: WallpaperPresetId;
  customWallpaperImage?: string | null;
  bubbleTheme: BubbleThemeId;
  onUpdateTheme: (
    wallpaper: WallpaperPresetId,
    customImage: string | null,
    bubbleTheme: BubbleThemeId
  ) => void;
  // Sound & Notifications
  soundMuted: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  onToggleSoundOrNotification: () => void;
  // PWA
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  // Auth & Admin
  onOpenGoogleAuth?: () => void;
  onOpenAdminModal?: () => void;
  isAdmin?: boolean;
  onLogout: () => void;
  triggerToast: (msg: string) => void;
}

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'app' | 'security';

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onOpenAvatarStudio,
  wallpaperPreset,
  customWallpaperImage,
  bubbleTheme,
  onUpdateTheme,
  soundMuted,
  notificationPermission,
  onToggleSoundOrNotification,
  canInstallPwa,
  onInstallPwa,
  onOpenGoogleAuth,
  onOpenAdminModal,
  isAdmin = false,
  onLogout,
  triggerToast,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form State
  const [nameInput, setNameInput] = useState(currentUser.name || '');
  const [bioInput, setBioInput] = useState(currentUser.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar || DEFAULT_AVATAR_DATA_URL);

  // Theme State
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperPresetId>(wallpaperPreset);
  const [customImage, setCustomImage] = useState<string | null>(customWallpaperImage || null);
  const [currentBubble, setCurrentBubble] = useState<BubbleThemeId>(bubbleTheme);

  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      triggerToast('Avatar image must be smaller than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
        triggerToast('Photo loaded! Click "Save Changes" to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Wallpaper image must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomImage(reader.result);
        setCurrentWallpaper('custom');
        onUpdateTheme('custom', reader.result, currentBubble);
        triggerToast('Custom wallpaper applied! ✨');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      triggerToast('Display name cannot be empty');
      return;
    }
    onUpdateProfile(nameInput.trim(), bioInput.trim(), selectedAvatar);
    triggerToast('Profile updated successfully! ✅');
  };

  const handleSelectWallpaper = (wpId: WallpaperPresetId) => {
    setCurrentWallpaper(wpId);
    onUpdateTheme(wpId, wpId === 'custom' ? customImage : null, currentBubble);
  };

  const handleSelectBubble = (bId: BubbleThemeId) => {
    setCurrentBubble(bId);
    onUpdateTheme(currentWallpaper, customImage, bId);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'appearance', label: 'Themes & Chat', icon: <Palette className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'app', label: 'App & PWA', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Auth', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const userIdText = currentUser.id || `usr_${currentUser.username || 'me'}`;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-2xl bg-[#0F1420] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#131929]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 grid place-items-center text-white shadow-md">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Settings</h2>
              <p className="text-[11px] text-[#7A8396]">Customize your LMC Chats preferences & account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Sidebar Tabs + Content Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Navigation Bar / Tabs */}
          <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-white/10 p-2 md:p-3 bg-[#0B0F17]/60 flex md:flex-col gap-1 overflow-x-auto scroll shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-[#8892B0] hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}

            <div className="hidden md:block flex-1" />

            {/* Logout Quick Button */}
            <div className="hidden md:block pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out of LMC Chats?')) {
                    onLogout();
                    onClose();
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto scroll p-5 min-h-0 bg-[#0F1420]">
            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Avatar Preview & Actions */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#141A28] border border-white/5">
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-[#182030] border-2 border-indigo-500/50 shadow-lg">
                      <img
                        src={selectedAvatar || DEFAULT_AVATAR_DATA_URL}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_AVATAR_DATA_URL;
                        }}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAvatarStudio();
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>3D Bitmoji Studio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Upload Photo</span>
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCustomPhotoUpload}
                      />
                    </div>
                    <p className="text-[10px] text-[#7A8396]">
                      Choose a customized Bitmoji vector avatar or upload a custom photo.
                    </p>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-xs font-semibold text-[#8892B0] block mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your name..."
                    className="w-full bg-[#141A28] border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
                  />
                </div>

                {/* Username & ID (Read-only / Locked) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[#8892B0] flex items-center gap-1">
                        <AtSign className="w-3.5 h-3.5 text-[#818CF8]" />
                        <span>Permanent Username</span>
                      </label>
                      <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    </div>
                    <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-[#111622] border border-white/5 text-xs text-[#818CF8] font-mono select-all">
                      @{currentUser.username || 'user'}
                    </div>
                    <p className="text-[10px] text-[#5A6376] mt-1">Username is unique and permanent.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8892B0] block mb-1.5">
                      User ID
                    </label>
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#111622] border border-white/5 text-xs text-[#A8B2C7] font-mono">
                      <span className="truncate">{userIdText}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined') {
                            navigator.clipboard?.writeText(userIdText);
                            triggerToast('User ID copied to clipboard! 📋');
                          }
                        }}
                        className="p-1 hover:text-white transition-colors"
                        title="Copy User ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bio / Status */}
                <div>
                  <label className="text-xs font-semibold text-[#8892B0] block mb-1.5">
                    Bio / Status Quote
                  </label>
                  <textarea
                    rows={2}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Tell your squad what you're up to..."
                    className="w-full bg-[#141A28] border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none resize-none transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. APPEARANCE & THEMES TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Live Chat Bubble & Wallpaper Preview */}
                <div className="rounded-2xl p-4 border border-white/10 relative overflow-hidden shadow-inner" style={getWallpaperStyle(currentWallpaper, customImage)}>
                  <div className="space-y-3 relative z-10">
                    {/* Incoming Sample Bubble */}
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#141824] border border-white/10 flex items-center justify-center text-[10px] text-white shrink-0">
                        🤖
                      </div>
                      <div
                        style={getBubbleStyle(currentBubble, false)}
                        className="px-3.5 py-2 rounded-2xl rounded-tl-sm text-xs max-w-xs shadow-md border"
                      >
                        Hey! How does this wallpaper and bubble look?
                        <div className="text-[9px] text-[#7A8396] text-right mt-0.5">10:30 PM</div>
                      </div>
                    </div>

                    {/* Outgoing Sample Bubble */}
                    <div className="flex justify-end">
                      <div
                        style={getBubbleStyle(currentBubble, true)}
                        className={`px-3.5 py-2 rounded-2xl rounded-tr-sm text-xs max-w-xs shadow-md ${getBubbleClass(currentBubble)}`}
                      >
                        Looks super clean and readable! 🚀
                        <div className="text-[9px] opacity-70 text-right mt-0.5 flex items-center justify-end gap-1">
                          <span>10:31 PM</span>
                          <CheckCheck className="w-3 h-3 text-[#38BDF8]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallpaper Presets */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#A8B2C7]">
                      Chat Wallpaper
                    </label>
                    <button
                      type="button"
                      onClick={() => wallpaperInputRef.current?.click()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Custom Photo</span>
                    </button>
                    <input
                      ref={wallpaperInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCustomWallpaperUpload}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {WALLPAPER_PRESETS.map((preset) => {
                      const isSelected = currentWallpaper === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectWallpaper(preset.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                            isSelected
                              ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                              : 'border-white/5 hover:border-white/20'
                          }`}
                          style={{ background: preset.previewBg }}
                        >
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="text-xs font-bold text-white drop-shadow">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white grid place-items-center text-[10px]">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Bubble Colors */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#A8B2C7] block mb-2.5">
                    Message Bubble Color (Outgoing)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {BUBBLE_THEMES.map((theme) => {
                      const isSelected = currentBubble === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleSelectBubble(theme.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-white ring-2 ring-white/30'
                              : 'border-white/5 hover:border-white/20'
                          }`}
                          style={{ backgroundColor: theme.colorHex }}
                        >
                          <span className="text-xs font-bold text-white drop-shadow">
                            {theme.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-white text-black grid place-items-center text-[10px] shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#141A28] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 grid place-items-center">
                      {soundMuted ? <BellOff className="w-4 h-4 text-slate-400" /> : <Bell className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Audio Chimes & Sound Alerts</h4>
                      <p className="text-[11px] text-[#7A8396]">Play subtle pop sounds on incoming chat messages</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSoundOrNotification();
                      triggerToast(soundMuted ? 'Sound alerts enabled 🔔' : 'Sound alerts muted 🔕');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      soundMuted
                        ? 'bg-white/5 text-[#7A8396] hover:text-white'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {soundMuted ? 'Muted' : 'Enabled'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#141A28] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 grid place-items-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Browser Push Notifications</h4>
                      <p className="text-[11px] text-[#7A8396]">
                        Status: <span className="font-semibold text-white capitalize">{notificationPermission}</span>
                      </p>
                    </div>
                  </div>
                  {notificationPermission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleSoundOrNotification();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
                    >
                      Enable
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 4. APP & PWA TAB */}
            {activeTab === 'app' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#141A28] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 grid place-items-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Install Progressive Web App (PWA)</h4>
                      <p className="text-[11px] text-[#7A8396]">Install LMC Chats directly onto your Home Screen / Desktop</p>
                    </div>
                  </div>
                  {canInstallPwa ? (
                    <button
                      type="button"
                      onClick={() => {
                        onInstallPwa();
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/30 active:scale-95 transition-all"
                    >
                      Install
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Installed
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#141A28] border border-white/5 space-y-1.5">
                  <h4 className="text-xs font-bold text-white">Application Version</h4>
                  <p className="text-[11px] text-[#7A8396]">LMC Chats v2.5 (Zero-Trust Edition) • Supabase Realtime • WebRTC Engine</p>
                </div>
              </div>
            )}

            {/* 5. SECURITY & AUTH TAB */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#141A28] border border-white/5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 grid place-items-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Hardware-Bound WebCrypto Key</h4>
                      <p className="text-[10px] text-emerald-400 font-medium">ECDSA P-256 Non-Extractable • Active</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#7A8396]">
                    Every message sent is cryptographically signed using your browser's private hardware key stored in IndexedDB. Private keys cannot be extracted or spoofed by console scripts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#141A28] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 grid place-items-center">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Google Account Link</h4>
                        <p className="text-[10px] text-[#7A8396]">
                          {currentUser.provider === 'google' ? currentUser.email || 'Google Account Connected' : 'Connect Google for quick recovery'}
                        </p>
                      </div>
                    </div>
                    {onOpenGoogleAuth && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenGoogleAuth();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold active:scale-95 transition-all"
                      >
                        {currentUser.provider === 'google' ? 'Switch' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>

                {isAdmin && onOpenAdminModal && (
                  <div className="p-4 rounded-2xl bg-[#141A28] border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 grid place-items-center">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Channel Moderation Panel</h4>
                          <p className="text-[10px] text-amber-300">Admin privileges active</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAdminModal();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold active:scale-95 transition-all"
                      >
                        Open Panel
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to log out of LMC Chats?')) {
                        onLogout();
                        onClose();
                      }
                    }}
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold py-2.5 px-4 rounded-xl text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Log Out of Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

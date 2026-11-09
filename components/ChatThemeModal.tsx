'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Palette,
  Check,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  UploadCloud,
  CheckCheck,
} from 'lucide-react';
import {
  WallpaperPresetId,
  BubbleThemeId,
  WALLPAPER_PRESETS,
  BUBBLE_THEMES,
  getWallpaperStyle,
  getBubbleClass,
} from '@/lib/theme';

interface ChatThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWallpaper: WallpaperPresetId;
  currentCustomImage?: string | null;
  currentBubbleTheme: BubbleThemeId;
  onSaveTheme: (
    wallpaper: WallpaperPresetId,
    customImage: string | null,
    bubbleTheme: BubbleThemeId
  ) => void;
}

export default function ChatThemeModal({
  isOpen,
  onClose,
  currentWallpaper,
  currentCustomImage,
  currentBubbleTheme,
  onSaveTheme,
}: ChatThemeModalProps) {
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperPresetId>(currentWallpaper);
  const [customImage, setCustomImage] = useState<string | null>(currentCustomImage || null);
  const [selectedBubbleTheme, setSelectedBubbleTheme] = useState<BubbleThemeId>(currentBubbleTheme);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Wallpaper image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomImage(result);
      setSelectedWallpaper('custom');
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    onSaveTheme(selectedWallpaper, customImage, selectedBubbleTheme);
    onClose();
  };

  const handleResetDefaults = () => {
    setSelectedWallpaper('doodle');
    setCustomImage(null);
    setSelectedBubbleTheme('emerald');
  };

  const previewWallpaperStyle = getWallpaperStyle(selectedWallpaper, customImage);
  const previewBubbleClass = getBubbleClass(selectedBubbleTheme);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-msg-in">
      <div className="relative w-full max-w-lg bg-[#0F1420] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#131929] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 grid place-items-center text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Chat Wallpaper & Themes
              </h2>
              <p className="text-[11px] text-[#7A8396]">
                Customize your background doodles & message bubble colors
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#7A8396] hover:text-white grid place-items-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* 1. Live Interactive Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Live Chat Preview
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-[#7A8396] hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>

            <div
              className="w-full h-36 rounded-2xl border border-white/15 p-3 flex flex-col justify-end gap-2 overflow-hidden shadow-inner relative transition-all duration-300"
              style={previewWallpaperStyle}
            >
              {/* Incoming mock message */}
              <div className="self-start max-w-[75%] bg-[#141824]/90 backdrop-blur-md border border-[#232B3E] text-[#E9ECF4] px-3 py-1.5 rounded-xl rounded-tl-sm text-xs shadow-md">
                <span>Hey! Loving this new WhatsApp vibe 🔥</span>
                <span className="block text-[9px] text-[#7A8396] text-right mt-0.5">10:42 PM</span>
              </div>

              {/* Outgoing mock message with active bubble theme */}
              <div
                className={`self-end max-w-[75%] ${previewBubbleClass} px-3 py-1.5 rounded-xl rounded-tr-sm text-xs shadow-md transition-colors`}
              >
                <span>Same here, check out this wallpaper! 🚀</span>
                <div className="flex items-center justify-end gap-1 text-[9px] opacity-80 mt-0.5">
                  <span>10:43 PM</span>
                  <CheckCheck className="w-3 h-3 text-[#38BDF8]" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Chat Wallpaper Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              1. Choose Chat Wallpaper
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
              {WALLPAPER_PRESETS.map((preset) => {
                const isSelected = selectedWallpaper === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedWallpaper(preset.id)}
                    className={`relative rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-500/30'
                        : 'border-white/10 hover:border-white/25 bg-[#121724]'
                    }`}
                  >
                    <div
                      className="w-full h-11 rounded-lg border border-white/10 shadow-sm"
                      style={{ background: preset.previewBg }}
                    />
                    <span className="text-[11px] font-semibold text-white truncate max-w-full">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white grid place-items-center shadow-md">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Custom Upload Card */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 border text-center transition-all ${
                  selectedWallpaper === 'custom'
                    ? 'border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-500/30'
                    : 'border-white/10 hover:border-white/25 bg-[#121724]'
                }`}
              >
                <div
                  className="w-full h-11 rounded-lg border border-white/10 flex items-center justify-center bg-white/5 overflow-hidden"
                  style={customImage ? { backgroundImage: `url("${customImage}")`, backgroundSize: 'cover' } : {}}
                >
                  {!customImage && <UploadCloud className="w-5 h-5 text-indigo-400" />}
                </div>
                <span className="text-[11px] font-semibold text-white truncate max-w-full">
                  {customImage ? 'Custom Photo' : 'Upload Photo'}
                </span>
                {selectedWallpaper === 'custom' && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white grid place-items-center shadow-md">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* 3. Outgoing Message Bubble Colors */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              2. Outgoing Message Bubble Color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BUBBLE_THEMES.map((theme) => {
                const isSelected = selectedBubbleTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedBubbleTheme(theme.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500/15 ring-1 ring-indigo-500/40'
                        : 'border-white/10 hover:border-white/20 bg-[#121724]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shadow-sm shrink-0 flex items-center justify-center text-white"
                      style={{ backgroundColor: theme.colorHex }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span className="text-[11px] font-medium text-white truncate">
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#111624] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A94A6] hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Theme</span>
          </button>
        </div>
      </div>
    </div>
  );
}


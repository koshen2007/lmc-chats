'use client';

import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Share,
  PlusSquare,
  Zap,
  Bell,
  WifiOff,
  Sparkles,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  isIOS: boolean;
  isInstalled: boolean;
  onInstallSuccess: () => void;
}

export default function PWAInstallModal({
  isOpen,
  onClose,
  deferredPrompt,
  isIOS,
  isInstalled,
  onInstallSuccess,
}: PWAInstallModalProps) {
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install, open your browser menu (⋮ or ...) and tap "Install app" or "Add to Home Screen".');
      return;
    }

    try {
      setInstalling(true);
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        onInstallSuccess();
        onClose();
      }
    } catch (err) {
      console.error('PWA install error:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-msg-in">
      <div className="relative w-full max-w-md bg-[#0F1420] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Header with Glow */}
        <div className="relative p-6 bg-gradient-to-br from-[#182138] via-[#101626] to-[#0A0D15] border-b border-white/10 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#7A8396] hover:text-white grid place-items-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* App Icon */}
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#182138] border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/20 p-1">
              <img
                src="/logo.png"
                alt="LMC Chats"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0F1420] grid place-items-center text-white">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          </div>

          <h2 className="text-lg font-black text-white tracking-tight">
            Install LMC Chats App
          </h2>
          <p className="text-xs text-[#8A94A6] max-w-xs mt-1">
            Experience lightning fast messaging, instant push alerts, and fullscreen mode.
          </p>
        </div>

        {/* Value Prop Highlights */}
        <div className="p-5 space-y-3 bg-[#0B0F19]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 grid place-items-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">Instant 1-Tap Access</p>
              <p className="text-[11px] text-[#7A8396]">
                Opens like a native app directly from your Home Screen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 grid place-items-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">Background Push Notifications</p>
              <p className="text-[11px] text-[#7A8396]">
                Never miss incoming DMs, mentions, or voice calls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 grid place-items-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">Offline Shell & Zero Lag</p>
              <p className="text-[11px] text-[#7A8396]">
                Service Worker caches core assets for butter-smooth scrolling.
              </p>
            </div>
          </div>

          {/* Conditional Install Instructions */}
          {isInstalled ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>LMC Chats is already installed as a Standalone App!</span>
            </div>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Instructions */
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/25 space-y-2">
              <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                iOS Safari Instructions:
              </p>
              <ol className="text-[11px] text-[#A8B2C7] space-y-1.5 list-decimal list-inside pl-1">
                <li>
                  Tap the <strong className="text-white">Share</strong> button{' '}
                  <span className="inline-block p-1 bg-white/10 rounded">
                    <Share className="w-3 h-3 inline text-indigo-300" />
                  </span>{' '}
                  in Safari's bottom toolbar.
                </li>
                <li>
                  Scroll down and select{' '}
                  <strong className="text-white">Add to Home Screen</strong>{' '}
                  <span className="inline-block p-1 bg-white/10 rounded">
                    <PlusSquare className="w-3 h-3 inline text-indigo-300" />
                  </span>
                  .
                </li>
                <li>
                  Tap <strong className="text-white">Add</strong> in the top-right corner.
                </li>
              </ol>
            </div>
          ) : null}
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-[#0E131F] border-t border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A94A6] hover:text-white hover:bg-white/5 transition-colors"
          >
            Close
          </button>

          {!isInstalled && !isIOS && (
            <button
              type="button"
              disabled={installing}
              onClick={handleInstallClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{installing ? 'Installing...' : 'Install App 🚀'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


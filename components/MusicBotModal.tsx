'use client';

import React, { useState } from 'react';
import {
  X,
  Music,
  Play,
  Radio,
  Upload,
  Link as LinkIcon,
  Bot,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { MusicTrack, CURATED_TRACKS, formatTime } from '@/lib/musicPlayer';

interface MusicBotModalProps {
  currentTrackId?: string;
  isPlaying?: boolean;
  onSelectTrack: (track: MusicTrack) => void;
  onClose: () => void;
}

export default function MusicBotModal({
  currentTrackId,
  isPlaying,
  onSelectTrack,
  onClose,
}: MusicBotModalProps) {
  const [activeTab, setActiveTab] = useState<'curated' | 'url' | 'upload'>('curated');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');

  const handlePlayCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const newTrack: MusicTrack = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || 'Custom Stream Track',
      artist: customArtist.trim() || 'Online Audio',
      genre: 'Custom Stream',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      audioUrl: customUrl.trim(),
      durationSec: 180,
    };

    onSelectTrack(newTrack);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const newTrack: MusicTrack = {
          id: `upload-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Uploaded Audio',
          genre: 'Local Track',
          coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
          audioUrl: reader.result,
          durationSec: 120,
        };
        onSelectTrack(newTrack);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-lg bg-[#111522] border border-[#232B3E] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#141A2B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 grid place-items-center text-white shadow-md shadow-indigo-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">LMC Music Bot</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Bot Online
                </span>
              </div>
              <p className="text-xs text-[#7A8396]">Telegram-style room synced music for everyone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-[#0E121E]">
          <button
            type="button"
            onClick={() => setActiveTab('curated')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'curated'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Curated Tracks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Direct Audio URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload MP3</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto scroll flex-1 space-y-3">
          {/* 1. Curated Tracks */}
          {activeTab === 'curated' && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#7A8396] mb-1">
                Select a track to broadcast to everyone
              </p>
              {CURATED_TRACKS.map((t) => {
                const isSelected = currentTrackId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : 'bg-[#151A28] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover" />
                        {isSelected && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 h-full bg-white rounded-full animate-bounce" />
                              <span className="w-0.5 h-2/3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-0.5 h-4/5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{t.title}</p>
                        <p className="text-[11px] text-[#7A8396] truncate">{t.artist}</p>
                        <span className="inline-block text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded-md mt-0.5">
                          {t.genre} • {formatTime(t.durationSec)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTrack(t);
                        onClose();
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        isSelected && isPlaying
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSelected && isPlaying ? 'Playing' : 'Play Room'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Direct Audio Stream URL */}
          {activeTab === 'url' && (
            <form onSubmit={handlePlayCustomUrl} className="space-y-3.5">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl">
                <p className="text-xs text-indigo-300 font-medium">
                  Paste any direct audio stream or public MP3 URL. The bot will broadcast it across all members in this channel.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                  Audio Stream / MP3 URL *
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">Track Name</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="My Custom Song"
                    className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">Artist</label>
                  <input
                    type="text"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    placeholder="Artist Name"
                    className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
              >
                <Radio className="w-4 h-4" />
                <span>Broadcast Stream to Room</span>
              </button>
            </form>
          )}

          {/* 3. Upload MP3 */}
          {activeTab === 'upload' && (
            <div className="space-y-4 text-center p-6 bg-[#0E121E] border border-dashed border-[#232B3E] rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 grid place-items-center text-indigo-400 mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Upload MP3 / Audio from Device</p>
                <p className="text-[11px] text-[#7A8396] mt-0.5">
                  Play songs from your phone or PC directly in the channel
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-indigo-600/25">
                <Music className="w-4 h-4" />
                <span>Choose Audio File</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Bot Command Cheatsheet */}
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A8396] mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              Chat Bot Commands (Telegram Style)
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#A8B2C7] font-mono">
              <div className="p-1 rounded bg-black/30">
                <span className="text-indigo-400 font-bold">/play</span> [song name]
              </div>
              <div className="p-1 rounded bg-black/30">
                <span className="text-indigo-400 font-bold">/pause</span> - Pause audio
              </div>
              <div className="p-1 rounded bg-black/30">
                <span className="text-indigo-400 font-bold">/resume</span> - Resume audio
              </div>
              <div className="p-1 rounded bg-black/30">
                <span className="text-indigo-400 font-bold">/stop</span> - Stop & close
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  Volume2,
  FileAudio,
} from 'lucide-react';
import { MusicTrack, FEATURED_STATIONS, formatTime } from '@/lib/musicPlayer';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'stations'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handlePlayCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const trimmedUrl = customUrl.trim();
    const isStream = trimmedUrl.includes('stream') || trimmedUrl.includes('radio');

    const newTrack: MusicTrack = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || 'Custom Audio Stream',
      artist: customArtist.trim() || 'Online Audio',
      genre: isStream ? 'Live Radio Stream' : 'Web Audio',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
      audioUrl: trimmedUrl,
      durationSec: isStream ? 0 : 240,
      isLiveStream: isStream,
    };

    onSelectTrack(newTrack);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const fileBlobUrl = URL.createObjectURL(file);
    const tempAudio = new Audio();
    tempAudio.src = fileBlobUrl;

    const finalize = (duration: number) => {
      const reader = new FileReader();
      reader.onload = () => {
        setIsProcessingFile(false);
        if (typeof reader.result === 'string') {
          const rawName = file.name.replace(/\.[^/.]+$/, '');
          const newTrack: MusicTrack = {
            id: `upload-${Date.now()}`,
            title: rawName,
            artist: 'Your Device Audio',
            genre: 'Uploaded Track',
            coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
            audioUrl: reader.result,
            durationSec: Math.round(duration) || 180,
            isLiveStream: false,
          };
          onSelectTrack(newTrack);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    };

    tempAudio.onloadedmetadata = () => {
      finalize(tempAudio.duration);
    };

    tempAudio.onerror = () => {
      finalize(180);
    };

    // Fallback if metadata takes too long
    setTimeout(() => {
      if (isProcessingFile) finalize(180);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-msg-in">
      <div className="w-full max-w-lg bg-[#111622] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141926]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/25 grid place-items-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Audio & Music Player</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Synced
                </span>
              </div>
              <p className="text-[11px] text-[#6C7689]">Stream audio links or upload tracks in sync with the room</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] grid place-items-center text-[#8A94A6] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-[#0E121E] overflow-x-auto scroll whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Song</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Play Any Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stations')}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              activeTab === 'stations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Radio</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto scroll flex-1 space-y-3">
          {/* 1. Upload Any Song from Device */}
          {activeTab === 'upload' && (
            <div className="space-y-4 text-center p-6 bg-[#0E121E] border border-dashed border-[#232B3E] rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 grid place-items-center text-indigo-400 mx-auto">
                <FileAudio className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Choose Any Audio File from Device</p>
                <p className="text-xs text-[#7A8396] mt-1 max-w-sm mx-auto">
                  Select any MP3, WAV, M4A, or AAC song from your phone or PC. It will automatically play and sync for everyone in this channel!
                </p>
              </div>

              {isProcessingFile ? (
                <div className="py-2 text-indigo-400 font-semibold text-xs flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Loading audio file into room...
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-600/25">
                  <Upload className="w-4 h-4" />
                  <span>Choose Song from Mobile / PC</span>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              <div className="pt-2 border-t border-white/5 text-[11px] text-[#7A8396]">
                Supported formats: MP3, M4A, WAV, AAC, FLAC, OGG
              </div>
            </div>
          )}

          {/* 2. Direct Audio Stream URL */}
          {activeTab === 'url' && (
            <form onSubmit={handlePlayCustomUrl} className="space-y-3.5">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl">
                <p className="text-xs text-indigo-300 font-medium leading-relaxed">
                  Paste any direct public MP3 link, audio file URL (Google Drive direct stream, Dropbox, Discord attachment, Archive.org), or Internet Radio stream.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                  Audio Stream / Direct MP3 Link *
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/song.mp3 or radio stream"
                  className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#5A6376] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">Track Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. My Favorite Song"
                    className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">Artist / Channel</label>
                  <input
                    type="text"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    placeholder="e.g. Arijit / DJ / Online"
                    className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!customUrl.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
              >
                <Radio className="w-4 h-4" />
                <span>Broadcast Track to Room</span>
              </button>
            </form>
          )}

          {/* 3. Real 24/7 Live Radio Stations */}
          {activeTab === 'stations' && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#7A8396] mb-1">
                Real 24/7 Continuous Music Broadcasts
              </p>
              {FEATURED_STATIONS.map((t) => {
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
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md mt-0.5">
                          {t.isLiveStream && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                          {t.genre} {t.durationSec ? `• ${formatTime(t.durationSec)}` : '• 24/7 Live'}
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

          {/* Bot Command Cheatsheet */}
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A8396] mb-1.5 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              Telegram-Style Chat Commands
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#A8B2C7] font-mono">
              <div className="p-1.5 rounded bg-black/30">
                <span className="text-indigo-400 font-bold">/play</span> [audio-link]
              </div>
              <div className="p-1.5 rounded bg-black/30">
                <span className="text-indigo-400 font-bold">/pause</span> - Pause audio
              </div>
              <div className="p-1.5 rounded bg-black/30">
                <span className="text-indigo-400 font-bold">/music</span> - Open lounge
              </div>
              <div className="p-1.5 rounded bg-black/30">
                <span className="text-indigo-400 font-bold">/stop</span> - Close player
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Radio,
  Music,
  Users,
} from 'lucide-react';
import { MusicTrack, RoomPlaybackState, formatTime } from '@/lib/musicPlayer';

interface TelegramMusicPlayerProps {
  playbackState: RoomPlaybackState | null;
  currentUserId: string;
  onTogglePlay: (isPlaying: boolean) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (seconds: number) => void;
  onOpenLounge: () => void;
  onClosePlayer: () => void;
}

export default function TelegramMusicPlayer({
  playbackState,
  currentUserId,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onSeek,
  onOpenLounge,
  onClosePlayer,
}: TelegramMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Sync HTML5 audio with playbackState
  useEffect(() => {
    if (!audioRef.current || !playbackState) return;
    const audio = audioRef.current;

    if (audio.src !== playbackState.track.audioUrl) {
      audio.src = playbackState.track.audioUrl;
      audio.load();
    }

    // Calculate elapsed drift time if state was updated in the past
    const driftSec = Math.max(0, (Date.now() - playbackState.updatedAt) / 1000);
    const targetTime = playbackState.currentTime + (playbackState.isPlaying ? driftSec : 0);

    // If drift is significant (> 1.5s), resync position
    if (Math.abs(audio.currentTime - targetTime) > 1.5) {
      audio.currentTime = targetTime;
    }

    if (playbackState.isPlaying) {
      audio.play().catch(() => {
        // Autoplay may need user gesture
      });
    } else {
      audio.pause();
    }
  }, [playbackState?.track.id, playbackState?.isPlaying, playbackState?.updatedAt]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
    onSeek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  if (!playbackState) return null;

  const track = playbackState.track;
  const isPlaying = playbackState.isPlaying;

  return (
    <div className="w-full bg-[#111624]/95 backdrop-blur-md border-b border-[#232B3E] px-3 sm:px-4 py-2 transition-all shadow-lg animate-msg-in relative z-20">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNextTrack}
        loop={false}
      />

      <div className="flex items-center gap-2.5 sm:gap-4 max-w-7xl mx-auto">
        {/* Track Artwork with Spinning Disc or Waveform */}
        <button
          type="button"
          onClick={onOpenLounge}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 border border-indigo-500/30 group"
          title="Open Music Lounge & Bot"
        >
          <img
            src={track.coverUrl}
            alt={track.title}
            className={`w-full h-full object-cover transition-transform ${
              isPlaying ? 'scale-105' : 'opacity-85'
            }`}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Radio className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Title, Artist & Waveform */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-xs">
              {track.title}
            </span>
            <span className="text-[10px] text-[#7A8396] truncate hidden md:inline">
              • {track.artist}
            </span>

            {/* Telegram-style Animated Waveform EQ */}
            {isPlaying && (
              <span className="flex items-end gap-0.5 h-3 shrink-0 ml-1">
                <span className="w-0.5 h-full bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-2/3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-4/5 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-0.5 h-1/2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
              </span>
            )}

            {/* Room Sync Badge */}
            <span className="hidden sm:flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 shrink-0">
              <Users className="w-2.5 h-2.5" /> Room Sync
            </span>
          </div>

          {/* Scrubber Progress Slider */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#7A8396] font-mono shrink-0">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || track.durationSec || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-1 bg-[#1E2538] rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
            <span className="text-[10px] text-[#7A8396] font-mono shrink-0">
              {formatTime(duration || track.durationSec)}
            </span>
          </div>
        </div>

        {/* Player Controls (Prev, Play/Pause, Next) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onPrevTrack}
            className="w-7 h-7 rounded-lg text-[#7A8396] hover:text-white hover:bg-white/5 grid place-items-center transition-colors"
            title="Previous track"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onTogglePlay(!isPlaying)}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white grid place-items-center transition-transform active:scale-95 shadow-md shadow-indigo-600/30"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={onNextTrack}
            className="w-7 h-7 rounded-lg text-[#7A8396] hover:text-white hover:bg-white/5 grid place-items-center transition-colors"
            title="Next track"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume & Full Lounge Button */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 relative">
          <div className="relative">
            <button
              type="button"
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="w-7 h-7 rounded-lg text-[#7A8396] hover:text-white hover:bg-white/5 grid place-items-center transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {showVolumeSlider && (
              <div
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-[#1A2030] border border-white/10 rounded-xl p-2 shadow-xl flex items-center gap-2 w-28"
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-[#2D3748] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenLounge}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Music className="w-3 h-3" />
            <span>Lounge</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClosePlayer}
          className="w-6 h-6 rounded-lg text-[#5A6376] hover:text-white hover:bg-white/5 grid place-items-center transition-colors shrink-0"
          title="Stop & Close player"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}


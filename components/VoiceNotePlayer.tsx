'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, FastForward } from 'lucide-react';

interface VoiceNotePlayerProps {
  audioUrl: string;
  isMe?: boolean;
}

export default function VoiceNotePlayer({ audioUrl, isMe }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = parseFloat(e.target.value);
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    const nextSpeed: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextSpeed);
    if (audio) {
      audio.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 16 waveform decorative bars with simulated sound envelope
  const waveHeights = [25, 45, 80, 60, 95, 70, 40, 85, 100, 65, 90, 50, 75, 45, 60, 30];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border min-w-[220px] sm:min-w-[260px] max-w-full ${
        isMe
          ? 'bg-indigo-950/60 border-indigo-500/30 text-white'
          : 'bg-[#141826]/90 border-white/10 text-white'
      }`}
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full grid place-items-center shadow-md active:scale-95 transition-all shrink-0 ${
          isMe
            ? 'bg-white text-indigo-700 hover:bg-slate-100'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
        title={isPlaying ? 'Pause' : 'Play voice note'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        {/* Animated Waveform Visualizer */}
        <div className="relative h-6 flex items-center gap-[2.5px] cursor-pointer group">
          {waveHeights.map((h, i) => {
            const barPos = (i / waveHeights.length) * 100;
            const isPlayed = barPos <= progress;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-[3px] rounded-full transition-all duration-150 ${
                  isPlayed
                    ? isMe
                      ? 'bg-indigo-300'
                      : 'bg-indigo-400'
                    : isMe
                    ? 'bg-white/20'
                    : 'bg-white/15'
                } ${isPlaying ? 'animate-pulse' : ''}`}
              />
            );
          })}

          {/* Invisible interactive range input for scrubbing */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Timestamp display & Mic indicator */}
        <div className="flex items-center justify-between text-[10px] text-[#A8B2C7] font-mono select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : 'Voice memo'}</span>
        </div>
      </div>

      {/* Playback Speed Pill (1x / 1.5x / 2x) */}
      <button
        type="button"
        onClick={cycleSpeed}
        className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors shrink-0"
        title="Change playback speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
}

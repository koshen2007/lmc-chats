'use client';

import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallModalProps {
  call: {
    id: string;
    caller: string;
    caller_name: string;
    caller_avatar: string;
    type: 'audio' | 'video';
  };
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({
  call,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play realistic incoming ringtone
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const playRing = () => {
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.value = 440;
          osc2.frequency.value = 480;
          gain.gain.value = 0.08;

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          const now = ctx.currentTime;
          osc1.start(now);
          osc2.start(now);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
          osc1.stop(now + 1.7);
          osc2.stop(now + 1.7);
        };

        playRing();
        ringIntervalRef.current = setInterval(playRing, 3000);
      }
    } catch {}

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch {}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-msg-in">
      <div className="relative w-full max-w-sm bg-[#101422] border border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
        {/* Glowing ring animation around avatar */}
        <div className="relative mb-4">
          <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-full blur opacity-75 animate-ping" />
          <img
            src={call.caller_avatar || '/logo.png'}
            alt={call.caller_name}
            className="relative w-20 h-20 rounded-full object-cover border-4 border-indigo-500 shadow-xl"
          />
        </div>

        <h3 className="text-lg font-bold text-white tracking-tight">
          {call.caller_name}
        </h3>
        <p className="text-xs text-indigo-400 font-mono mt-0.5">@{call.caller}</p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
          {call.type === 'video' ? (
            <Video className="w-3.5 h-3.5 text-pink-400" />
          ) : (
            <Phone className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span>Incoming {call.type === 'video' ? 'Video' : 'Audio'} Call...</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-6 w-full">
          {/* Decline Button */}
          <button
            type="button"
            onClick={onDecline}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white grid place-items-center shadow-lg shadow-rose-600/30 group-active:scale-95 transition-all">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-rose-300">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white grid place-items-center shadow-lg shadow-emerald-600/30 group-active:scale-95 transition-all animate-bounce">
              {call.type === 'video' ? (
                <Video className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </div>
            <span className="text-[11px] font-semibold text-emerald-300">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}

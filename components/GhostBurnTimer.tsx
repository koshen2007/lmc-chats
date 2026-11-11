'use client';

import React, { useEffect, useState } from 'react';
import { Flame, Ghost } from 'lucide-react';

interface GhostBurnTimerProps {
  messageId: string;
  totalSeconds?: number;
  onBurn: (id: string) => void;
}

export default function GhostBurnTimer({
  messageId,
  totalSeconds = 10,
  onBurn,
}: GhostBurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isBurning, setIsBurning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsBurning(true);
          setTimeout(() => {
            onBurn(messageId);
          }, 350); // slight dissolve animation delay
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [messageId, onBurn]);

  const percentage = (timeLeft / totalSeconds) * 100;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all mt-1 ${
        timeLeft <= 3
          ? 'bg-red-500/15 text-red-400 border-red-500/30'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
      } ${isBurning ? 'scale-90 opacity-0 transition-opacity duration-300' : ''}`}
    >
      <Flame className={`w-3 h-3 ${timeLeft <= 3 ? 'text-red-400' : 'text-amber-400'}`} />
      <span>Ghost Mode: Burns in {timeLeft}s</span>
      <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden ml-0.5">
        <div
          className={`h-full transition-all duration-1000 ${
            timeLeft <= 3 ? 'bg-red-500' : 'bg-amber-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}


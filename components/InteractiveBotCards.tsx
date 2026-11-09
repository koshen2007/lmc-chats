'use client';

import React from 'react';
import {
  BarChart2,
  CheckCircle2,
  Footprints,
  Users,
  EyeOff,
  Lock,
  Unlock,
  Flame,
  Dices,
  Sparkles,
} from 'lucide-react';
import { Message } from '@/lib/supabase';

interface CardProps {
  message: Message;
  currentUsername: string;
  onUpdateMetadata?: (messageId: string, updatedMetadata: Record<string, any>) => void;
  triggerToast?: (msg: string) => void;
}

/**
 * 1. INTERACTIVE LIVE POLL CARD
 */
export function PollCard({ message, currentUsername, onUpdateMetadata, triggerToast }: CardProps) {
  const metadata = message.metadata || {};
  const question = metadata.question || message.content.replace(/^📊 \*\*POLL:\*\*\s*/i, '');
  const options: Array<{ id: string; text: string; votes: string[] }> = metadata.options || [];

  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  const cleanUser = currentUsername.trim().toLowerCase().replace(/^@/, '');

  const handleVote = (optionIndex: number) => {
    if (!onUpdateMetadata) return;
    if (!cleanUser) {
      triggerToast?.('Please sign in to vote in polls!');
      return;
    }

    const updatedOptions = options.map((opt, idx) => {
      const currentVotes = Array.isArray(opt.votes) ? [...opt.votes] : [];
      const userIndex = currentVotes.findIndex(
        (u) => u.toLowerCase().replace(/^@/, '') === cleanUser
      );

      if (idx === optionIndex) {
        if (userIndex === -1) {
          currentVotes.push(cleanUser); // Cast vote
        } else {
          currentVotes.splice(userIndex, 1); // Retract vote
        }
      } else {
        // Single choice poll: remove user vote from other options
        if (userIndex !== -1) {
          currentVotes.splice(userIndex, 1);
        }
      }
      return { ...opt, votes: currentVotes };
    });

    const newTotal = updatedOptions.reduce((s, o) => s + o.votes.length, 0);
    onUpdateMetadata(message.id, {
      ...metadata,
      options: updatedOptions,
      total_votes: newTotal,
    });
    triggerToast?.('Vote updated! 📊');
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-950/90 p-3.5 border border-indigo-500/30 shadow-lg shadow-indigo-950/30 my-1 space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
            Live Poll
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-white leading-snug">{question}</h4>

      <div className="space-y-1.5">
        {options.map((opt, idx) => {
          const voteCount = opt.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const hasVoted = (opt.votes || []).some(
            (u) => u.toLowerCase().replace(/^@/, '') === cleanUser
          );

          return (
            <button
              key={opt.id || idx}
              type="button"
              onClick={() => handleVote(idx)}
              className={`w-full relative overflow-hidden rounded-xl p-2.5 text-left border transition-all ${
                hasVoted
                  ? 'border-emerald-500/70 bg-emerald-950/20 shadow-sm'
                  : 'border-slate-700/60 hover:border-slate-600 bg-slate-800/50'
              }`}
            >
              {/* Animated Progress Bar Fill */}
              <div
                className={`absolute top-0 bottom-0 left-0 transition-all duration-500 rounded-xl ${
                  hasVoted ? 'bg-emerald-500/30' : 'bg-slate-700/40'
                }`}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative z-10 flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  {hasVoted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  <span className={`truncate ${hasVoted ? 'text-emerald-200 font-semibold' : 'text-slate-200'}`}>
                    {opt.text}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-300">
                  <span>{percentage}%</span>
                  <span className="text-[10px] text-slate-300">({voteCount})</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-center text-slate-300 italic">Tap any option to vote or change</p>
    </div>
  );
}

/**
 * 2. LIVE BUNK METER CARD
 */
export function BunkMeterCard({ message, currentUsername, onUpdateMetadata, triggerToast }: CardProps) {
  const metadata = message.metadata || {};
  const lecture = metadata.lecture || 'Class';
  const bunkers: Array<{ username: string; name: string; avatar?: string }> =
    metadata.bunkers || [];

  const cleanUser = currentUsername.trim().toLowerCase().replace(/^@/, '');
  const isJoined = bunkers.some((b) => (b.username || '').toLowerCase().replace(/^@/, '') === cleanUser);

  const handleToggleBunk = () => {
    if (!onUpdateMetadata) return;
    if (!cleanUser) {
      triggerToast?.('Please sign in to join the bunk squad!');
      return;
    }

    let updatedBunkers: Array<{ username: string; name: string; avatar?: string }>;
    if (isJoined) {
      updatedBunkers = bunkers.filter(
        (b) => (b.username || '').toLowerCase().replace(/^@/, '') !== cleanUser
      );
      triggerToast?.('You backed out of bunking! 🚶‍♂️');
    } else {
      updatedBunkers = [
        ...bunkers,
        {
          username: cleanUser,
          name: currentUsername,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`,
        },
      ];
      triggerToast?.('Bunk squad joined! See you in canteen 🏃‍♂️💨');
    }

    onUpdateMetadata(message.id, {
      ...metadata,
      bunkers: updatedBunkers,
    });
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-3.5 border border-amber-500/40 shadow-lg shadow-amber-950/20 my-1 space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Footprints className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
            Bunk Meter
          </span>
        </div>
        <span className="text-xs font-bold text-amber-300">
          {bunkers.length} {bunkers.length === 1 ? 'Bunker' : 'Bunkers'}
        </span>
      </div>

      <div>
        <p className="text-[11px] text-slate-300 uppercase font-semibold">Lecture to Bunk:</p>
        <h4 className="text-base font-bold text-white flex items-center gap-1.5">
          <span>{lecture}</span>
          <span>🏃‍♂️💨</span>
        </h4>
      </div>

      {bunkers.length > 0 && (
        <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>Confirmed Bunkers Squad:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bunkers.map((b, i) => (
              <span
                key={b.username || i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-500/10 border border-amber-500/30 text-amber-200"
              >
                <span>@{b.username || b.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggleBunk}
        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
          isJoined
            ? 'bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/50 text-rose-200'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20'
        }`}
      >
        <Footprints className="w-3.5 h-3.5" />
        <span>{isJoined ? "Back Out 🚶‍♂️ (I'll attend)" : "I'm In 🏃‍♂️ (Pakka Bunk!)"}</span>
      </button>
    </div>
  );
}

/**
 * 3. 100% ANONYMOUS CONFESSION CARD
 */
export function ConfessionCard({ message }: { message: Message }) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-purple-950/60 via-slate-900 to-fuchsia-950/40 p-3.5 border border-purple-500/40 shadow-xl shadow-purple-950/30 my-1 space-y-2">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
            <EyeOff className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300">
            LMC Anonymous Confession
          </span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-200">
          100% Sealed
        </span>
      </div>

      <div className="bg-slate-950/70 rounded-xl p-3 border border-purple-500/20 text-sm text-slate-100 font-medium leading-relaxed italic">
        &ldquo;{message.content}&rdquo;
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
        <span>Identity Shielded 🕵️</span>
        <span>LMC Chats Secret Drop</span>
      </div>
    </div>
  );
}

/**
 * 4. PRIVATE LOCKED WHISPER CARD
 */
export function WhisperCard({ message, currentUsername, triggerToast }: CardProps) {
  const metadata = message.metadata || {};
  const targetUser = (metadata.target_username || '').trim().toLowerCase().replace(/^@/, '');
  const senderUser = (message.sender_username || '').trim().toLowerCase().replace(/^@/, '');
  const cleanCurrent = currentUsername.trim().toLowerCase().replace(/^@/, '');

  const isAuthorized =
    cleanCurrent &&
    (cleanCurrent === targetUser ||
      cleanCurrent === senderUser ||
      cleanCurrent === 'koshensiwanchi@gmail.com' ||
      cleanCurrent === 'admin');

  return (
    <div
      className={`w-full max-w-sm rounded-2xl p-3.5 my-1 space-y-2 border transition-all ${
        isAuthorized
          ? 'bg-gradient-to-br from-blue-950/50 via-slate-900 to-indigo-950/40 border-blue-500/40 shadow-lg shadow-blue-950/30'
          : 'bg-slate-900/90 border-slate-700/60'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isAuthorized ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isAuthorized ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <span
            className={`text-xs uppercase font-bold tracking-wider ${
              isAuthorized ? 'text-blue-300' : 'text-slate-400'
            }`}
          >
            {isAuthorized ? 'Private Whisper Unlocked' : 'Locked Private Whisper'}
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          @{targetUser || 'user'}
        </span>
      </div>

      {isAuthorized ? (
        <div className="bg-blue-950/30 rounded-xl p-3 border border-blue-500/30 text-sm text-blue-100 font-medium leading-relaxed">
          {message.content}
        </div>
      ) : (
        <div
          onClick={() => triggerToast?.(`🔒 This whisper is locked and can only be read by @${targetUser}`)}
          className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 cursor-pointer text-center space-y-1 select-none"
        >
          <div className="filter blur-[5px] text-xs text-slate-500 select-none">
            This secret message is encrypted for the recipient only.
          </div>
          <p className="text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Only @{targetUser} can unblur and read this</span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 5. SAVAGE ROAST CARD
 */
export function RoastCard({ message }: { message: Message }) {
  const metadata = message.metadata || {};
  const target = metadata.target_name || 'Bhai';

  return (
    <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-rose-950/70 via-slate-900 to-orange-950/50 p-3.5 border border-rose-500/50 shadow-xl shadow-rose-950/40 my-1 space-y-2">
      <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 animate-pulse">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-rose-300">
            LMC Savage Roast
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40">
          Target: {target}
        </span>
      </div>

      <div className="bg-slate-950/80 rounded-xl p-3 border border-rose-500/20 text-sm font-semibold text-slate-100 leading-snug">
        {metadata.roast || message.content.replace(/^🔥[\s\S]*?\n\n/, '').replace(/^"|"$/g, '')}
      </div>

      <div className="flex items-center justify-between text-[10px] text-rose-300 font-medium">
        <span>Roasted by LMC Bot 🤖</span>
        <span>Burn Healer Needed 🧊</span>
      </div>
    </div>
  );
}

/**
 * 6. CANTEEN DECISION & COIN FLIP CARD
 */
export function DecisionCard({ message }: { message: Message }) {
  const metadata = message.metadata || {};
  const winner = metadata.winner || 'Option A';
  const commentary = metadata.commentary || 'LMC Bot verdict!';

  return (
    <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-indigo-950/50 p-3.5 border border-cyan-500/40 shadow-xl shadow-cyan-950/30 my-1 space-y-2">
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Dices className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-300">
            Canteen Bet Verdict
          </span>
        </div>
        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
      </div>

      <div className="bg-slate-950/80 rounded-xl p-3 border border-cyan-500/30 text-center space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">WINNER:</span>
        <div className="text-lg font-black text-white bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
          {winner}
        </div>
        <p className="text-xs text-cyan-200 italic font-medium pt-1">&ldquo;{commentary}&rdquo;</p>
      </div>

      <div className="text-[10px] text-center text-slate-300">
        Decided by LMC Bot Quantum Engine 🤖
      </div>
    </div>
  );
}


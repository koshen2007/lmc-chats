'use client';

import React from 'react';
import {
  MessageSquare,
  Users,
  Flame,
  Link as LinkIcon,
  Copy,
  Check,
  ArrowRight,
  Plus,
  Search,
} from 'lucide-react';

interface UserWelcomeModalProps {
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  };
  onClose: () => void;
  onCreateGroup: () => void;
  onSearchUsers: () => void;
}

export default function UserWelcomeModal({
  user,
  onClose,
  onCreateGroup,
  onSearchUsers,
}: UserWelcomeModalProps) {
  const [copiedId, setCopiedId] = React.useState(false);

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-lg bg-[#0F131D] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto scroll">
        {/* Header with Avatar & Greeting */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500/30 p-0.5 bg-black/40 mb-3.5 shadow-lg">
            <img
              src={user.avatar || '/logo.png'}
              alt={user.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo.png';
              }}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Welcome to LMC Chats, {user.name}!
          </h2>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">@{user.username}</p>
          <p className="text-xs text-[#7A8396] max-w-sm mt-1.5 leading-relaxed">
            Your profile and unique identifier have been created. Connect with friends and collaborate in real time.
          </p>

          {/* User ID Pill with Copy */}
          <div className="mt-3 inline-flex items-center gap-2 bg-[#141824] border border-[#232B3E] px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[#7A8396]">User ID:</span>
            <code className="text-white font-mono font-semibold">{user.id}</code>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1 rounded-md text-[#7A8396] hover:text-white hover:bg-white/10 transition-colors"
              title="Copy User ID"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 grid place-items-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white">Direct Messages (DMs)</h3>
            <p className="text-[11px] text-[#7A8396] leading-relaxed">
              Start 1-on-1 private conversations with any user by searching their handle or User ID.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 grid place-items-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white">Squad Channels</h3>
            <p className="text-[11px] text-[#7A8396] leading-relaxed">
              Create public or private rooms for group discussions, voice notes, audio and media sharing.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 grid place-items-center">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white">Burn-on-Read</h3>
            <p className="text-[11px] text-[#7A8396] leading-relaxed">
              Toggle Ghost Mode for sensitive notes. Messages auto-destruct 10 seconds after reading.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 grid place-items-center">
              <LinkIcon className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white">Direct Share Links</h3>
            <p className="text-[11px] text-[#7A8396] leading-relaxed">
              Share one-click invite links for your groups and personal profile to onboard contacts instantly.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateGroup();
            }}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-98 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Channel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSearchUsers();
            }}
            className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-98 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-pink-400" />
            <span>Search Users</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-[#7A8396] hover:text-white font-semibold text-xs flex items-center justify-center gap-1 active:scale-98 transition-all"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, UserPlus, Check, Users, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/users';

interface AddMemberModalProps {
  channelName: string;
  currentMembers: string[];
  registeredUsers: UserProfile[];
  onAddMember: (user: UserProfile) => void;
  onClose: () => void;
}

export default function AddMemberModal({
  channelName,
  currentMembers,
  registeredUsers,
  onAddMember,
  onClose,
}: AddMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [directInput, setDirectInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim().replace(/^@/, '');
    if (!q) return registeredUsers;
    return registeredUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
    );
  }, [searchQuery, registeredUsers]);

  const BLOCKED_FAKE_SET = new Set([
    'harshita', 'pryanshu', 'priyanshu', 'alex', 'sam', 'kira',
    'kai', 'aria', 'zayn', 'rin', 'marcus', 'elena', 'koshen'
  ]);

  const isMember = (u: UserProfile) => {
    const uName = (u.name || '').toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
    const uUsername = (u.username || '').toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
    return currentMembers.some((m) => {
      const clean = (m || '').toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
      return clean === uName || clean === uUsername;
    });
  };

  const handleDirectAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = directInput.trim().replace(/^@/, '').replace(/^usr_/, '').toLowerCase();
    if (!raw) return;

    if (BLOCKED_FAKE_SET.has(raw)) {
      setErrorMsg(`User "@${raw}" does not exist on LMC Chats.`);
      return;
    }

    setErrorMsg(null);
    setIsChecking(true);

    try {
      // 1. Check in loaded registeredUsers directory first
      let target = registeredUsers.find((u) => {
        const un = (u.username || '').toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
        const nm = (u.name || '').toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
        return (un === raw || nm === raw) && !BLOCKED_FAKE_SET.has(un);
      });

      // 2. If not found in memory, query server API for latest registered users
      if (!target) {
        try {
          const res = await fetch(`/api/users?q=${encodeURIComponent(raw)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.users && Array.isArray(data.users)) {
              target = data.users.find((u: UserProfile) => {
                const un = (u.username || '').toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
                const nm = (u.name || '').toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
                return (un === raw || nm === raw) && !BLOCKED_FAKE_SET.has(un);
              });
            }
          }
        } catch {
          // ignore network error
        }
      }

      // 3. Strictly reject non-existent users (DO NOT create fake dummy users)
      if (!target) {
        setErrorMsg(`User "@${raw}" does not exist on LMC Chats. Only real registered users can be added.`);
        setIsChecking(false);
        return;
      }

      // 4. Check if user is already in the channel
      if (isMember(target)) {
        setErrorMsg(`@${target.username} is already a member of #${channelName}`);
        setIsChecking(false);
        return;
      }

      // 5. Valid registered user found -> add them
      onAddMember(target);
      setDirectInput('');
      setErrorMsg(null);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-md bg-[#111522] border border-[#232B3E] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#141A2B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 grid place-items-center text-indigo-400 shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Add Members</span>
                <span className="text-xs text-indigo-400 font-normal">#{channelName}</span>
              </h2>
              <p className="text-xs text-[#7A8396]">Add anyone by @username or choose from directory</p>
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

        {/* Direct Add Input Box */}
        <div className="p-3 border-b border-white/10 bg-[#0E121E]">
          <form onSubmit={handleDirectAdd} className="flex gap-2">
            <div className="relative flex-1">
              <span className="text-[#818CF8] font-bold text-xs absolute left-3 top-1/2 -translate-y-1/2">@</span>
              <input
                type="text"
                value={directInput}
                onChange={(e) => {
                  setDirectInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter exact @username to add..."
                className="w-full bg-[#151A28] border border-[#232B3E] focus:border-indigo-500 rounded-xl pl-7 pr-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!directInput.trim() || isChecking}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              {isChecking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>{isChecking ? 'Checking...' : 'Add'}</span>
            </button>
          </form>

          {/* Validation & Non-Existent User Error Banner */}
          {errorMsg && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-msg-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Search input (only shown if there are registered users to filter) */}
        {registeredUsers.length > 0 && (
          <div className="p-3 border-b border-white/5 bg-[#111522]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7A8396] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter registered users..."
                className="w-full bg-[#151A28] border border-[#232B3E] focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* User list */}
        <div className="p-3 sm:p-4 overflow-y-auto scroll flex-1 space-y-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => {
              const alreadyIn = isMember(u);
              return (
                <div
                  key={u.id || u.username}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[#151A28] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#1D2436] p-0.5 border border-white/10 shrink-0">
                      <img
                        src={u.avatar || '/logo.png'}
                        alt={u.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/logo.png';
                        }}
                        className="w-full h-full object-cover rounded-full"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111522] ${
                          u.status === 'online'
                            ? 'bg-emerald-400'
                            : u.status === 'idle'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{u.name}</span>
                        <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                          @{u.username}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7A8396] truncate max-w-[180px] sm:max-w-xs">
                        {u.bio || 'Squad member'}
                      </p>
                    </div>
                  </div>

                  {alreadyIn ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-white/5 text-[#7A8396] flex items-center gap-1 border border-white/5 shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Member</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddMember(u)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-indigo-600/20 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 text-[#7A8396]">
              <Users className="w-10 h-10 mx-auto mb-2.5 opacity-40 text-indigo-400" />
              <p className="text-xs font-bold text-white mb-1">No Other Users Registered Yet</p>
              <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                All fake dummy members have been removed. When your friends register with a unique <span className="text-indigo-400 font-mono">@username</span>, they will appear here, or you can add them directly using the box above!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


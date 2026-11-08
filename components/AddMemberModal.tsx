'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, UserPlus, Check, Users } from 'lucide-react';
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

  const isMember = (u: UserProfile) => {
    const uName = u.name.toLowerCase();
    const uUsername = u.username.toLowerCase();
    return currentMembers.some(
      (m) => m.toLowerCase() === uName || m.toLowerCase() === uUsername || m.toLowerCase() === `@${uUsername}`
    );
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
              <p className="text-xs text-[#7A8396]">Search by @username or display name</p>
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

        {/* Search input */}
        <div className="p-3 border-b border-white/10 bg-[#0E121E]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7A8396] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by @username or name..."
              className="w-full bg-[#151A28] border border-[#232B3E] focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
              autoFocus
            />
          </div>
        </div>

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
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover rounded-full" />
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
            <div className="text-center py-8 text-[#7A8396]">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-white">No users found</p>
              <p className="text-[10px] mt-0.5">Try searching with a different @username</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

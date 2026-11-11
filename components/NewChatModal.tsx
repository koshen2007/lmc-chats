'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Users, MessageSquare, Compass } from 'lucide-react';
import { UserProfile } from '@/lib/users';
import { DEFAULT_AVATAR_DATA_URL } from '@/lib/avatarStudio';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: UserProfile[];
  currentUserId: string;
  currentUsername: string;
  presenceMap: Record<string, { is_online: boolean; last_seen_text: string }>;
  onStartDm: (user: UserProfile) => void;
  onCreateGroup: () => void;
  onDiscoverChannels: () => void;
}

export default function NewChatModal({
  isOpen,
  onClose,
  registeredUsers,
  currentUserId,
  currentUsername,
  presenceMap,
  onStartDm,
  onCreateGroup,
  onDiscoverChannels,
}: NewChatModalProps) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const myHandle = (currentUsername || '').toLowerCase();

  // Filter out self and search by query
  const filteredUsers = registeredUsers.filter((u) => {
    if (!u || !u.username) return false;
    if (u.username.toLowerCase() === myHandle) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase().replace(/^@/, '');
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-msg-in">
      <div className="w-full max-w-md bg-[#111622] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141926]">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">New Conversation</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] grid place-items-center text-[#8A94A6] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-white/[0.06] bg-[#0B0E14]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6C7689] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts by name or @username..."
              autoFocus
              className="w-full bg-[#111622] border border-white/10 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Quick Action Buttons (New Group & Discover) */}
        <div className="p-3 border-b border-white/[0.06] flex gap-2 bg-[#0E121B]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateGroup();
            }}
            className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Create Channel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onDiscoverChannels();
            }}
            className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-slate-300" />
            <span>Browse Channels</span>
          </button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#6C7689]">
            People ({filteredUsers.length})
          </p>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-[#6C7689]">No contacts found matching "{query}"</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const handle = u.username.toLowerCase();
              const presence = presenceMap[handle];
              const isOnline = presence?.is_online;

              return (
                <button
                  key={u.id || u.username}
                  type="button"
                  onClick={() => {
                    onStartDm(u);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-[#171D2B] border border-white/10">
                        <img
                          src={u.avatar || DEFAULT_AVATAR_DATA_URL}
                          alt={u.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR_DATA_URL;
                          }}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      {isOnline ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#111622]" />
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-[#111622]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {u.name}
                        </p>
                        <span className="text-[11px] text-[#818CF8] font-mono truncate">
                          @{u.username}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6C7689] truncate mt-0.5">
                        {isOnline ? (
                          <span className="text-emerald-400 font-medium">Online</span>
                        ) : (
                          <span>{presence?.last_seen_text || u.bio || 'Offline'}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-medium text-xs border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    Message
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


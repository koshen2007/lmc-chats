'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Users, MessageSquare, Hash, UserPlus, Compass } from 'lucide-react';
import { UserProfile } from '@/lib/users';

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
    <div className="fixed inset-0 z-[220] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-msg-in">
      <div className="w-full max-w-md bg-[#111520] border border-[#232B3E] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">New Chat</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-white/5 bg-[#0B0E17]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7A8396] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts, @username, or User ID..."
              autoFocus
              className="w-full bg-[#131722] border border-[#232B3E] focus:border-emerald-500 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#5A6376] outline-none"
            />
          </div>
        </div>

        {/* Quick Action Buttons (New Group & Discover) */}
        <div className="p-3 border-b border-white/5 flex gap-2 bg-[#0E121B]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateGroup();
            }}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all group"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>New Group</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onDiscoverChannels();
            }}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all group"
          >
            <Compass className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
            <span>Discover</span>
          </button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#7A8396]">
            Contacts & Squad Members ({filteredUsers.length})
          </p>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-[#7A8396]">No contacts found matching "{query}"</p>
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
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#161C28] border border-white/10">
                        <img
                          src={
                            u.avatar ||
                            `https://api.dicebear.com/7.x/notionists/svg?seed=${u.username}`
                          }
                          alt={u.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/logo.png';
                          }}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      {isOnline ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#111520] animate-pulse" />
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-[#111520]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                          {u.name}
                        </p>
                        <span className="text-[10px] text-indigo-400 font-mono truncate">
                          @{u.username}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7A8396] truncate mt-0.5">
                        {isOnline ? (
                          <span className="text-emerald-400 font-medium">Online</span>
                        ) : (
                          <span>{presence?.last_seen_text || `ID: ${u.id || 'usr_' + u.username}`}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold text-xs border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                    Chat
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


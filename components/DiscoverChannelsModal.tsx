'use client';

import React, { useState } from 'react';
import { Hash, Plus, X, Search, Users, ArrowRight, Lock, Check } from 'lucide-react';
import { Group } from '@/lib/supabase';

interface DiscoverChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  activeGroupId: string;
  currentUserId: string;
  onSelectGroup: (id: string) => void;
  onJoinGroup: (id: string) => void;
  onOpenCreateChannel: () => void;
}

export default function DiscoverChannelsModal({
  isOpen,
  onClose,
  groups,
  activeGroupId,
  currentUserId,
  onSelectGroup,
  onJoinGroup,
  onOpenCreateChannel,
}: DiscoverChannelsModalProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      (g.description || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-lg bg-[#101422] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#141826] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 grid place-items-center text-white shadow-md">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Discover Channels</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                  {groups.length} Channels
                </span>
              </h2>
              <p className="text-xs text-[#7A8396]">Browse public rooms or create your own</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateChannel();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/5 bg-[#0D1017]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7A8396] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels by name or topic..."
              className="w-full bg-[#141826] border border-white/10 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto scroll p-3 sm:p-4 space-y-2.5">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((g) => {
              const members = g.members || [];
              const isMember = members.some(
                (m) =>
                  m.toLowerCase() === currentUserId.toLowerCase() ||
                  m.toLowerCase() === `@${currentUserId.toLowerCase()}`
              );
              const isActive = g.id === activeGroupId;

              return (
                <div
                  key={g.id}
                  className="p-3.5 rounded-2xl bg-[#141826]/70 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                      <img src={g.avatar || '/logo.png'} alt={g.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white truncate">#{g.name}</p>
                        {g.is_private && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                        {isActive && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7A8396] truncate mt-0.5">
                        {members.length} members • {g.description || 'Squad channel'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isMember ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectGroup(g.id);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Open</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onJoinGroup(g.id);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Join</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-[#7A8396]">No channels found matching "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

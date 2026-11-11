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
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-msg-in">
      <div className="w-full max-w-lg bg-[#111622] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141926] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/25 grid place-items-center text-indigo-400">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Browse Channels</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.06] text-[#A6B0C3] font-medium">
                  {groups.length}
                </span>
              </h2>
              <p className="text-[11px] text-[#6C7689]">Discover public rooms or create a new channel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateChannel();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] grid place-items-center text-[#8A94A6] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/[0.06] bg-[#0B0E14]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6C7689] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter channels by name or topic..."
              className="w-full bg-[#111622] border border-white/10 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto scroll p-3 sm:p-4 space-y-2">
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
                  className="p-3 rounded-xl bg-[#0E121B] border border-white/[0.07] hover:border-indigo-500/30 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#171D2B] border border-white/10 shrink-0">
                      <img src={g.avatar || '/logo.png'} alt={g.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">#{g.name}</p>
                        {g.is_private && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6C7689] truncate mt-0.5">
                        {members.length} members • {g.description || 'Public channel'}
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
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-medium flex items-center gap-1.5 transition-all"
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
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
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
              <p className="text-xs text-[#6C7689]">No channels found matching "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


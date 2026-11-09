'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  User,
  Hash,
  Copy,
  UserPlus,
  Phone,
  Video,
  Check,
  Sparkles,
  ExternalLink,
  Users,
  Compass,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { UserProfile, searchUsersInstagramStyle } from '@/lib/users';
import { Group } from '@/lib/supabase';

interface InstagramSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: UserProfile[];
  groups: Group[];
  activeGroup: Group;
  currentUserId: string;
  onSelectUser: (user: UserProfile) => void;
  onAddMemberToChannel: (user: UserProfile) => void;
  onJoinGroup: (groupId: string) => void;
  onStartCall: (type: 'audio' | 'video', name: string, avatar: string) => void;
  triggerToast: (msg: string) => void;
  onSyncUsers?: (users: UserProfile[]) => void;
}

type SearchTab = 'all' | 'accounts' | 'channels';

export default function InstagramSearchModal({
  isOpen,
  onClose,
  registeredUsers,
  groups,
  activeGroup,
  currentUserId,
  onSelectUser,
  onAddMemberToChannel,
  onJoinGroup,
  onStartCall,
  triggerToast,
  onSyncUsers,
}: InstagramSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [serverUsers, setServerUsers] = useState<UserProfile[]>([]);

  const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');

  // Live fetch from server directory across all devices
  React.useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const fetchUsers = async () => {
      try {
        const url = cleanQuery
          ? `/api/users?q=${encodeURIComponent(cleanQuery)}`
          : '/api/users';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.users)) {
            setServerUsers(data.users);
            if (onSyncUsers) {
              onSyncUsers(data.users);
            }
          }
        }
      } catch (err) {
        // Fallback silently to client registeredUsers
      }
    };

    fetchUsers();
    const timer = setTimeout(fetchUsers, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [cleanQuery, isOpen, onSyncUsers]);

  if (!isOpen) return null;

  // Merge prop registeredUsers with serverUsers (deduplicate by username or id)
  const allAvailableUsers = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of registeredUsers) {
      if (u && u.username) map.set(u.username.toLowerCase(), u);
    }
    for (const u of serverUsers) {
      if (u && u.username) map.set(u.username.toLowerCase(), u);
    }
    return Array.from(map.values());
  }, [registeredUsers, serverUsers]);

  // Instagram-Style Ranked Filter
  const matchedUsers = useMemo(() => {
    return searchUsersInstagramStyle(cleanQuery, allAvailableUsers);
  }, [cleanQuery, allAvailableUsers]);

  // Filter Channels / Groups
  const matchedGroups = useMemo(() => {
    if (!cleanQuery) return groups;
    return groups.filter((g) => {
      const matchName = g.name.toLowerCase().includes(cleanQuery);
      const matchDesc = (g.description || '').toLowerCase().includes(cleanQuery);
      return matchName || matchDesc;
    });
  }, [cleanQuery, groups]);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      triggerToast(`Copied ID: ${id} 📋`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-2xl bg-[#0F131E] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Instagram Header with Large Search Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#141826] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 grid place-items-center text-white shadow-md">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Instagram Search</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    ID & Users
                  </span>
                </h2>
                <p className="text-[11px] text-[#7A8396]">Search anyone by User ID (`usr_...`), @username, or name</p>
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

          {/* Search Input Bar (Instagram Style) */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#7A8396] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by User ID (usr_...), @username, name, channel..."
              className="w-full bg-[#0A0D14] border border-white/10 focus:border-[#6366F1] rounded-2xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-[#5A6376] outline-none transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/5 text-[#8892B0] hover:text-white hover:bg-white/10'
              }`}
            >
              All Results ({matchedUsers.length + matchedGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'accounts'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/5 text-[#8892B0] hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Accounts ({matchedUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'channels'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/5 text-[#8892B0] hover:text-white hover:bg-white/10'
              }`}
            >
              <Hash className="w-3 h-3" />
              <span>Channels ({matchedGroups.length})</span>
            </button>
          </div>
        </div>

        {/* Search Results Body */}
        <div className="flex-1 overflow-y-auto scroll p-3 sm:p-5 space-y-4">
          {/* SECTION 1: USERS / ACCOUNTS */}
          {(activeTab === 'all' || activeTab === 'accounts') && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A8396] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Squad Users & IDs</span>
                </span>
                <span className="text-[10px] text-[#7A8396]">
                  {matchedUsers.length} found
                </span>
              </div>

              {matchedUsers.length > 0 ? (
                <div className="space-y-2">
                  {matchedUsers.map((u) => {
                    const isSelf = u.id === currentUserId || u.username === currentUserId;
                    const userId = u.id || `usr_${u.username}`;
                    const isAlreadyMember = (activeGroup?.members || []).some(
                      (m) =>
                        m.toLowerCase() === u.name.toLowerCase() ||
                        m.toLowerCase() === `@${u.username.toLowerCase()}` ||
                        m.toLowerCase() === u.username.toLowerCase()
                    );

                    return (
                      <div
                        key={u.id || u.username}
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-[#141826]/70 hover:bg-[#1A2033] border border-white/5 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-sm"
                      >
                        {/* User Avatar + Identity Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Instagram Story Gradient Ring */}
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-indigo-500 shadow-md">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-full h-full object-cover rounded-full bg-[#0D1017]"
                              />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#141826]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Display Name + Verified Badge */}
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                {u.name}
                              </p>
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white grid place-items-center text-[8px] font-black shrink-0" title="Verified Squad Member">
                                ✓
                              </span>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-white font-semibold">
                                  You
                                </span>
                              )}
                            </div>

                            {/* Handle & ID Pill */}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-indigo-400 font-mono font-semibold">
                                @{u.username}
                              </span>

                              {/* Clickable 1-Click Copy ID Pill */}
                              <button
                                type="button"
                                onClick={(e) => handleCopyId(e, userId)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 hover:bg-black/60 border border-white/10 text-[10px] text-[#A8B2C7] font-mono transition-colors"
                                title="Click to copy User ID"
                              >
                                <span>{userId}</span>
                                {copiedId === userId ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-[#7A8396]" />
                                )}
                              </button>
                            </div>

                            {/* Bio */}
                            {u.bio && (
                              <p className="text-[11px] text-[#7A8396] truncate mt-1 max-w-sm">
                                {u.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div
                          className="flex items-center gap-1.5 self-end sm:self-center shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Add to Active Group */}
                          {!isSelf && activeGroup && (
                            <button
                              type="button"
                              onClick={() => {
                                onAddMemberToChannel(u);
                                triggerToast(`Added @${u.username} to #${activeGroup.name}`);
                              }}
                              disabled={isAlreadyMember}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                isAlreadyMember
                                  ? 'bg-white/5 text-[#7A8396] cursor-default'
                                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 active:scale-95'
                              }`}
                              title={isAlreadyMember ? 'Already a member' : `Add to #${activeGroup.name}`}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{isAlreadyMember ? 'In Group' : 'Add'}</span>
                            </button>
                          )}

                          {/* Quick Voice Call */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => {
                                onStartCall('audio', u.name, u.avatar);
                                onClose();
                              }}
                              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 grid place-items-center transition-all active:scale-90"
                              title={`Call ${u.name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Video Call */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => {
                                onStartCall('video', u.name, u.avatar);
                                onClose();
                              }}
                              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-400 grid place-items-center transition-all active:scale-90"
                              title={`Video Call ${u.name}`}
                            >
                              <Video className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Profile */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectUser(u);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all active:scale-95 shadow-md shadow-indigo-600/20"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-black/20 rounded-2xl border border-white/5">
                  <p className="text-xs text-[#7A8396]">No squad users found matching "{query}"</p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: CHANNELS / ROOMS */}
          {(activeTab === 'all' || activeTab === 'channels') && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A8396] flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Channels & Squad Rooms</span>
                </span>
                <span className="text-[10px] text-[#7A8396]">
                  {matchedGroups.length} available
                </span>
              </div>

              {matchedGroups.length > 0 ? (
                <div className="space-y-2">
                  {matchedGroups.map((g) => {
                    const isMember = (g.members || []).some(
                      (m) => m === currentUserId || m === `@${currentUserId}`
                    );
                    const isCurrentActive = g.id === activeGroup.id;

                    return (
                      <div
                        key={g.id}
                        className="p-3 rounded-2xl bg-[#141826]/70 hover:bg-[#1A2033] border border-white/5 hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                            <img
                              src={g.avatar || '/logo.png'}
                              alt={g.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                              <span>#{g.name}</span>
                              {g.is_private && <span className="text-xs">🔒</span>}
                            </p>
                            <p className="text-[11px] text-[#7A8396] truncate">
                              {(g.members || []).length} members • {g.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrentActive ? (
                            <span className="text-[11px] font-semibold text-indigo-400 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                              Active Room
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onJoinGroup(g.id);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1"
                            >
                              <span>{isMember ? 'Open Chat' : 'Join Room'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-black/20 rounded-2xl border border-white/5">
                  <p className="text-xs text-[#7A8396]">No channels found matching "{query}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


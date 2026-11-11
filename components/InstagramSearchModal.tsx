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
  ExternalLink,
  MessageSquare,
  Link as LinkIcon,
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
  activeGroup?: Group | null;
  currentUserId: string;
  onSelectUser: (user: UserProfile) => void;
  onAddMemberToChannel: (user: UserProfile) => void;
  onJoinGroup: (groupId: string) => void;
  onStartCall: (type: 'audio' | 'video', name: string, avatar: string) => void;
  triggerToast: (msg: string) => void;
  onSyncUsers?: (users: UserProfile[]) => void;
  onStartDm?: (user: UserProfile) => void;
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
  onStartDm,
}: InstagramSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [serverUsers, setServerUsers] = useState<UserProfile[]>([]);
  const [serverGroups, setServerGroups] = useState<Group[]>([]);

  const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');

  // Live fetch from server directory across all devices (Users + Groups)
  React.useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const fetchDirectory = async () => {
      try {
        const userUrl = cleanQuery
          ? `/api/users?q=${encodeURIComponent(cleanQuery)}`
          : '/api/users';
        const groupUrl = cleanQuery
          ? `/api/groups?q=${encodeURIComponent(cleanQuery)}`
          : '/api/groups';

        const [userRes, groupRes] = await Promise.all([
          fetch(userUrl).catch(() => null),
          fetch(groupUrl).catch(() => null),
        ]);

        if (userRes && userRes.ok) {
          const data = await userRes.json();
          if (active && Array.isArray(data.users)) {
            setServerUsers(data.users);
            if (onSyncUsers) {
              onSyncUsers(data.users);
            }
          }
        }

        if (groupRes && groupRes.ok) {
          const gData = await groupRes.json();
          if (active && Array.isArray(gData.groups)) {
            setServerGroups(gData.groups);
          }
        }
      } catch (err) {
        // Fallback silently to client props
      }
    };

    fetchDirectory();
    const timer = setTimeout(fetchDirectory, 150);
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
    if (!cleanQuery) return allAvailableUsers;
    return searchUsersInstagramStyle(cleanQuery, allAvailableUsers);
  }, [cleanQuery, allAvailableUsers]);

  // Merge local groups and serverGroups (exclude virtual DM rooms)
  const allAvailableGroups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const g of groups) {
      if (g && g.id && !g.id.startsWith('dm_')) map.set(g.id, g);
    }
    for (const g of serverGroups) {
      if (g && g.id && !g.id.startsWith('dm_')) map.set(g.id, g);
    }
    return Array.from(map.values());
  }, [groups, serverGroups]);

  // Filter & Rank Channels / Groups
  const matchedGroups = useMemo(() => {
    if (!cleanQuery) return allAvailableGroups;
    return allAvailableGroups
      .filter((g) => {
        const matchName = (g.name || '').toLowerCase().includes(cleanQuery);
        const matchDesc = (g.description || '').toLowerCase().includes(cleanQuery);
        return matchName || matchDesc;
      })
      .sort((a, b) => {
        const aStarts = (a.name || '').toLowerCase().startsWith(cleanQuery);
        const bStarts = (b.name || '').toLowerCase().startsWith(cleanQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [cleanQuery, allAvailableGroups]);

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
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-msg-in">
      <div className="w-full max-w-2xl bg-[#111622] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header with Command Search Input */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#141926] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/15 border border-indigo-500/25 grid place-items-center text-indigo-400">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Quick Switcher & Directory</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[#8A94A6]">
                    ⌘K
                  </span>
                </h2>
                <p className="text-[11px] text-[#6C7689]">Jump to people, @handles, channels, or User IDs</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] grid place-items-center text-[#8A94A6] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#6C7689] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people by @username, name, ID, or channel..."
              className="w-full bg-[#0B0E14] border border-white/10 focus:border-indigo-500 rounded-xl pl-10 pr-16 py-2.5 text-sm text-white placeholder-[#5A6376] outline-none transition-colors"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-white absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#6C7689]">
                ESC to close
              </span>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/[0.04] text-[#8A94A6] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              All ({matchedUsers.length + matchedGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'accounts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/[0.04] text-[#8A94A6] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <User className="w-3 h-3" />
              <span>People ({matchedUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'channels'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/[0.04] text-[#8A94A6] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Hash className="w-3 h-3" />
              <span>Channels ({matchedGroups.length})</span>
            </button>
          </div>
        </div>

        {/* Search Results Body */}
        <div className="flex-1 overflow-y-auto scroll p-3 sm:p-5 space-y-5">
          {/* SECTION 1: USERS / ACCOUNTS */}
          {(activeTab === 'all' || activeTab === 'accounts') && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6C7689] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Registered Users</span>
                </span>
                <span className="text-[10px] text-[#6C7689]">
                  {matchedUsers.length} found
                </span>
              </div>

              {matchedUsers.length > 0 ? (
                <div className="space-y-1.5">
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
                        className="p-3 rounded-xl bg-[#0E121B] hover:bg-[#171D2B] border border-white/[0.06] hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                      >
                        {/* User Avatar + Identity Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#171D2B] border border-white/10">
                              <img
                                src={u.avatar || '/logo.png'}
                                alt={u.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/logo.png';
                                }}
                                className="w-full h-full object-cover rounded-full"
                              />
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0E121B]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Display Name */}
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                                {u.name}
                              </p>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-300 font-medium">
                                  You
                                </span>
                              )}
                            </div>

                            {/* Handle & ID Pill */}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-indigo-400 font-mono">
                                @{u.username}
                              </span>

                              {/* Clickable 1-Click Copy ID Pill */}
                              <button
                                type="button"
                                onClick={(e) => handleCopyId(e, userId)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[10px] text-[#8A94A6] font-mono transition-colors"
                                title="Click to copy User ID"
                              >
                                <span>{userId}</span>
                                {copiedId === userId ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-[#6C7689]" />
                                )}
                              </button>
                            </div>

                            {/* Bio */}
                            {u.bio && (
                              <p className="text-[11px] text-[#6C7689] truncate mt-0.5 max-w-sm">
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
                          {/* Share Profile Link */}
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                const link = `${window.location.origin}/?user=${encodeURIComponent(u.username)}`;
                                navigator.clipboard.writeText(link);
                                triggerToast(`Copied @${u.username}'s profile link`);
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[#A6B0C3] hover:text-white grid place-items-center transition-all"
                            title="Copy Profile Link"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct Message Button */}
                          {!isSelf && onStartDm && (
                            <button
                              type="button"
                              onClick={() => {
                                onStartDm(u);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                              title={`Direct Message @${u.username}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message</span>
                            </button>
                          )}

                          {/* Add to Active Group */}
                          {!isSelf && activeGroup && !activeGroup.id.startsWith('dm_') && (
                            <button
                              type="button"
                              onClick={() => {
                                onAddMemberToChannel(u);
                                triggerToast(`Added @${u.username} to #${activeGroup.name}`);
                              }}
                              disabled={isAlreadyMember}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                                isAlreadyMember
                                  ? 'bg-white/[0.04] text-[#6C7689] cursor-default'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300'
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
                              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-emerald-500/15 text-emerald-400 grid place-items-center transition-all"
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
                              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-indigo-500/15 text-indigo-400 grid place-items-center transition-all"
                              title={`Video Call ${u.name}`}
                            >
                              <Video className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-[#0E121B] rounded-xl border border-white/[0.06]">
                  <p className="text-xs text-[#6C7689]">
                    {cleanQuery ? `No users found matching "${query}"` : 'No accounts registered yet'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: CHANNELS / ROOMS */}
          {(activeTab === 'all' || activeTab === 'channels') && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6C7689] flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Channels</span>
                </span>
                <span className="text-[10px] text-[#6C7689]">
                  {matchedGroups.length} available
                </span>
              </div>

              {matchedGroups.length > 0 ? (
                <div className="space-y-1.5">
                  {matchedGroups.map((g) => {
                    const isMember = (g.members || []).some(
                      (m) => m === currentUserId || m === `@${currentUserId}`
                    );
                    const isCurrentActive = Boolean(activeGroup && g.id === activeGroup.id);

                    return (
                      <div
                        key={g.id}
                        className="p-3 rounded-xl bg-[#0E121B] hover:bg-[#171D2B] border border-white/[0.06] hover:border-indigo-500/30 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#171D2B] border border-white/10 shrink-0">
                            <img
                              src={g.avatar || '/logo.png'}
                              alt={g.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white flex items-center gap-1.5 truncate">
                              <span>#{g.name}</span>
                              {g.is_private && <span className="text-[10px] text-amber-400">Private</span>}
                            </p>
                            <p className="text-[11px] text-[#6C7689] truncate">
                              {(g.members || []).length} members • {g.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrentActive ? (
                            <span className="text-[11px] font-medium text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25">
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onJoinGroup(g.id);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1"
                            >
                              <span>{isMember ? 'Open' : 'Join'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-[#0E121B] rounded-xl border border-white/[0.06]">
                  <p className="text-xs text-[#6C7689]">
                    {cleanQuery ? `No channels found matching "${query}"` : 'No public channels created yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  UserX,
  Trash2,
  Crown,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
  Check,
  Search,
  UserCheck,
  Flame,
} from 'lucide-react';
import { Group, BannedUser } from '@/lib/supabase';
import { UserProfile } from '@/lib/users';

interface AdminModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Group;
  currentUser: {
    id: string;
    name: string;
    username: string;
    role?: 'admin' | 'user';
  };
  registeredUsers: UserProfile[];
  bannedUsers: BannedUser[];
  onKickMember: (usernameOrName: string) => void;
  onBanUser: (username: string, reason?: string) => void;
  onUnbanUser: (username: string) => void;
  onPromoteAdmin: (username: string) => void;
  onDemoteAdmin: (username: string) => void;
  onClearMessages: () => void;
  onToggleReadOnly: (enabled: boolean) => void;
  onToggleSlowMode: (enabled: boolean) => void;
  onDeleteChannel: () => void;
}

export default function AdminModerationModal({
  isOpen,
  onClose,
  channel,
  currentUser,
  registeredUsers,
  bannedUsers,
  onKickMember,
  onBanUser,
  onUnbanUser,
  onPromoteAdmin,
  onDemoteAdmin,
  onClearMessages,
  onToggleReadOnly,
  onToggleSlowMode,
  onDeleteChannel,
}: AdminModerationModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'banned' | 'chat' | 'danger'>('members');
  const [directBanUsername, setDirectBanUsername] = useState('');
  const [directBanReason, setDirectBanReason] = useState('Violating squad rules / inappropriate behavior');
  const [memberSearch, setMemberSearch] = useState('');
  const [confirmClearChat, setConfirmClearChat] = useState(false);
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState(false);

  if (!isOpen) return null;

  const currentMembers = channel.members || [];
  const channelAdmins = channel.admins || (channel.created_by ? [channel.created_by] : []);

  const filteredMembers = currentMembers.filter((m) =>
    m.toLowerCase().includes(memberSearch.toLowerCase().trim().replace(/^@/, ''))
  );

  const handleDirectBanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = directBanUsername.trim().replace(/^@/, '');
    if (!target) return;
    onBanUser(target, directBanReason);
    setDirectBanUsername('');
  };

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-xl bg-[#111522] border border-[#232B3E] rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#151B2E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-600 to-amber-500 grid place-items-center text-white shadow-lg shadow-rose-600/25">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Admin & Moderation Panel</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-1 border border-amber-500/30">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Admin
                </span>
              </div>
              <p className="text-xs text-[#7A8396]">
                Manage members, ban offenders, and moderate #{channel.name}
              </p>
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

        {/* Tab Selection */}
        <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-[#0E121E]">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'members'
                ? 'bg-[#6366F1] text-white shadow-md'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Members ({currentMembers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('banned')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'banned'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Banned ({bannedUsers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-[#8892B0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Chat Controls</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'danger'
                ? 'bg-red-800 text-white shadow-md'
                : 'text-[#8892B0] hover:text-rose-400 hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Danger</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto scroll flex-1 space-y-3">
          {/* TAB 1: MEMBERS & KICK / BAN ACTIONS */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#7A8396] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Filter channel members..."
                  className="w-full bg-[#151A28] border border-[#232B3E] focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
                />
              </div>

              <div className="space-y-2">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((mName) => {
                    const isCreator = channel.created_by?.toLowerCase() === mName.toLowerCase();
                    const isChannelAdmin = channelAdmins.some((a) => a.toLowerCase() === mName.toLowerCase());
                    const isMe =
                      currentUser.username.toLowerCase() === mName.toLowerCase() ||
                      currentUser.name.toLowerCase() === mName.toLowerCase();

                    const matchedUser = registeredUsers.find(
                      (u) =>
                        u.username.toLowerCase() === mName.toLowerCase() ||
                        u.name.toLowerCase() === mName.toLowerCase()
                    );

                    return (
                      <div
                        key={mName}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#151A28] border border-white/5 hover:border-white/10 transition-all gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1D2436] p-0.5 border border-white/10 shrink-0">
                            <img
                              src={matchedUser?.avatar || '/logo.png'}
                              alt={mName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">{matchedUser?.name || mName}</span>
                              <span className="text-[10px] text-indigo-400 font-mono">
                                @{matchedUser?.username || mName}
                              </span>
                              {isCreator && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                  👑 Owner
                                </span>
                              )}
                              {!isCreator && isChannelAdmin && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#7A8396]">
                              {isMe ? 'You' : isCreator ? 'Channel Founder' : 'Member'}
                            </p>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        {!isCreator && !isMe && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Promote / Demote Admin */}
                            <button
                              type="button"
                              onClick={() =>
                                isChannelAdmin ? onDemoteAdmin(mName) : onPromoteAdmin(mName)
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                                isChannelAdmin
                                  ? 'bg-white/5 hover:bg-white/10 text-[#7A8396] hover:text-white'
                                  : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white'
                              }`}
                              title={isChannelAdmin ? 'Remove admin status' : 'Make channel admin'}
                            >
                              {isChannelAdmin ? 'Demote' : 'Make Admin'}
                            </button>

                            {/* Kick Member */}
                            <button
                              type="button"
                              onClick={() => onKickMember(mName)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-white/5 hover:bg-amber-600/20 text-[#A8B2C7] hover:text-amber-400 border border-white/5 transition-all"
                              title="Remove from this channel"
                            >
                              Kick
                            </button>

                            {/* Ban Member */}
                            <button
                              type="button"
                              onClick={() =>
                                onBanUser(matchedUser?.username || mName, 'Banned by admin')
                              }
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all flex items-center gap-1"
                              title="Ban user from channel"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Ban</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#7A8396] text-center py-6">No members matching search</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BANNED USERS & DIRECT BAN */}
          {activeTab === 'banned' && (
            <div className="space-y-4">
              {/* Direct Ban Box */}
              <form onSubmit={handleDirectBanSubmit} className="p-3.5 bg-[#141A28] border border-rose-500/30 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <UserX className="w-4 h-4" />
                  <span>Ban User by @Username</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={directBanUsername}
                    onChange={(e) => setDirectBanUsername(e.target.value)}
                    placeholder="Enter @username to ban..."
                    className="bg-[#0E121E] border border-[#232B3E] focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={directBanReason}
                    onChange={(e) => setDirectBanReason(e.target.value)}
                    placeholder="Ban reason..."
                    className="bg-[#0E121E] border border-[#232B3E] focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!directBanUsername.trim()}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/30"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Ban User Immediately</span>
                </button>
              </form>

              {/* Banned Users List */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A8396]">
                  Active Ban List ({bannedUsers.length})
                </p>
                {bannedUsers.length > 0 ? (
                  bannedUsers.map((b) => (
                    <div
                      key={b.id || b.username}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#151A28] border border-rose-500/20"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-400 font-mono">@{b.username}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600/20 text-rose-300 font-semibold uppercase">
                            Banned
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A8B2C7] mt-0.5 truncate">
                          Reason: {b.reason || 'Rule violation'}
                        </p>
                        <p className="text-[9px] text-[#7A8396]">
                          Banned by {b.banned_by} • {new Date(b.banned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUnbanUser(b.username)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all flex items-center gap-1 shrink-0"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Unban</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-[#7A8396] bg-[#0E121E] rounded-2xl border border-white/5">
                    <UserCheck className="w-8 h-8 mx-auto mb-1.5 opacity-50 text-emerald-400" />
                    <p className="text-xs font-semibold text-white">No Banned Users</p>
                    <p className="text-[10px] mt-0.5">All channel members are in good standing</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHAT CONTROLS & MESSAGE PURGE */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Read Only Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141A28] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 grid place-items-center text-indigo-400 shrink-0">
                    {channel.is_read_only ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Admin Read-Only Mode</p>
                    <p className="text-[11px] text-[#7A8396]">Only Admins can send messages; members can only read</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleReadOnly(!channel.is_read_only)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    channel.is_read_only
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/10 hover:bg-white/15 text-[#A8B2C7]'
                  }`}
                >
                  {channel.is_read_only ? 'Locked' : 'Unlocked'}
                </button>
              </div>

              {/* Slow Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141A28] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 grid place-items-center text-amber-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Slow Mode (10s Cooldown)</p>
                    <p className="text-[11px] text-[#7A8396]">Limits members to 1 message every 10 seconds to prevent spam</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSlowMode(!channel.slow_mode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    channel.slow_mode
                      ? 'bg-amber-600 text-white'
                      : 'bg-white/10 hover:bg-white/15 text-[#A8B2C7]'
                  }`}
                >
                  {channel.slow_mode ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Purge / Clear Chat Messages */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <Trash2 className="w-4 h-4" />
                  <span>Purge Channel Messages</span>
                </div>
                <p className="text-[11px] text-[#A8B2C7] leading-relaxed">
                  Permanently deletes all messages and media in #{channel.name}. This action cannot be undone.
                </p>

                {confirmClearChat ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearMessages();
                        setConfirmClearChat(false);
                      }}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete All Messages</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearChat(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearChat(true)}
                    className="w-full bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Messages in #{channel.name}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DANGER ZONE & DELETE CHANNEL */}
          {activeTab === 'danger' && (
            <div className="p-4 rounded-2xl bg-red-950/25 border border-red-500/40 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Delete Channel</span>
              </div>
              <p className="text-[11px] text-[#A8B2C7] leading-relaxed">
                Permanently deletes channel <strong className="text-white">#{channel.name}</strong>, all its messages, and removes all members.
              </p>

              {confirmDeleteChannel ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteChannel();
                      onClose();
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Delete #{channel.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteChannel(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteChannel(true)}
                  className="w-full bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete #{channel.name}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

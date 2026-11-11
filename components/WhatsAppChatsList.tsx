'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  Plus,
  Hash,
  Lock,
  CheckCheck,
  Settings,
  X,
  MessageCircle,
  Bell,
  Mic,
  Image as ImageIcon,
  Film,
  Sticker,
} from 'lucide-react';
import { Group, Message } from '@/lib/supabase';
import { UserProfile } from '@/lib/users';
import { UserStory } from '@/types/story';
import StoriesRail from '@/components/StoriesRail';
import { DEFAULT_AVATAR_DATA_URL } from '@/lib/avatarStudio';

export interface ChatConversationItem {
  id: string; // group.id or `dm_user1_user2`
  type: 'dm' | 'group';
  name: string;
  avatar: string;
  username?: string;
  isOnline?: boolean;
  lastSeenText?: string;
  isPrivate?: boolean;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    sender_name: string;
    sender_username?: string;
    created_at: string;
    msg_type?: string;
  } | null;
  sortTime: number;
}

interface WhatsAppChatsListProps {
  currentUser: {
    id?: string;
    username?: string;
    name?: string;
    avatar?: string;
    status?: string;
  };
  activeGroupId: string;
  groups: Group[];
  messages: Message[];
  activeDmUsernames: string[];
  registeredUsers: UserProfile[];
  presenceMap: Record<string, { is_online: boolean; last_seen_text: string }>;
  stories: UserStory[];
  pendingDmRequestsCount?: number;
  canInstallPwa?: boolean;
  soundMuted?: boolean;
  notificationPermission?: NotificationPermission | 'unsupported';
  onSelectChat: (groupId: string) => void;
  onOpenNewChatModal: () => void;
  onOpenCreateStory: () => void;
  onViewStory: (story: UserStory) => void;
  onOpenInstagramSearch: () => void;
  onOpenStatusMenu: () => void;
  onOpenSettingsModal: () => void;
  onViewDmRequests?: () => void;
  onOpenInstallPwa?: () => void;
  onOpenThemeModal?: () => void;
  onToggleSoundOrNotification?: () => void;
}

export default function WhatsAppChatsList({
  currentUser,
  activeGroupId,
  groups,
  messages,
  activeDmUsernames,
  registeredUsers,
  presenceMap,
  stories,
  pendingDmRequestsCount = 0,
  canInstallPwa = false,
  soundMuted = false,
  notificationPermission = 'default',
  onSelectChat,
  onOpenNewChatModal,
  onOpenCreateStory,
  onViewStory,
  onOpenInstagramSearch,
  onOpenStatusMenu,
  onOpenSettingsModal,
  onViewDmRequests,
  onOpenInstallPwa,
  onOpenThemeModal,
  onToggleSoundOrNotification,
}: WhatsAppChatsListProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'dms' | 'groups' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const myHandle = (currentUser.username || currentUser.name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  // Pre-calculate latest messages indexed by group_id for O(1) lookups
  const latestMessageMap = useMemo(() => {
    const map = new Map<string, Message>();
    for (const msg of messages) {
      if (!msg || !msg.group_id) continue;
      const existing = map.get(msg.group_id);
      if (!existing || new Date(msg.created_at).getTime() > new Date(existing.created_at).getTime()) {
        map.set(msg.group_id, msg);
      }
    }
    return map;
  }, [messages]);

  // Aggregate all conversation items (DMs + Groups)
  const allConversations = useMemo(() => {
    const list: ChatConversationItem[] = [];

    // 1. Process Groups
    for (const g of groups) {
      if (!g || !g.id || g.id.startsWith('dm_')) continue;
      // Filter out gang wars if any slipped through
      if (g.name.toLowerCase().includes('gang war') || g.id.toLowerCase().includes('gang')) continue;

      const lastMsg = latestMessageMap.get(g.id);
      const sortTime = lastMsg
        ? new Date(lastMsg.created_at).getTime()
        : g.created_at
        ? new Date(g.created_at).getTime()
        : 0;

      list.push({
        id: g.id,
        type: 'group',
        name: g.name,
        avatar: g.avatar || '/logo.png',
        isPrivate: g.is_private,
        unreadCount: g.unreadCount || 0,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              sender_name: lastMsg.sender_name,
              sender_username: lastMsg.sender_username,
              created_at: lastMsg.created_at,
              msg_type: lastMsg.msg_type,
            }
          : null,
        sortTime,
      });
    }

    // 2. Process Direct Messages (DMs)
    // Gather all target handles from activeDmUsernames and any DM messages in state
    const dmHandlesSet = new Set<string>();
    for (const h of activeDmUsernames) {
      if (h && h.toLowerCase() !== myHandle) {
        dmHandlesSet.add(h.toLowerCase());
      }
    }

    for (const msg of messages) {
      if (msg.group_id && msg.group_id.startsWith('dm_')) {
        const parts = msg.group_id.replace(/^dm_/, '').split('_');
        const other = parts.find((p) => p.toLowerCase() !== myHandle);
        if (other) {
          dmHandlesSet.add(other.toLowerCase());
        }
      }
    }

    for (const targetHandle of Array.from(dmHandlesSet)) {
      const sorted = [myHandle, targetHandle].sort();
      const dmRoomId = `dm_${sorted[0]}_${sorted[1]}`;
      const lastMsg = latestMessageMap.get(dmRoomId);

      const profile = registeredUsers.find(
        (u) => u.username.toLowerCase() === targetHandle || u.name.toLowerCase() === targetHandle
      );

      const presence = presenceMap[targetHandle];
      const isOnline = Boolean(presence?.is_online);

      const sortTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 1;

      list.push({
        id: dmRoomId,
        type: 'dm',
        name: profile?.name || `@${targetHandle}`,
        avatar: profile?.avatar || DEFAULT_AVATAR_DATA_URL,
        username: targetHandle,
        isOnline,
        lastSeenText: presence?.last_seen_text || 'Offline',
        unreadCount: 0,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              sender_name: lastMsg.sender_name,
              sender_username: lastMsg.sender_username,
              created_at: lastMsg.created_at,
              msg_type: lastMsg.msg_type,
            }
          : null,
        sortTime,
      });
    }

    // Sort by most recent activity at the top
    return list.sort((a, b) => b.sortTime - a.sortTime);
  }, [groups, messages, activeDmUsernames, myHandle, latestMessageMap, registeredUsers, presenceMap]);

  // Filter conversations by tab and search query
  const filteredConversations = useMemo(() => {
    let result = allConversations;

    // Apply Filter Tab
    if (filterTab === 'dms') {
      result = result.filter((c) => c.type === 'dm');
    } else if (filterTab === 'groups') {
      result = result.filter((c) => c.type === 'group');
    } else if (filterTab === 'unread') {
      result = result.filter((c) => c.unreadCount && c.unreadCount > 0);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace(/^@/, '');
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.username && c.username.toLowerCase().includes(q)) ||
          (c.lastMessage && c.lastMessage.content.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allConversations, filterTab, searchQuery]);

  // WhatsApp / Telegram time formatting helper
  const formatChatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

      if (isYesterday) return 'Yesterday';

      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Preview message snippet renderer
  const renderMessageSnippet = (item: ChatConversationItem) => {
    if (!item.lastMessage) {
      return (
        <span className="text-[#6C7689] text-xs">
          {item.type === 'dm' ? 'Start a conversation' : 'No messages yet'}
        </span>
      );
    }

    const { content, msg_type, sender_username, sender_name } = item.lastMessage;
    const isSentByMe =
      (sender_username && sender_username.toLowerCase() === myHandle) ||
      (sender_name && sender_name.toLowerCase() === (currentUser.name || '').toLowerCase());

    let mediaTag: { icon: React.ReactNode; label: string } | null = null;
    let snippet = content;

    if (msg_type === 'audio') {
      mediaTag = { icon: <Mic className="w-3 h-3" />, label: 'Voice message' };
      snippet = '';
    } else if (msg_type === 'image') {
      mediaTag = { icon: <ImageIcon className="w-3 h-3" />, label: 'Photo' };
    } else if (msg_type === 'sticker') {
      mediaTag = { icon: <Sticker className="w-3 h-3" />, label: 'Sticker' };
    } else if (msg_type === 'gif') {
      mediaTag = { icon: <Film className="w-3 h-3" />, label: 'GIF' };
    }

    return (
      <div className="flex items-center gap-1.5 text-xs text-[#8A94A6] truncate">
        {isSentByMe && (
          <CheckCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        )}
        {mediaTag ? (
          <span className="text-indigo-300 font-medium inline-flex items-center gap-1 shrink-0">
            {mediaTag.icon}
            <span>{mediaTag.label}</span>
          </span>
        ) : null}
        <span className="truncate">{snippet}</span>
      </div>
    );
  };

  const dmsCount = allConversations.filter((c) => c.type === 'dm').length;
  const groupsCount = allConversations.filter((c) => c.type === 'group').length;

  return (
    <div className="h-full w-full flex flex-col bg-[#0B0E14] border-r border-white/[0.07] select-none relative">
      {/* 1. App Bar Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.07] bg-[#0F131C] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* User Avatar with Status Menu Trigger */}
          <button
            type="button"
            onClick={onOpenStatusMenu}
            className="relative group focus:outline-none shrink-0"
            title="Account & Status"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#171D2B] border border-white/10 group-hover:border-indigo-500 transition-colors">
              <img
                src={currentUser.avatar || DEFAULT_AVATAR_DATA_URL}
                alt=""
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_AVATAR_DATA_URL;
                }}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0F131C] ${
                currentUser.status === 'idle'
                  ? 'bg-amber-500'
                  : currentUser.status === 'dnd'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
            />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="truncate">{currentUser.name || 'Messages'}</span>
              <span className="text-[10px] bg-white/[0.07] text-[#A6B0C3] font-medium px-1.5 py-0.5 rounded-md">
                {allConversations.length}
              </span>
            </h2>
            <p className="text-[11px] text-[#6C7689] font-mono truncate">
              @{currentUser.username || 'user'}
            </p>
          </div>
        </div>

        {/* Sleek Action Buttons: Compose New Chat & Settings */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenNewChatModal}
            className="w-8 h-8 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 grid place-items-center active:scale-95 transition-all"
            title="New Chat or Channel"
          >
            <Plus className="w-4 h-4 stroke-[2.25]" />
          </button>

          <button
            type="button"
            onClick={onOpenSettingsModal}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#A6B0C3] hover:text-white grid place-items-center active:scale-95 transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Stories / Status Rail */}
      <StoriesRail
        currentUser={currentUser}
        stories={stories}
        onCreateStory={onOpenCreateStory}
        onViewStory={onViewStory}
      />

      {/* 3. Search & Filter Section */}
      <div className="p-3 space-y-2.5 border-b border-white/[0.07] bg-[#0B0E14]">
        {/* Search Input with Quick Switcher Trigger */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#6C7689] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter chats or search..."
            className="w-full bg-[#111622] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl pl-9 pr-16 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-[#7A8396] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenInstagramSearch}
              className="absolute right-2 px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[10px] font-mono text-[#8A94A6] hover:text-white transition-colors"
              title="Global Directory & Quick Switcher (Ctrl+K)"
            >
              ⌘K
            </button>
          )}
        </div>

        {/* Clean Unified Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
              filterTab === 'all'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/[0.04] text-[#8A94A6] hover:text-white hover:bg-white/[0.08] border border-transparent'
            }`}
          >
            All ({allConversations.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('dms')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              filterTab === 'dms'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/[0.04] text-[#8A94A6] hover:text-white hover:bg-white/[0.08] border border-transparent'
            }`}
          >
            <MessageCircle className="w-3 h-3" />
            <span>DMs ({dmsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('groups')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
              filterTab === 'groups'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/[0.04] text-[#8A94A6] hover:text-white hover:bg-white/[0.08] border border-transparent'
            }`}
          >
            <Hash className="w-3 h-3" />
            <span>Channels ({groupsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('unread')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
              filterTab === 'unread'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/[0.04] text-[#8A94A6] hover:text-white hover:bg-white/[0.08] border border-transparent'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* 4. Pending Message Requests Notification */}
      {pendingDmRequestsCount > 0 && (
        <div
          onClick={onViewDmRequests}
          className="mx-3 mt-2.5 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between cursor-pointer hover:bg-indigo-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-white">
              {pendingDmRequestsCount} Message Request{pendingDmRequestsCount > 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-[11px] text-indigo-300 font-medium bg-indigo-500/20 px-2 py-0.5 rounded-md">
            Review
          </span>
        </div>
      )}

      {/* 5. Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#6C7689] grid place-items-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">No conversations found</p>
              <p className="text-[11px] text-[#6C7689] mt-0.5 max-w-[200px]">
                {searchQuery ? `No results for "${searchQuery}"` : 'Start a direct message or join a channel.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewChatModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm active:scale-95 transition-all mt-1 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start New Chat</span>
            </button>
          </div>
        ) : (
          filteredConversations.map((chat) => {
            const isActive = chat.id === activeGroupId;

            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 transition-colors text-left relative focus:outline-none ${
                  isActive
                    ? 'bg-indigo-500/[0.09] border-l-2 border-indigo-500'
                    : 'hover:bg-white/[0.03] border-l-2 border-transparent'
                }`}
              >
                {/* Avatar with Clean Online Dot */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-[#171D2B] border border-white/10">
                    <img
                      src={chat.avatar || '/logo.png'}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_AVATAR_DATA_URL;
                      }}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  {chat.type === 'dm' ? (
                    chat.isOnline ? (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B0E14]" />
                    ) : (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-[#0B0E14]" />
                    )
                  ) : chat.isPrivate ? (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#0B0E14] p-0.5 rounded-full text-amber-400 border border-white/10">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#0B0E14] p-0.5 rounded-full text-indigo-400 border border-white/10">
                      <Hash className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Content: Title, Last Message snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-[13px] font-semibold truncate ${
                        isActive ? 'text-white' : 'text-[#EEF1F7]'
                      }`}
                    >
                      {chat.name}
                    </p>
                    <span className="text-[10px] text-[#6C7689] shrink-0 font-medium">
                      {formatChatTime(chat.lastMessage?.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">{renderMessageSnippet(chat)}</div>

                    {/* Unread Counter Badge */}
                    {chat.unreadCount && chat.unreadCount > 0 ? (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}


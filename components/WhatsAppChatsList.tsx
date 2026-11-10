'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  Plus,
  Hash,
  Lock,
  Camera,
  CheckCheck,
  Check,
  Compass,
  Users,
  Settings,
  X,
  MessageCircle,
  Bell,
  BellOff,
  Sparkles,
  Palette,
  Download,
} from 'lucide-react';
import { Group, Message } from '@/lib/supabase';
import { UserProfile } from '@/lib/users';
import { UserStory } from '@/types/story';
import StoriesRail from '@/components/StoriesRail';

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
        avatar:
          profile?.avatar ||
          `https://api.dicebear.com/7.x/notionists/svg?seed=${targetHandle}&backgroundColor=b6e3f4,d1d4f9`,
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
        <span className="text-[#5A6376] italic text-xs">
          {item.type === 'dm' ? 'Tap to start conversation' : 'No messages yet'}
        </span>
      );
    }

    const { content, msg_type, sender_username, sender_name } = item.lastMessage;
    const isSentByMe =
      (sender_username && sender_username.toLowerCase() === myHandle) ||
      (sender_name && sender_name.toLowerCase() === (currentUser.name || '').toLowerCase());

    let iconPrefix = null;
    let snippet = content;

    if (msg_type === 'audio') {
      iconPrefix = '🎙️ Voice note';
      snippet = '';
    } else if (msg_type === 'image') {
      iconPrefix = '📷 Photo';
    } else if (msg_type === 'sticker') {
      iconPrefix = '🏷️ Sticker';
    } else if (msg_type === 'gif') {
      iconPrefix = '👾 GIF';
    }

    return (
      <div className="flex items-center gap-1 text-xs text-[#8A94A6] truncate">
        {isSentByMe && (
          <CheckCheck className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
        )}
        {iconPrefix ? (
          <span className="text-indigo-400 font-medium shrink-0">{iconPrefix}</span>
        ) : null}
        <span className="truncate">{snippet}</span>
      </div>
    );
  };

  const dmsCount = allConversations.filter((c) => c.type === 'dm').length;
  const groupsCount = allConversations.filter((c) => c.type === 'group').length;

  return (
    <div className="h-full w-full flex flex-col bg-[#0A0D14] border-r border-[#1B212E] select-none relative">
      {/* 1. App Bar Header (WhatsApp / Telegram style) */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1A202E] bg-[#0E121B] shrink-0">
        <div className="flex items-center gap-3">
          {/* User Avatar with Status Menu Trigger */}
          <button
            type="button"
            onClick={onOpenStatusMenu}
            className="relative group focus:outline-none"
            title="Account & Status Menu"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#161C28] border-2 border-white/10 group-hover:border-indigo-500 transition-colors">
              <img
                src={currentUser.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=user'}
                alt={currentUser.name || 'User'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.png';
                }}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0E121B] ${
                currentUser.status === 'idle'
                  ? 'bg-amber-500'
                  : currentUser.status === 'dnd'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
            />
          </button>

          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>Chats</span>
              <span className="text-[10px] bg-white/10 text-slate-300 font-mono px-1.5 py-0.2 rounded-full">
                {allConversations.length}
              </span>
            </h2>
            <p className="text-[10px] text-[#7A8396] font-mono">
              @{currentUser.username || 'user'} • ID: {currentUser.id || `usr_${currentUser.username}`}
            </p>
          </div>
        </div>

        {/* Action Buttons: PWA Install, Theme, Notification Bell, Status, Search, New Chat */}
        <div className="flex items-center gap-1">
          {/* PWA Install Button */}
          {canInstallPwa && onOpenInstallPwa && (
            <button
              type="button"
              onClick={onOpenInstallPwa}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              title="Install LMC Chats App (PWA)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Chat Theme & Wallpaper Button */}
          {onOpenThemeModal && (
            <button
              type="button"
              onClick={onOpenThemeModal}
              className="w-8 h-8 rounded-xl grid place-items-center text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 active:scale-95 transition-all"
              title="Chat Wallpapers & Bubble Colors"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}

          {/* Sound & Push Notification Bell */}
          {onToggleSoundOrNotification && (
            <button
              type="button"
              onClick={onToggleSoundOrNotification}
              className={`w-8 h-8 rounded-xl grid place-items-center relative active:scale-95 transition-all ${
                soundMuted
                  ? 'text-[#7A8396] hover:text-white hover:bg-white/5'
                  : notificationPermission === 'granted'
                  ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
              title={
                soundMuted
                  ? 'Sound alerts muted (Click to unmute)'
                  : notificationPermission === 'granted'
                  ? 'Push & Sound alerts active (Click to toggle)'
                  : 'Enable Push Notifications & Sound'
              }
            >
              {soundMuted ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {notificationPermission !== 'granted' && !soundMuted && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateStory}
            className="w-8 h-8 rounded-xl grid place-items-center text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 active:scale-95 transition-all"
            title="Post Status / Story"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenInstagramSearch}
            className="w-8 h-8 rounded-xl grid place-items-center text-[#7A8396] hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            title="Search Users & Channels"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenNewChatModal}
            className="w-8 h-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 grid place-items-center active:scale-95 transition-all shadow-sm"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. WhatsApp Stories / Status Rail */}
      <StoriesRail
        currentUser={currentUser}
        stories={stories}
        onCreateStory={onOpenCreateStory}
        onViewStory={onViewStory}
      />

      {/* 3. Search & Filter Section */}
      <div className="p-3 space-y-2 border-b border-[#1A202E] bg-[#0A0D14]">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#5A6376] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat..."
            className="w-full bg-[#121622] border border-[#202738] focus:border-emerald-500/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#5A6376] outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8396] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* WhatsApp-Style Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
              filterTab === 'all'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-white/5 text-[#7A8396] hover:text-white hover:bg-white/10'
            }`}
          >
            All ({allConversations.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('dms')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
              filterTab === 'dms'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                : 'bg-white/5 text-[#7A8396] hover:text-white hover:bg-white/10'
            }`}
          >
            <MessageCircle className="w-3 h-3" />
            <span>DMs ({dmsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('groups')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
              filterTab === 'groups'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'bg-white/5 text-[#7A8396] hover:text-white hover:bg-white/10'
            }`}
          >
            <Hash className="w-3 h-3" />
            <span>Groups ({groupsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('unread')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
              filterTab === 'unread'
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-sm'
                : 'bg-white/5 text-[#7A8396] hover:text-white hover:bg-white/10'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* 4. Instagram / WhatsApp Pending DM Requests Notification Banner */}
      {pendingDmRequestsCount > 0 && (
        <div
          onClick={onViewDmRequests}
          className="mx-3 my-2 p-2.5 rounded-xl bg-gradient-to-r from-indigo-900/40 to-pink-900/30 border border-indigo-500/30 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity animate-pulse"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">
              {pendingDmRequestsCount} Message Request{pendingDmRequestsCount > 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-[10px] text-indigo-300 font-semibold bg-white/10 px-2 py-0.5 rounded-full">
            Review
          </span>
        </div>
      )}

      {/* 5. Scrollable Conversation Cards List (WhatsApp / Telegram style) */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 text-[#7A8396] grid place-items-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">No chats found</p>
              <p className="text-[11px] text-[#5A6376] mt-0.5 max-w-[200px]">
                {searchQuery ? `No results for "${searchQuery}"` : 'Start a new conversation with anyone.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewChatModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md active:scale-95 transition-all mt-1 flex items-center gap-1.5"
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
                    ? 'bg-[#151B2A] border-l-4 border-emerald-500 shadow-sm'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Avatar with Online Presence Dot */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#161C28] border border-white/10 shadow-sm">
                    <img
                      src={chat.avatar || '/logo.png'}
                      alt={chat.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/logo.png';
                      }}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  {chat.type === 'dm' ? (
                    chat.isOnline ? (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0A0D14] animate-pulse" />
                    ) : (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-[#0A0D14]" />
                    )
                  ) : chat.isPrivate ? (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#0A0D14] p-0.5 rounded-full text-amber-400">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#0A0D14] p-0.5 rounded-full text-indigo-400">
                      <Hash className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Content: Title, Last Message snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-[13px] font-semibold truncate ${
                        isActive ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {chat.name}
                    </p>
                    <span className="text-[10px] text-[#5A6376] shrink-0 font-medium">
                      {formatChatTime(chat.lastMessage?.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">{renderMessageSnippet(chat)}</div>

                    {/* Unread Counter Badge */}
                    {chat.unreadCount && chat.unreadCount > 0 ? (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
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

      {/* 6. WhatsApp-Style Floating Action Button (FAB) for Instant New Chat */}
      <button
        type="button"
        onClick={onOpenNewChatModal}
        className="absolute bottom-5 right-5 z-20 w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#0A0D14] font-bold shadow-xl shadow-emerald-500/30 grid place-items-center transition-all group"
        title="Start New Chat (WhatsApp Style)"
      >
        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Phone,
  Video,
  Info,
  ChevronDown,
  PanelLeft,
  Menu,
  X,
  Smile,
  Layers,
  Send,
  Check,
  CheckCheck,
  Pin,
  BellOff,
  Image as ImageIcon,
  Link as LinkIcon,
  SmilePlus,
  ExternalLink,
  Upload,
  User,
  ShieldAlert,
  Lock,
  Globe,
  UserPlus,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Clock,
} from 'lucide-react';
import { supabase, isSupabaseConfigured, Group, Message } from '@/lib/supabase';
import { STICKERS, AVATAR_OPTIONS, FALLBACK_GIFS, EMOJI_CATEGORIES } from '@/lib/data';

interface CurrentUser {
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd';
}

const DEFAULT_GROUPS: Group[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'LMC Main Lounge',
    description: 'Public squad hangout for general discussions, memes, music and announcements.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LMC',
    created_by: 'Kai Renner',
    is_private: false,
    members: ['Kai Renner', 'Ana Vidal', 'Marcus Webb'],
    join_requests: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'LMC Core Devs 🔒',
    description: 'Confidential project planning, architecture reviews and private release secrets.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Devs',
    created_by: 'Kai Renner',
    is_private: true,
    members: ['Kai Renner', 'Ana Vidal'],
    join_requests: [],
    created_at: new Date(Date.now() - 43200000).toISOString(),
    unreadCount: 2,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Gaming & Chill 🎮',
    description: 'Open squad for Valorant, Steam tournaments and late-night gaming sessions.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gaming',
    created_by: 'Marcus Webb',
    is_private: false,
    members: ['Marcus Webb', 'Ana Vidal'],
    join_requests: [],
    created_at: new Date(Date.now() - 21600000).toISOString(),
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'init-1',
    group_id: '11111111-1111-1111-1111-111111111111',
    sender_name: 'Ana Vidal',
    sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    content: 'Welcome to **LMC Chats**! We now support both Public open squads and Private confidential channels 🚀',
    msg_type: 'text',
    reactions: { '🔥': 4, '👀': 2 },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'init-2',
    group_id: '11111111-1111-1111-1111-111111111111',
    sender_name: 'Marcus Webb',
    sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    content: 'Private groups are strictly invisible unless the creator invites you. Super safe!',
    msg_type: 'text',
    reactions: { '💯': 5 },
    created_at: new Date(Date.now() - 2800000).toISOString(),
  },
  {
    id: 'init-3',
    group_id: '22222222-2222-2222-2222-222222222222',
    sender_name: 'Kai Renner',
    sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai',
    content: 'Welcome to LMC Core Devs 🔒. This is a private room visible only to invited members.',
    msg_type: 'text',
    reactions: { '🚀': 3 },
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

export default function Home() {
  // Current user state
  const [user, setUser] = useState<CurrentUser>({
    name: 'Kai Renner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai',
    status: 'online',
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // App Layout
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Groups and Messages
  const [groups, setGroups] = useState<Group[]>(DEFAULT_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string>(DEFAULT_GROUPS[0].id);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [newGroupInviteMember, setNewGroupInviteMember] = useState('');

  // Admin add member input in channel info
  const [adminAddMemberInput, setAdminAddMemberInput] = useState('');

  // Emoji, Sticker & GIF
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState(0);
  const [showTray, setShowTray] = useState(false);
  const [trayTab, setTrayTab] = useState<'gifs' | 'stickers'>('gifs');
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState(FALLBACK_GIFS);
  const [customStickerUrl, setCustomStickerUrl] = useState('');
  const [reactionPopForMsg, setReactionPopForMsg] = useState<string | null>(null);
  const [reactionPopCoords, setReactionPopCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [infoMediaTab, setInfoMediaTab] = useState<'media' | 'links'>('media');

  const streamEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Load User from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lmc_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      } else {
        setShowProfileModal(true);
      }
    }
  }, []);

  const saveUser = (updated: CurrentUser) => {
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lmc_user', JSON.stringify(updated));
    }
  };

  // Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel('lmc_chat_sync');
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'NEW_MESSAGE') {
        setMessages((prev) => [...prev, payload]);
      } else if (type === 'REACTION_UPDATE') {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.id ? { ...m, reactions: payload.reactions } : m))
        );
      } else if (type === 'NEW_GROUP') {
        setGroups((prev) => [payload, ...prev]);
      } else if (type === 'UPDATE_GROUP') {
        setGroups((prev) =>
          prev.map((g) => (g.id === payload.id ? { ...g, ...payload } : g))
        );
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  // Supabase Initial Load
  useEffect(() => {
    async function loadSupabaseData() {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data: remoteGroups, error: gError } = await supabase
          .from('groups')
          .select('*')
          .order('created_at', { ascending: false });

        if (!gError && remoteGroups && remoteGroups.length > 0) {
          setGroups(remoteGroups);
        }

        const { data: remoteMessages, error: mError } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (!mError && remoteMessages && remoteMessages.length > 0) {
          setMessages(remoteMessages);
        }
      } catch (err) {
        console.warn('Supabase fetch notice, using active fallback:', err);
      }
    }

    loadSupabaseData();
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('public:lmc_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'groups' },
        (payload) => {
          const newGroup = payload.new as Group;
          setGroups((prev) => {
            if (prev.some((g) => g.id === newGroup.id)) return prev;
            return [newGroup, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'groups' },
        (payload) => {
          const updatedGroup = payload.new as Group;
          setGroups((prev) =>
            prev.map((g) => (g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g))
          );
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeGroupId]);

  // Active Group Resolution
  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0];
  }, [groups, activeGroupId]);

  // Group Visibility Rules:
  // - Public groups: visible to everyone.
  // - Private groups: visible ONLY if user is creator OR user is in members array.
  const visibleGroups = useMemo(() => {
    return groups.filter((g) => {
      if (!g.is_private) return true;
      const isCreator = g.created_by?.toLowerCase() === user.name.toLowerCase();
      const isMember = (g.members || []).some((m) => m.toLowerCase() === user.name.toLowerCase());
      return isCreator || isMember;
    });
  }, [groups, user.name]);

  // Is current user a member or admin of active group?
  const isMemberOfActiveGroup = useMemo(() => {
    if (!activeGroup) return false;
    const isCreator = activeGroup.created_by?.toLowerCase() === user.name.toLowerCase();
    const isMember = (activeGroup.members || []).some((m) => m.toLowerCase() === user.name.toLowerCase());
    return isCreator || isMember;
  }, [activeGroup, user.name]);

  const isAdminOfActiveGroup = useMemo(() => {
    if (!activeGroup) return false;
    return activeGroup.created_by?.toLowerCase() === user.name.toLowerCase();
  }, [activeGroup, user.name]);

  const hasPendingJoinRequest = useMemo(() => {
    if (!activeGroup || !activeGroup.join_requests) return false;
    return activeGroup.join_requests.some((r) => r.toLowerCase() === user.name.toLowerCase());
  }, [activeGroup, user.name]);

  // Messages Filtered by active group and search
  const displayedMessages = useMemo(() => {
    return messages
      .filter((m) => m.group_id === activeGroupId)
      .filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.content.toLowerCase().includes(q) ||
          m.sender_name.toLowerCase().includes(q) ||
          m.msg_type.toLowerCase().includes(q)
        );
      });
  }, [messages, activeGroupId, searchQuery]);

  // Shared media in active group
  const sharedMedia = useMemo(() => {
    return messages
      .filter((m) => m.group_id === activeGroupId)
      .filter((m) => m.media_url && m.media_url.trim().length > 0);
  }, [messages, activeGroupId]);

  // Shared links in active group
  const sharedLinks = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links: { url: string; sender: string; time: string }[] = [];
    messages
      .filter((m) => m.group_id === activeGroupId)
      .forEach((m) => {
        const matches = m.content.match(urlRegex);
        if (matches) {
          matches.forEach((url) => {
            links.push({
              url,
              sender: m.sender_name,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          });
        }
      });
    return links;
  }, [messages, activeGroupId]);

  // Send message
  const handleSendMessage = async (
    content: string,
    msg_type: 'text' | 'sticker' | 'gif' | 'image' = 'text',
    media_url: string = ''
  ) => {
    if (!isMemberOfActiveGroup) {
      triggerToast('You must join this squad to send messages!');
      return;
    }
    if (msg_type === 'text' && !content.trim()) return;

    const newMsg: Message = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      group_id: activeGroupId,
      sender_name: user.name,
      sender_avatar: user.avatar,
      content,
      msg_type,
      media_url,
      reactions: {},
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('lmc_chat_sync');
      channel.postMessage({ type: 'NEW_MESSAGE', payload: newMsg });
      channel.close();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('messages').insert([newMsg]);
      } catch (err) {
        console.error('Supabase message error:', err);
      }
    }
  };

  // Toggle Reaction
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    const target = messages.find((m) => m.id === msgId);
    if (!target) return;

    const currentCount = target.reactions[emoji] || 0;
    const newReactions = { ...target.reactions };
    if (currentCount > 0) {
      newReactions[emoji] = currentCount + 1;
    } else {
      newReactions[emoji] = 1;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, reactions: newReactions } : m))
    );
    setReactionPopForMsg(null);

    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('lmc_chat_sync');
      channel.postMessage({
        type: 'REACTION_UPDATE',
        payload: { id: msgId, reactions: newReactions },
      });
      channel.close();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('messages').update({ reactions: newReactions }).eq('id', msgId);
      } catch (err) {
        console.error('Supabase reaction error:', err);
      }
    }
  };

  // Create Group (Public or Private)
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const initialMembers = [user.name];
    if (newGroupInviteMember.trim()) {
      newGroupInviteMember
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
        .forEach((m) => {
          if (!initialMembers.includes(m)) initialMembers.push(m);
        });
    }

    const newGroup: Group = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `group-${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || (newGroupIsPrivate ? 'Private confidential squad.' : 'Public community squad.'),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newGroupName)}`,
      created_by: user.name,
      is_private: newGroupIsPrivate,
      members: initialMembers,
      join_requests: [],
      created_at: new Date().toISOString(),
      unreadCount: 0,
    };

    setGroups((prev) => [newGroup, ...prev]);
    setActiveGroupId(newGroup.id);
    setShowNewGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupIsPrivate(false);
    setNewGroupInviteMember('');
    triggerToast(newGroup.is_private ? `Private Group "${newGroup.name}" created! 🔒` : `Public Group "${newGroup.name}" created! 🌐`);

    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('lmc_chat_sync');
      channel.postMessage({ type: 'NEW_GROUP', payload: newGroup });
      channel.close();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('groups').insert([newGroup]);
      } catch (err) {
        console.error('Supabase group error:', err);
      }
    }
  };

  // Join Request for Public Group
  const handleRequestToJoin = async () => {
    if (!activeGroup || activeGroup.is_private) return;
    if (hasPendingJoinRequest) return;

    const updatedRequests = [...(activeGroup.join_requests || []), user.name];
    const updatedGroup = { ...activeGroup, join_requests: updatedRequests };

    setGroups((prev) =>
      prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g))
    );
    triggerToast(`Join request sent to ${activeGroup.created_by}! ⏳`);

    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('lmc_chat_sync');
      channel.postMessage({ type: 'UPDATE_GROUP', payload: updatedGroup });
      channel.close();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('groups')
          .update({ join_requests: updatedRequests })
          .eq('id', activeGroup.id);
      } catch (err) {
        console.error('Join request error:', err);
      }
    }
  };

  // Admin accepts join request
  const handleAcceptRequest = async (requestUserName: string) => {
    if (!activeGroup || !isAdminOfActiveGroup) return;

    const updatedRequests = (activeGroup.join_requests || []).filter(
      (r) => r.toLowerCase() !== requestUserName.toLowerCase()
    );
    const updatedMembers = [...(activeGroup.members || [])];
    if (!updatedMembers.some((m) => m.toLowerCase() === requestUserName.toLowerCase())) {
      updatedMembers.push(requestUserName);
    }

    const updatedGroup = {
      ...activeGroup,
      members: updatedMembers,
      join_requests: updatedRequests,
    };

    setGroups((prev) =>
      prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g))
    );
    triggerToast(`${requestUserName} added to the squad! 🎉`);

    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('lmc_chat_sync');
      channel.postMessage({ type: 'UPDATE_GROUP', payload: updatedGroup });
      channel.close();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('groups')
          .update({ members: updatedMembers, join_requests: updatedRequests })
          .eq('id', activeGroup.id);
      } catch (err) {
        console.error('Accept request error:', err);
      }
    }
  };

  // Admin declines join request
  const handleDeclineRequest = async (requestUserName: string) => {
    if (!activeGroup || !isAdminOfActiveGroup) return;

    const updatedRequests = (activeGroup.join_requests || []).filter(
      (r) => r.toLowerCase() !== requestUserName.toLowerCase()
    );

    const updatedGroup = { ...activeGroup, join_requests: updatedRequests };

    setGroups((prev) =>
      prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g))
    );
    triggerToast(`Declined request from ${requestUserName}`);

    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('lmc_chat_sync');
      channel.postMessage({ type: 'UPDATE_GROUP', payload: updatedGroup });
      channel.close();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('groups')
          .update({ join_requests: updatedRequests })
          .eq('id', activeGroup.id);
      } catch (err) {
        console.error('Decline request error:', err);
      }
    }
  };

  // Admin directly adds a member
  const handleAdminAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAddMemberInput.trim() || !activeGroup || !isAdminOfActiveGroup) return;

    const memberName = adminAddMemberInput.trim();
    const updatedMembers = [...(activeGroup.members || [])];
    if (!updatedMembers.some((m) => m.toLowerCase() === memberName.toLowerCase())) {
      updatedMembers.push(memberName);
    }

    const updatedGroup = { ...activeGroup, members: updatedMembers };

    setGroups((prev) =>
      prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g))
    );
    setAdminAddMemberInput('');
    triggerToast(`Added ${memberName} to ${activeGroup.name}!`);

    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('lmc_chat_sync');
      channel.postMessage({ type: 'UPDATE_GROUP', payload: updatedGroup });
      channel.close();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('groups')
          .update({ members: updatedMembers })
          .eq('id', activeGroup.id);
      } catch (err) {
        console.error('Admin add member error:', err);
      }
    }
  };

  // GIF Search Debounce
  useEffect(() => {
    if (!gifSearch.trim()) {
      setGifResults(FALLBACK_GIFS);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(
            gifSearch
          )}&limit=12&rating=g`
        );
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setGifResults(
            json.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              url: item.images.fixed_height.url || item.images.original.url,
            }))
          );
        } else {
          setGifResults(FALLBACK_GIFS);
        }
      } catch {
        setGifResults(FALLBACK_GIFS);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [gifSearch]);

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-[#0B0E14] text-[#E9ECF4] relative font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-[#1A1F2A]/95 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm animate-msg-in">
          <Sparkles className="w-4 h-4 text-[#818CF8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Setup / Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#151922] border border-[#1F2430] rounded-2xl p-6 shadow-2xl animate-msg-in">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
              <User className="w-5 h-5 text-[#818CF8]" /> Welcome to LMC Chats
            </h2>
            <p className="text-xs text-[#77808F] mb-4">Set your squad identity to start chatting.</p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-[#AEB6C8] block mb-2">Select Avatar</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => saveUser({ ...user, avatar: av })}
                    className={`p-1 rounded-xl border transition-all ${
                      user.avatar === av ? 'border-[#6366F1] bg-[#6366F1]/20 scale-105' : 'border-[#1F2430] hover:border-white/20'
                    }`}
                  >
                    <img src={av} alt="Avatar" className="w-full aspect-square rounded-lg object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="text-xs font-semibold text-[#AEB6C8] block mb-1">Your Display Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => saveUser({ ...user, name: e.target.value })}
                placeholder="e.g. Kai or Alex"
                className="w-full bg-[#11151E] border border-[#1F2430] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#6366F1]"
              />
            </div>
            <button
              onClick={() => {
                if (!user.name.trim()) return;
                saveUser(user);
                setShowProfileModal(false);
                triggerToast(`Identity set as ${user.name}`);
              }}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#4338CA] hover:brightness-110 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg"
            >
              Enter LMC Chats
            </button>
          </div>
        </div>
      )}

      {/* New Group Modal (Public vs Private) */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form onSubmit={handleCreateGroup} className="w-full max-w-sm bg-[#151922] border border-[#1F2430] rounded-2xl p-6 shadow-2xl animate-msg-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#818CF8]" /> Create Squad Group
              </h2>
              <button type="button" onClick={() => setShowNewGroupModal(false)} className="text-[#77808F] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Public vs Private Selector */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-[#11151E] p-1.5 rounded-xl border border-[#1F2430]">
              <button
                type="button"
                onClick={() => setNewGroupIsPrivate(false)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  !newGroupIsPrivate ? 'bg-[#6366F1] text-white shadow' : 'text-[#77808F] hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Public
              </button>
              <button
                type="button"
                onClick={() => setNewGroupIsPrivate(true)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  newGroupIsPrivate ? 'bg-[#6366F1] text-white shadow' : 'text-[#77808F] hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Private 🔒
              </button>
            </div>
            <p className="text-[11px] text-[#77808F] mb-3">
              {newGroupIsPrivate
                ? '🔒 Private: Completely hidden. Only invited members can see & chat.'
                : '🌐 Public: Visible to everyone. Users can request to join.'}
            </p>

            <div className="mb-3">
              <label className="text-xs font-semibold text-[#AEB6C8] block mb-1">Group Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Night Owls 🦉"
                className="w-full bg-[#11151E] border border-[#1F2430] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#6366F1]"
                required
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-[#AEB6C8] block mb-1">Description</label>
              <textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="What is this squad about?"
                rows={2}
                className="w-full bg-[#11151E] border border-[#1F2430] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#6366F1] resize-none"
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-[#AEB6C8] block mb-1">
                {newGroupIsPrivate ? 'Initial Invited Members' : 'Invite Members (Optional)'}
              </label>
              <input
                type="text"
                value={newGroupInviteMember}
                onChange={(e) => setNewGroupInviteMember(e.target.value)}
                placeholder="Comma separated names: Ana, Marcus"
                className="w-full bg-[#11151E] border border-[#1F2430] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#6366F1]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#4338CA] hover:brightness-110 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg"
            >
              {newGroupIsPrivate ? 'Create Private Squad' : 'Create Public Squad'}
            </button>
          </form>
        </div>
      )}

      {/* LEFT RAIL (Sidebar) */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 bg-gradient-to-b from-[#0E1219] to-[#0C1017] border-r border-[#1F2430] flex flex-col transition-all duration-300 ease-out ${
          railCollapsed ? 'w-[82px] min-w-[82px]' : 'w-[310px] min-w-[310px]'
        } ${
          mobileRailOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-[#1F2430]/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D70F5] to-[#4338CA] grid place-items-center shadow-lg text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            {!railCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm tracking-tight text-white leading-tight">LMC Chats</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#818CF8]">Public & Private PWA</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setRailCollapsed(!railCollapsed)}
            className="hidden md:grid place-items-center w-8 h-8 rounded-lg text-[#77808F] hover:text-white hover:bg-white/5 transition-colors"
            title="Toggle Sidebar Rail"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileRailOpen(false)}
            className="md:hidden grid place-items-center w-8 h-8 rounded-lg text-[#77808F] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-2.5 relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-[#151922] border border-[#1F2430] hover:border-white/10 transition-all text-left"
          >
            <div className="relative shrink-0">
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-xl object-cover border border-white/5" />
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#151922] ${
                  user.status === 'online' ? 'bg-[#22C55E]' : user.status === 'idle' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                }`}
              />
            </div>
            {!railCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-[#77808F] capitalize truncate">{user.status}</p>
              </div>
            )}
            {!railCollapsed && <ChevronDown className="w-3.5 h-3.5 text-[#77808F] shrink-0" />}
          </button>

          {/* Status Dropdown */}
          {showStatusMenu && (
            <div className="absolute top-16 left-3 right-3 z-50 bg-[#1A1F2A] border border-white/10 rounded-xl p-1.5 shadow-2xl animate-msg-in">
              <button
                onClick={() => {
                  saveUser({ ...user, status: 'online' });
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                <span className="flex-1 text-white">Online</span>
                {user.status === 'online' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
              </button>
              <button
                onClick={() => {
                  saveUser({ ...user, status: 'idle' });
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="flex-1 text-white">Idle</span>
                {user.status === 'idle' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
              </button>
              <button
                onClick={() => {
                  saveUser({ ...user, status: 'dnd' });
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="flex-1 text-white">Do Not Disturb</span>
                {user.status === 'dnd' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
              </button>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={() => {
                  setShowStatusMenu(false);
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-[#818CF8]"
              >
                <User className="w-3.5 h-3.5" /> Edit Profile...
              </button>
            </div>
          )}
        </div>

        {/* New Group Button */}
        <div className="px-3 py-1">
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="w-full bg-[#6366F1] hover:bg-[#5457E5] text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!railCollapsed && <span>New Group</span>}
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto scroll px-2 py-2 space-y-3">
          {/* Public Squads Section */}
          <div>
            {!railCollapsed && (
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-[#77808F]">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-[#22C55E]" /> Public Squads
                </span>
                <span className="bg-white/5 px-1.5 py-0.5 rounded">
                  {visibleGroups.filter((g) => !g.is_private).length}
                </span>
              </div>
            )}
            <div className="space-y-1 mt-1">
              {visibleGroups
                .filter((g) => !g.is_private)
                .map((group) => {
                  const isActive = group.id === activeGroupId;
                  const isMember =
                    group.created_by?.toLowerCase() === user.name.toLowerCase() ||
                    (group.members || []).some((m) => m.toLowerCase() === user.name.toLowerCase());

                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        setActiveGroupId(group.id);
                        setMobileRailOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left relative ${
                        isActive
                          ? 'bg-[#6366F1]/15 text-white font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#6366F1] before:rounded-r'
                          : 'text-[#AEB6C8] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img src={group.avatar} alt={group.name} className="w-10 h-10 rounded-xl object-cover border border-white/5" />
                        <span className="absolute -bottom-1 -right-1 bg-black/80 rounded-full p-0.5 text-[#22C55E]">
                          <Globe className="w-2.5 h-2.5" />
                        </span>
                      </div>
                      {!railCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold truncate text-white">{group.name}</span>
                            {!isMember && (
                              <span className="text-[9px] bg-[#6366F1]/20 text-[#818CF8] px-1 py-0.5 rounded font-bold">
                                Join
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#77808F] truncate">{group.description}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Private Squads Section (Filtered: only visible to members/admin) */}
          <div>
            {!railCollapsed && (
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-[#77808F]">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#F59E0B]" /> Private Squads 🔒
                </span>
                <span className="bg-white/5 px-1.5 py-0.5 rounded">
                  {visibleGroups.filter((g) => g.is_private).length}
                </span>
              </div>
            )}
            <div className="space-y-1 mt-1">
              {visibleGroups
                .filter((g) => g.is_private)
                .map((group) => {
                  const isActive = group.id === activeGroupId;
                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        setActiveGroupId(group.id);
                        setMobileRailOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left relative ${
                        isActive
                          ? 'bg-[#6366F1]/15 text-white font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#6366F1] before:rounded-r'
                          : 'text-[#AEB6C8] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img src={group.avatar} alt={group.name} className="w-10 h-10 rounded-xl object-cover border border-white/5" />
                        <span className="absolute -bottom-1 -right-1 bg-black/80 rounded-full p-0.5 text-[#F59E0B]">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      </div>
                      {!railCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold truncate text-white">{group.name}</span>
                            <span className="text-[9px] bg-[#F59E0B]/20 text-[#F59E0B] px-1 py-0.5 rounded font-bold">
                              Private
                            </span>
                          </div>
                          <p className="text-[11px] text-[#77808F] truncate">{group.description}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#1F2430] text-[11px] flex items-center justify-between text-[#77808F]">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'
              }`}
            />
            {!railCollapsed && <span>{isSupabaseConfigured ? 'Supabase Realtime' : 'LMC Local Realtime'}</span>}
          </div>
        </div>
      </aside>

      {/* Scrim */}
      {(mobileRailOpen || infoOpen) && (
        <div
          onClick={() => {
            setMobileRailOpen(false);
            setInfoOpen(false);
          }}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* MAIN CHAT COLUMN */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-[#0B0E14]">
        {/* Header */}
        <header className="h-16 px-3.5 sm:px-5 flex items-center justify-between border-b border-[#1F2430] bg-[#0B0E14]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileRailOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#77808F] hover:text-white hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative shrink-0">
              <img src={activeGroup.avatar} alt={activeGroup.name} className="w-9 h-9 rounded-xl object-cover border border-white/10" />
              {activeGroup.is_private && (
                <span className="absolute -bottom-1 -right-1 bg-black/90 p-0.5 rounded-full text-[#F59E0B]">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
                {activeGroup.name}
                {activeGroup.is_private ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] shrink-0">
                    Private 🔒
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] shrink-0">
                    Public 🌐
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-[#77808F] flex items-center gap-1 truncate">
                <span>{(activeGroup.members || []).length} members</span>
                <span>•</span>
                <span>Created by {activeGroup.created_by}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-[#77808F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="bg-[#11151E] border border-[#1F2430] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#E9ECF4] placeholder-[#77808F] focus:outline-none focus:border-[#6366F1] w-40 lg:w-56 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#77808F] hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => triggerToast('Voice Call connecting to LMC channel...')}
              className="p-2 rounded-xl text-[#AEB6C8] hover:text-white hover:bg-white/5 transition-all"
              title="Voice Call"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => triggerToast('Video Room link ready for squad members!')}
              className="p-2 rounded-xl text-[#AEB6C8] hover:text-white hover:bg-white/5 transition-all"
              title="Video Call"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className={`p-2 rounded-xl transition-all ${
                infoOpen ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'text-[#AEB6C8] hover:text-white hover:bg-white/5'
              }`}
              title="Channel Info & Members"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Non-Member Banner for Public Groups */}
        {!isMemberOfActiveGroup && (
          <div className="bg-[#6366F1]/15 border-b border-[#6366F1]/30 p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-10 animate-msg-in">
            <div className="flex items-center gap-2 text-xs text-white text-center sm:text-left">
              <Globe className="w-4 h-4 text-[#818CF8] shrink-0" />
              <span>
                You are currently previewing <strong>{activeGroup.name}</strong>. Join the squad to chat and send memes!
              </span>
            </div>
            {hasPendingJoinRequest ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-[#AEB6C8]">
                <Clock className="w-3.5 h-3.5 text-[#F59E0B]" /> Request Pending Approval
              </span>
            ) : (
              <button
                onClick={handleRequestToJoin}
                className="bg-[#6366F1] hover:bg-[#5457E5] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Request to Join Squad
              </button>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto scroll p-3 sm:p-6 space-y-4">
          <div className="flex items-center justify-center my-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#77808F] bg-white/5 border border-white/5 px-3 py-1 rounded-full">
              LMC Chats • Real-time
            </span>
          </div>

          {displayedMessages.map((msg) => {
            const isMe = msg.sender_name.toLowerCase() === user.name.toLowerCase();
            return (
              <div
                key={msg.id}
                className={`flex gap-3 group relative animate-msg-in ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {!isMe && (
                  <img
                    src={msg.sender_avatar}
                    alt={msg.sender_name}
                    className="w-8 h-8 rounded-xl object-cover shrink-0 mt-1 border border-white/5"
                  />
                )}

                <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-[#DDE2EE]">{msg.sender_name}</span>
                      <time className="text-[10px] text-[#77808F]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.msg_type === 'text' && (
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-md ${
                        isMe
                          ? 'bg-gradient-to-br from-[#6D70F5] to-[#5254E3] text-white rounded-tr-none'
                          : 'bg-[#151922] border border-[#1F2430] text-[#DCE1EC] rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  {msg.msg_type === 'sticker' && (
                    <div className="p-1 rounded-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                      <img
                        src={msg.media_url}
                        alt="Sticker"
                        className="w-36 sm:w-44 h-auto object-contain filter drop-shadow-xl"
                      />
                    </div>
                  )}

                  {msg.msg_type === 'gif' && (
                    <div className="relative rounded-2xl overflow-hidden border border-[#1F2430] shadow-xl max-w-xs group/gif">
                      <img src={msg.media_url} alt="GIF" className="w-full h-auto object-cover max-h-60" />
                      <span className="absolute top-2 right-2 text-[9px] font-black uppercase bg-black/75 px-1.5 py-0.5 rounded text-white backdrop-blur">
                        GIF
                      </span>
                      {msg.content && (
                        <div className="p-2 bg-[#151922] text-xs text-[#DCE1EC] border-t border-[#1F2430]">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.msg_type === 'image' && (
                    <div className="relative rounded-2xl overflow-hidden border border-[#1F2430] shadow-xl max-w-sm">
                      <img src={msg.media_url} alt="Uploaded" className="w-full h-auto object-cover max-h-72" />
                      {msg.content && (
                        <div className="p-2 bg-[#151922] text-xs text-[#DCE1EC] border-t border-[#1F2430]">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp & checks */}
                  {isMe && (
                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-[#77808F]">
                      <time>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                      <CheckCheck className="w-3.5 h-3.5 text-[#818CF8]" />
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                    {Object.entries(msg.reactions).map(([emoji, count]) => {
                      if (count <= 0) return null;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="px-2 py-0.5 rounded-full bg-[#10141C] border border-[#232A38] text-xs hover:border-[#6366F1] flex items-center gap-1.5 transition-all animate-pop-in"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-bold text-[#818CF8]">{count}</span>
                        </button>
                      );
                    })}

                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setReactionPopCoords({ x: rect.left, y: rect.top - 44 });
                        setReactionPopForMsg(reactionPopForMsg === msg.id ? null : msg.id);
                      }}
                      className="w-6 h-6 rounded-full border border-dashed border-[#2A3242] text-[#77808F] hover:text-white hover:border-[#6366F1] flex items-center justify-center text-xs transition-all"
                      title="Add Reaction"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={streamEndRef} />
        </div>

        {/* Reaction Quick Bar Popover */}
        {reactionPopForMsg && (
          <div
            style={{ top: `${Math.max(10, reactionPopCoords.y)}px`, left: `${Math.max(10, reactionPopCoords.x - 80)}px` }}
            className="fixed z-50 flex items-center gap-1 bg-[#1A1F2A]/95 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-2xl animate-pop-in"
          >
            {['🔥', '😂', '❤️', '👍', '🎉', '👀', '💯', '🚀'].map((em) => (
              <button
                key={em}
                onClick={() => handleToggleReaction(reactionPopForMsg, em)}
                className="w-7 h-7 rounded-xl hover:bg-white/10 grid place-items-center text-base transition-transform hover:scale-125"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* COMPOSER DOCK */}
        <div className="p-2.5 sm:p-4 bg-[#0B0E14] border-t border-[#1F2430] relative">
          {/* Sticker & GIF Drawer */}
          {showTray && (
            <div className="absolute bottom-full mb-3 right-2.5 sm:right-6 left-2.5 sm:left-auto sm:w-[420px] bg-[#151922]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl z-50 animate-msg-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                  <button
                    onClick={() => setTrayTab('gifs')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      trayTab === 'gifs' ? 'bg-[#6366F1] text-white shadow' : 'text-[#77808F] hover:text-white'
                    }`}
                  >
                    GIFs
                  </button>
                  <button
                    onClick={() => setTrayTab('stickers')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      trayTab === 'stickers' ? 'bg-[#6366F1] text-white shadow' : 'text-[#77808F] hover:text-white'
                    }`}
                  >
                    Stickers (16+)
                  </button>
                </div>
                <button onClick={() => setShowTray(false)} className="text-[#77808F] hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* GIFs Tab */}
              {trayTab === 'gifs' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#77808F] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={gifSearch}
                      onChange={(e) => setGifSearch(e.target.value)}
                      placeholder="Search Tenor & Giphy..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto scroll pr-1">
                    {gifResults.map((gif) => (
                      <button
                        key={gif.id}
                        onClick={() => {
                          handleSendMessage('', 'gif', gif.url);
                          setShowTray(false);
                        }}
                        className="relative rounded-xl overflow-hidden aspect-video bg-[#0D1118] border border-white/5 hover:border-[#6366F1] hover:scale-[1.02] transition-all"
                      >
                        <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stickers Tab */}
              {trayTab === 'stickers' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto scroll pr-1">
                    {STICKERS.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          handleSendMessage('', 'sticker', st.url);
                          setShowTray(false);
                        }}
                        className="p-1.5 rounded-xl bg-black/20 hover:bg-[#6366F1]/20 border border-transparent hover:border-[#6366F1] flex items-center justify-center transition-all hover:scale-110"
                        title={st.name}
                      >
                        <img src={st.url} alt={st.name} className="w-14 h-14 object-contain" />
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-white/5 flex gap-2">
                    <input
                      type="url"
                      value={customStickerUrl}
                      onChange={(e) => setCustomStickerUrl(e.target.value)}
                      placeholder="Paste Custom Sticker URL..."
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    />
                    <button
                      onClick={() => {
                        if (!customStickerUrl.trim()) return;
                        handleSendMessage('', 'sticker', customStickerUrl.trim());
                        setCustomStickerUrl('');
                        setShowTray(false);
                      }}
                      className="bg-[#6366F1] text-white px-2.5 py-1 rounded-xl text-xs font-semibold"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-3 right-2.5 sm:right-28 left-2.5 sm:left-auto sm:w-[320px] bg-[#151922]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl z-50 animate-msg-in">
              <div className="flex gap-1 pb-2 border-b border-white/10 mb-2">
                {EMOJI_CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveEmojiCat(idx)}
                    className={`flex-1 py-1 rounded-lg text-sm text-center transition-all ${
                      activeEmojiCat === idx ? 'bg-[#6366F1]/30 text-white' : 'hover:bg-white/5'
                    }`}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>
              <p className="text-[10px] uppercase font-bold text-[#77808F] mb-1">
                {EMOJI_CATEGORIES[activeEmojiCat].label}
              </p>
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto scroll">
                {EMOJI_CATEGORIES[activeEmojiCat].items.map((em, i) => (
                  <button
                    key={i}
                    onClick={() => handleInsertEmoji(em)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 grid place-items-center text-lg transition-transform hover:scale-125"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Composer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText, 'text');
            }}
            className="max-w-4xl mx-auto flex items-end gap-2 bg-[#151922] border border-[#1F2430] focus-within:border-[#6366F1] rounded-2xl p-2 transition-all shadow-xl"
          >
            <label
              className="p-2 rounded-xl text-[#AEB6C8] hover:text-white hover:bg-white/5 cursor-pointer shrink-0"
              title="Upload Image"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      handleSendMessage('', 'image', reader.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <Upload className="w-4 h-4" />
            </label>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputText, 'text');
                }
              }}
              placeholder={
                isMemberOfActiveGroup
                  ? `Message #${activeGroup.name}...`
                  : `Join #${activeGroup.name} to message...`
              }
              disabled={!isMemberOfActiveGroup}
              className="flex-1 bg-transparent border-0 outline-none resize-none px-2 py-1.5 text-sm text-[#E9ECF4] placeholder-[#77808F] max-h-32 leading-relaxed disabled:opacity-50"
            />

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowTray(false);
                }}
                disabled={!isMemberOfActiveGroup}
                className={`p-2 rounded-xl transition-all disabled:opacity-50 ${
                  showEmojiPicker ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'text-[#AEB6C8] hover:text-white hover:bg-white/5'
                }`}
                title="Emoji Picker"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTray(!showTray);
                  setShowEmojiPicker(false);
                }}
                disabled={!isMemberOfActiveGroup}
                className={`p-2 rounded-xl transition-all disabled:opacity-50 ${
                  showTray ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'text-[#AEB6C8] hover:text-white hover:bg-white/5'
                }`}
                title="Stickers & GIFs"
              >
                <Layers className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() || !isMemberOfActiveGroup}
                className={`w-9 h-9 rounded-xl grid place-items-center text-white transition-all shadow-lg ml-1 ${
                  inputText.trim() && isMemberOfActiveGroup
                    ? 'bg-gradient-to-br from-[#6D70F5] to-[#4338CA] hover:brightness-110 active:scale-90'
                    : 'bg-[#1A1F2A] text-[#77808F] opacity-50 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* RIGHT SIDEBAR (Channel Info, Admin Controls & Members) */}
      <aside
        className={`fixed md:relative top-0 bottom-0 right-0 z-40 bg-gradient-to-b from-[#0E1219] to-[#0C1017] border-l border-[#1F2430] w-[320px] min-w-[320px] flex flex-col transition-transform duration-300 ease-out ${
          infoOpen ? 'translate-x-0' : 'translate-x-full md:hidden'
        }`}
      >
        <div className="p-4 border-b border-[#1F2430] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8D96A9] flex items-center gap-1.5">
            {activeGroup.is_private ? <Lock className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Globe className="w-3.5 h-3.5 text-[#22C55E]" />}
            Squad Details
          </span>
          <button onClick={() => setInfoOpen(false)} className="text-[#77808F] hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll p-4 space-y-5">
          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            <img
              src={activeGroup.avatar}
              alt={activeGroup.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#6366F1]/30 shadow-xl mb-3"
            />
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              {activeGroup.name}
              {activeGroup.is_private && <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />}
            </h2>
            <p className="text-xs text-[#77808F] mt-1">{activeGroup.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#AEB6C8]">
                {activeGroup.is_private ? '🔒 Private Squad' : '🌐 Public Squad'}
              </span>
              {isAdminOfActiveGroup && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6366F1]/20 text-[#818CF8] flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-[#F59E0B]" /> You are Admin
                </span>
              )}
            </div>
          </div>

          {/* ADMIN: Pending Join Requests Section (Only for Admin of this group) */}
          {isAdminOfActiveGroup && (activeGroup.join_requests || []).length > 0 && (
            <div className="bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-2xl p-3 animate-msg-in">
              <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#818CF8]" /> Join Requests
                </span>
                <span className="bg-[#6366F1] px-1.5 py-0.2 rounded-full text-[10px]">
                  {activeGroup.join_requests?.length}
                </span>
              </div>
              <div className="space-y-2">
                {activeGroup.join_requests?.map((reqUser) => (
                  <div
                    key={reqUser}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#151922] border border-[#1F2430] text-xs"
                  >
                    <span className="font-semibold text-white truncate">{reqUser}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(reqUser)}
                        className="p-1 rounded-lg bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30"
                        title="Accept Request"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(reqUser)}
                        className="p-1 rounded-lg bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/30"
                        title="Decline Request"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADMIN: Direct Add Member Input */}
          {isAdminOfActiveGroup && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#77808F] block mb-1.5">
                Admin: Add Member Directly
              </label>
              <form onSubmit={handleAdminAddMember} className="flex gap-1.5">
                <input
                  type="text"
                  value={adminAddMemberInput}
                  onChange={(e) => setAdminAddMemberInput(e.target.value)}
                  placeholder="Username to add..."
                  className="flex-1 bg-[#11151E] border border-[#1F2430] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
                <button
                  type="submit"
                  className="bg-[#6366F1] hover:bg-[#5457E5] text-white px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0"
                >
                  Add
                </button>
              </form>
            </div>
          )}

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#77808F] mb-2.5">
              <span>Squad Members</span>
              <span>{(activeGroup.members || []).length}</span>
            </div>
            <div className="space-y-1.5">
              {(activeGroup.members || []).map((mName) => {
                const isCreator = activeGroup.created_by?.toLowerCase() === mName.toLowerCase();
                const isCurrent = user.name.toLowerCase() === mName.toLowerCase();
                return (
                  <div key={mName} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#151922]/50 border border-white/5">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mName)}`}
                      alt={mName}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {mName} {isCurrent && '(You)'}
                      </p>
                      <p className="text-[10px] text-[#77808F]">
                        {isCreator ? 'Group Admin 👑' : 'Squad Member'}
                      </p>
                    </div>
                    {isCreator ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B]">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-[#77808F]">
                        Member
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shared Assets */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#77808F] mb-2">
              <span>Shared Assets</span>
              <span>{sharedMedia.length} Files</span>
            </div>

            <div className="flex gap-1 bg-black/40 p-1 rounded-xl mb-3">
              <button
                onClick={() => setInfoMediaTab('media')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  infoMediaTab === 'media' ? 'bg-[#6366F1] text-white shadow' : 'text-[#77808F] hover:text-white'
                }`}
              >
                Media & GIFs
              </button>
              <button
                onClick={() => setInfoMediaTab('links')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  infoMediaTab === 'links' ? 'bg-[#6366F1] text-white shadow' : 'text-[#77808F] hover:text-white'
                }`}
              >
                Links
              </button>
            </div>

            {infoMediaTab === 'media' && (
              <div className="grid grid-cols-3 gap-1.5">
                {sharedMedia.length > 0 ? (
                  sharedMedia.map((m) => (
                    <div
                      key={m.id}
                      className="aspect-square rounded-xl overflow-hidden bg-black/30 border border-white/5 relative group cursor-pointer"
                      onClick={() => triggerToast(`Opened media by ${m.sender_name}`)}
                    >
                      <img src={m.media_url} alt="Shared" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/80 px-1 rounded uppercase text-white">
                        {m.msg_type}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="col-span-3 text-xs text-[#77808F] text-center py-4">No media in this squad yet.</p>
                )}
              </div>
            )}

            {infoMediaTab === 'links' && (
              <div className="space-y-1.5">
                {sharedLinks.length > 0 ? (
                  sharedLinks.map((l, idx) => (
                    <a
                      key={idx}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-xl bg-[#151922] border border-[#1F2430] hover:border-[#6366F1] transition-all text-xs"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-[#818CF8] shrink-0" />
                      <div className="flex-1 truncate">
                        <p className="text-white font-medium truncate">{l.url}</p>
                        <p className="text-[10px] text-[#77808F]">Shared by {l.sender}</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-[#77808F] text-center py-4">No links in this squad yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Camera,
  MessageSquare,
  LogOut,
  Edit3,
} from 'lucide-react';
import { supabase, isSupabaseConfigured, Group, Message } from '@/lib/supabase';
import { STICKERS, AVATAR_OPTIONS, FALLBACK_GIFS, EMOJI_CATEGORIES } from '@/lib/data';

interface CurrentUser {
  name: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd';
}

const DEFAULT_GROUPS: Group[] = [
  {
    id: 'lmc-main-lounge',
    name: 'LMC Main Lounge',
    description: 'The official squad lounge for chats, memes, music and media.',
    avatar: '/logo.png',
    created_by: 'Alex',
    is_private: false,
    members: ['Alex', 'Sam', 'Kira'],
    join_requests: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'init-1',
    group_id: 'lmc-main-lounge',
    sender_name: 'Alex',
    sender_avatar: '/avatars/avatar-1.png',
    sender_bio: 'Squad founder & creator ⚡',
    content: 'Welcome to **LMC Chats**! Pick your avatar or upload your own photo, set your bio, and enjoy the squad vibes 🚀',
    msg_type: 'text',
    reactions: { '🔥': 4, '❤️': 3 },
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'init-2',
    group_id: 'lmc-main-lounge',
    sender_name: 'Sam',
    sender_avatar: '/avatars/avatar-2.png',
    sender_bio: 'Music producer & gamer 🎧',
    content: 'You can now create custom WhatsApp-style stickers, search all Instagram emojis, and make audio/video calls right from your phone!',
    msg_type: 'text',
    reactions: { '💯': 5, '✨': 2 },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function Home() {
  // Current user state
  const [user, setUser] = useState<CurrentUser>({
    name: '',
    avatar: AVATAR_OPTIONS[0],
    bio: 'Living life • LMC Squad member ⚡',
    status: 'online',
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileBioInput, setProfileBioInput] = useState('');
  const [profileAvatarSelected, setProfileAvatarSelected] = useState(AVATAR_OPTIONS[0]);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // User Profile Viewer Modal (Visiting other users)
  const [viewingProfile, setViewingProfile] = useState<{
    name: string;
    avatar: string;
    bio?: string;
    status?: string;
  } | null>(null);

  // App Layout
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Groups and Messages with permanent LocalStorage persistence
  const [groups, setGroups] = useState<Group[]>(DEFAULT_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string>(DEFAULT_GROUPS[0].id);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom User Stickers (like WhatsApp)
  const [userStickers, setUserStickers] = useState<string[]>([]);

  // Modals & Drawers
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [newGroupInviteMember, setNewGroupInviteMember] = useState('');
  const [adminAddMemberInput, setAdminAddMemberInput] = useState('');

  // Call System (Audio & Video Calling)
  const [activeCall, setActiveCall] = useState<{
    type: 'audio' | 'video';
    targetName: string;
    targetAvatar: string;
    duration: number;
    isMuted: boolean;
    isVideoOff: boolean;
  } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  // Emoji, Sticker & GIF
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [activeEmojiCat, setActiveEmojiCat] = useState(0);
  const [showTray, setShowTray] = useState(false);
  const [trayTab, setTrayTab] = useState<'gifs' | 'stickers' | 'custom'>('gifs');
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

  // Load User, Groups, Messages, and Custom Stickers from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Load User Session
    const storedUser = localStorage.getItem('lmc_session');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.name) {
          setUser(parsed);
          setProfileNameInput(parsed.name);
          setProfileAvatarSelected(parsed.avatar || AVATAR_OPTIONS[0]);
          setProfileBioInput(parsed.bio || 'Living life • LMC Squad member ⚡');
        } else {
          setShowProfileModal(true);
        }
      } catch {
        setShowProfileModal(true);
      }
    } else {
      setShowProfileModal(true);
    }

    // 2. Load Persisted Groups
    const storedGroups = localStorage.getItem('lmc_saved_groups');
    if (storedGroups) {
      try {
        const parsedGroups = JSON.parse(storedGroups);
        if (Array.isArray(parsedGroups) && parsedGroups.length > 0) {
          setGroups(parsedGroups);
          setActiveGroupId(parsedGroups[0].id);
        }
      } catch {
        // ignore
      }
    }

    // 3. Load Persisted Messages
    const storedMessages = localStorage.getItem('lmc_saved_messages');
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch {
        // ignore
      }
    }

    // 4. Load Custom Stickers
    const storedStickers = localStorage.getItem('lmc_custom_stickers');
    if (storedStickers) {
      try {
        const parsedStickers = JSON.parse(storedStickers);
        if (Array.isArray(parsedStickers)) {
          setUserStickers(parsedStickers);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Permanent Storage Sync Handlers
  const saveUserSession = (updated: CurrentUser) => {
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lmc_session', JSON.stringify(updated));
    }
  };

  const savePersistedMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lmc_saved_messages', JSON.stringify(newMessages));
    }
  };

  const savePersistedGroups = (newGroups: Group[]) => {
    setGroups(newGroups);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lmc_saved_groups', JSON.stringify(newGroups));
    }
  };

  // Cross-tab synchronization via BroadcastChannel with strict deduplication
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel('lmc_chat_sync');
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'NEW_MESSAGE') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          const updated = [...prev, payload];
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'REACTION_UPDATE') {
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === payload.id ? { ...m, reactions: payload.reactions } : m
          );
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'NEW_GROUP') {
        setGroups((prev) => {
          if (prev.some((g) => g.id === payload.id)) return prev;
          const updated = [payload, ...prev];
          localStorage.setItem('lmc_saved_groups', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'UPDATE_GROUP') {
        setGroups((prev) => {
          const updated = prev.map((g) => (g.id === payload.id ? { ...g, ...payload } : g));
          localStorage.setItem('lmc_saved_groups', JSON.stringify(updated));
          return updated;
        });
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  // Supabase Initial Load & Sync
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
          localStorage.setItem('lmc_saved_groups', JSON.stringify(remoteGroups));
        }

        const { data: remoteMessages, error: mError } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (!mError && remoteMessages && remoteMessages.length > 0) {
          setMessages(remoteMessages);
          localStorage.setItem('lmc_saved_messages', JSON.stringify(remoteMessages));
        }
      } catch (err) {
        console.warn('Supabase fetch notice, using active fallback:', err);
      }
    }

    loadSupabaseData();
  }, []);

  // Supabase Realtime Subscription with Deduplication
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
            const updated = [...prev, newMsg];
            localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => {
            const list = prev.map((m) => (m.id === updated.id ? updated : m));
            localStorage.setItem('lmc_saved_messages', JSON.stringify(list));
            return list;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'groups' },
        (payload) => {
          const newGroup = payload.new as Group;
          setGroups((prev) => {
            if (prev.some((g) => g.id === newGroup.id)) return prev;
            const updated = [newGroup, ...prev];
            localStorage.setItem('lmc_saved_groups', JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeGroupId]);

  // Active Group Resolution
  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0] || DEFAULT_GROUPS[0];
  }, [groups, activeGroupId]);

  // Group Visibility Rules
  const visibleGroups = useMemo(() => {
    return groups.filter((g) => {
      if (!g.is_private) return true;
      if (!user.name) return false;
      const isCreator = g.created_by?.toLowerCase() === user.name.toLowerCase();
      const isMember = (g.members || []).some((m) => m.toLowerCase() === user.name.toLowerCase());
      return isCreator || isMember;
    });
  }, [groups, user.name]);

  // In Public groups, everyone can chat! In Private, only creator or member.
  const isMemberOfActiveGroup = useMemo(() => {
    if (!activeGroup) return false;
    if (!activeGroup.is_private) return true;
    if (!user.name) return false;
    const isCreator = activeGroup.created_by?.toLowerCase() === user.name.toLowerCase();
    const isMember = (activeGroup.members || []).some((m) => m.toLowerCase() === user.name.toLowerCase());
    return isCreator || isMember;
  }, [activeGroup, user.name]);

  const isAdminOfActiveGroup = useMemo(() => {
    if (!activeGroup || !user.name) return false;
    return activeGroup.created_by?.toLowerCase() === user.name.toLowerCase();
  }, [activeGroup, user.name]);

  // Filtered Messages
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

  // Shared Media and Links
  const sharedMedia = useMemo(() => {
    return messages
      .filter((m) => m.group_id === activeGroupId)
      .filter((m) => m.media_url && m.media_url.trim().length > 0);
  }, [messages, activeGroupId]);

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

  // Save Profile Handler (with custom PFP and Bio)
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = profileNameInput.trim();
    if (!trimmed) {
      triggerToast('Please enter your name');
      return;
    }

    const updatedUser: CurrentUser = {
      name: trimmed,
      avatar: profileAvatarSelected,
      bio: profileBioInput.trim() || 'LMC Squad member ⚡',
      status: user.status || 'online',
    };

    saveUserSession(updatedUser);
    setShowProfileModal(false);

    // Auto-register to public channels
    const updatedGroups = groups.map((g) => {
      if (!g.is_private && !(g.members || []).some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
        return { ...g, members: [...(g.members || []), trimmed] };
      }
      return g;
    });
    savePersistedGroups(updatedGroups);

    triggerToast(`Profile updated: ${trimmed}!`);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
  };

  // Custom PFP Upload handler (File Reader to DataURL)
  const handleCustomPfpUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileAvatarSelected(reader.result);
        triggerToast('Custom photo set as avatar!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Custom Sticker Upload Handler (WhatsApp style)
  const handleCreateCustomSticker = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const stickerUrl = reader.result;
        const updatedStickers = [stickerUrl, ...userStickers];
        setUserStickers(updatedStickers);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lmc_custom_stickers', JSON.stringify(updatedStickers));
        }
        triggerToast('Sticker created! Click to send 🎉');
      }
    };
    reader.readAsDataURL(file);
  };

  // SEND MESSAGE (With Strict Deduplication Lock)
  const handleSendMessage = useCallback(
    async (
      content: string,
      msg_type: 'text' | 'sticker' | 'gif' | 'image' = 'text',
      media_url: string = ''
    ) => {
      if (!user.name) {
        setShowProfileModal(true);
        return;
      }
      if (!isMemberOfActiveGroup) {
        triggerToast('This channel is private. Invite required.');
        return;
      }
      if (msg_type === 'text' && !content.trim()) return;
      if (isSending) return;

      setIsSending(true);

      // Clean input box synchronously
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const uniqueId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const newMsg: Message = {
        id: uniqueId,
        group_id: activeGroupId,
        sender_name: user.name,
        sender_avatar: user.avatar || AVATAR_OPTIONS[0],
        sender_bio: user.bio,
        content: content.trim(),
        msg_type,
        media_url,
        reactions: {},
        created_at: new Date().toISOString(),
      };

      // Optimistic update & LocalStorage persist
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const updated = [...prev, newMsg];
        if (typeof window !== 'undefined') {
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
        }
        return updated;
      });

      // Broadcast to other tabs
      if (typeof window !== 'undefined') {
        const channel = new BroadcastChannel('lmc_chat_sync');
        channel.postMessage({ type: 'NEW_MESSAGE', payload: newMsg });
        channel.close();
      }

      // Remote Supabase sync if connected
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('messages').insert([newMsg]);
        } catch (err) {
          console.error('Supabase message error:', err);
        }
      }

      setTimeout(() => {
        setIsSending(false);
      }, 150);
    },
    [user, activeGroupId, isMemberOfActiveGroup, isSending]
  );

  // Toggle Reaction
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    const target = messages.find((m) => m.id === msgId);
    if (!target) return;

    const currentCount = target.reactions[emoji] || 0;
    const newReactions = { ...target.reactions };
    newReactions[emoji] = currentCount > 0 ? currentCount + 1 : 1;

    const updatedMessages = messages.map((m) =>
      m.id === msgId ? { ...m, reactions: newReactions } : m
    );
    savePersistedMessages(updatedMessages);
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

  // Create New Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const creatorName = user.name || 'Anonymous';
    const initialMembers = [creatorName];
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
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || (newGroupIsPrivate ? 'Private squad room' : 'Public channel'),
      avatar: '/logo.png',
      created_by: creatorName,
      is_private: newGroupIsPrivate,
      members: initialMembers,
      join_requests: [],
      created_at: new Date().toISOString(),
      unreadCount: 0,
    };

    const updatedGroups = [newGroup, ...groups];
    savePersistedGroups(updatedGroups);
    setActiveGroupId(newGroup.id);
    setShowNewGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupIsPrivate(false);
    setNewGroupInviteMember('');
    triggerToast(newGroup.is_private ? `Private Channel "${newGroup.name}" created` : `Channel "${newGroup.name}" created`);

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

  // Admin Add Member
  const handleAdminAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAddMemberInput.trim() || !activeGroup || !isAdminOfActiveGroup) return;

    const memberName = adminAddMemberInput.trim();
    const updatedMembers = [...(activeGroup.members || [])];
    if (!updatedMembers.some((m) => m.toLowerCase() === memberName.toLowerCase())) {
      updatedMembers.push(memberName);
    }

    const updatedGroup = { ...activeGroup, members: updatedMembers };
    const updatedGroups = groups.map((g) => (g.id === activeGroup.id ? updatedGroup : g));
    savePersistedGroups(updatedGroups);
    setAdminAddMemberInput('');
    triggerToast(`Added ${memberName} to channel!`);

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

  // AUDIO & VIDEO CALLING ENGINE (Web Audio API Ringing + Camera stream)
  const startCall = async (type: 'audio' | 'video', targetName: string, targetAvatar: string) => {
    setActiveCall({
      type,
      targetName,
      targetAvatar,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
    });

    // Start live duration counter
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    callIntervalRef.current = setInterval(() => {
      setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
    }, 1000);

    // Audio synthesizer for telephone ringtone
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        gain.gain.value = 0.05;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        // Ring for 3.5 seconds then stop
        setTimeout(() => {
          try {
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
            setTimeout(() => ctx.close(), 600);
          } catch {}
        }, 3500);
      }
    } catch {
      // ignore audio restriction
    }

    // Video stream initialization
    if (type === 'video' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera preview notice:', err);
      }
    }
  };

  const endCall = () => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
      callIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    setActiveCall(null);
    triggerToast('Call ended');
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
          )}&limit=16&rating=g`
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
    }, 300);

    return () => clearTimeout(timer);
  }, [gifSearch]);

  // Filtered Emojis by search query
  const displayedEmojis = useMemo(() => {
    if (!emojiSearch.trim()) {
      return EMOJI_CATEGORIES[activeEmojiCat].items;
    }
    const q = emojiSearch.trim().toLowerCase();
    const all = EMOJI_CATEGORIES.flatMap((c) => c.items);
    return all.filter((em) => em.includes(q) || true).slice(0, 70);
  }, [emojiSearch, activeEmojiCat]);

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-[#0B0E17] text-[#E9ECF4] relative font-sans select-text">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] flex items-center gap-2 bg-[#1A2234]/95 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm animate-msg-in">
          <Sparkles className="w-4 h-4 text-[#818CF8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CALL OVERLAY MODAL (Voice & Video Call) */}
      {activeCall && (
        <div className="fixed inset-0 z-[250] bg-[#0A0D14]/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-msg-in">
          <div className="flex items-center justify-between w-full max-w-md pt-4">
            <span className="text-xs uppercase font-bold tracking-wider text-[#7A8396] flex items-center gap-1.5">
              {activeCall.type === 'video' ? <Video className="w-4 h-4 text-[#818CF8]" /> : <Phone className="w-4 h-4 text-[#22C55E]" />}
              {activeCall.type === 'video' ? 'LMC Video Call' : 'LMC Voice Call'}
            </span>
            <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-full text-white">
              {Math.floor(activeCall.duration / 60)
                .toString()
                .padStart(2, '0')}
              :{(activeCall.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Caller Center */}
          <div className="flex flex-col items-center my-auto">
            {activeCall.type === 'video' ? (
              <div className="relative w-72 h-96 sm:w-80 sm:h-[420px] rounded-3xl overflow-hidden bg-black border-2 border-white/10 shadow-2xl flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${activeCall.isVideoOff ? 'hidden' : 'block'}`}
                />
                {activeCall.isVideoOff && (
                  <div className="flex flex-col items-center">
                    <img
                      src={activeCall.targetAvatar}
                      alt={activeCall.targetName}
                      className="w-24 h-24 rounded-full object-contain bg-[#162044] p-1 border-2 border-white/10 mb-3"
                    />
                    <p className="text-sm font-semibold text-white">Camera Off</p>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white">
                  Live HD
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-[#162044] p-2 border-4 border-[#6366F1]/50 shadow-2xl animate-pulse">
                    <img
                      src={activeCall.targetAvatar}
                      alt={activeCall.targetName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="absolute bottom-1 right-2 w-5 h-5 rounded-full bg-[#22C55E] border-2 border-[#0A0D14]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{activeCall.targetName}</h3>
                <p className="text-xs text-[#818CF8]">
                  {activeCall.duration > 3 ? 'Connected' : 'Calling squad...'}
                </p>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex items-center gap-4 pb-6">
            <button
              onClick={() => setActiveCall({ ...activeCall, isMuted: !activeCall.isMuted })}
              className={`w-12 h-12 rounded-full grid place-items-center transition-all ${
                activeCall.isMuted ? 'bg-[#EF4444] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Mute/Unmute"
            >
              {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {activeCall.type === 'video' && (
              <button
                onClick={() => setActiveCall({ ...activeCall, isVideoOff: !activeCall.isVideoOff })}
                className={`w-12 h-12 rounded-full grid place-items-center transition-all ${
                  activeCall.isVideoOff ? 'bg-[#EF4444] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Toggle Camera"
              >
                {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 grid place-items-center text-white shadow-xl shadow-[#EF4444]/30"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* USER PROFILE CARD MODAL (When clicking someone's avatar/name) */}
      {viewingProfile && (
        <div className="fixed inset-0 z-[210] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-msg-in">
          <div className="w-full max-w-sm bg-[#131722] border border-[#232B3E] rounded-3xl p-6 shadow-2xl relative flex flex-col items-center text-center">
            <button
              onClick={() => setViewingProfile(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#F5F6F8] p-1 border-2 border-[#6366F1]/50 shadow-xl">
                <img
                  src={viewingProfile.avatar}
                  alt={viewingProfile.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#22C55E] border-2 border-[#131722]" />
            </div>

            <h3 className="text-lg font-bold text-white">{viewingProfile.name}</h3>
            <p className="text-xs text-[#818CF8] font-mono mb-2">@{viewingProfile.name.toLowerCase().replace(/\s+/g, '')}</p>

            <div className="bg-[#0D1017] border border-[#232B3E] rounded-2xl p-3 w-full mb-5">
              <p className="text-xs text-[#A8B2C7] leading-relaxed">
                {viewingProfile.bio || 'Living life • LMC Squad member ⚡'}
              </p>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setViewingProfile(null);
                  startCall('audio', viewingProfile.name, viewingProfile.avatar);
                }}
                className="flex-1 bg-[#1A2234] hover:bg-[#253048] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone className="w-4 h-4 text-[#22C55E]" /> Voice Call
              </button>
              <button
                onClick={() => {
                  setViewingProfile(null);
                  startCall('video', viewingProfile.name, viewingProfile.avatar);
                }}
                className="flex-1 bg-[#6366F1] hover:bg-[#5457E5] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Video className="w-4 h-4" /> Video Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE / LOGIN MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-sm bg-[#131722] border border-[#232B3E] rounded-3xl p-6 shadow-2xl animate-msg-in flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Your Profile</h2>
                <p className="text-xs text-[#7A8396]">Custom photo, bio & squad identity</p>
              </div>
              {user.name && (
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Custom Photo Upload or Doodle Grid */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#A8B2C7]">Profile Picture</label>
                <label className="text-xs font-bold text-[#818CF8] hover:text-[#A5B4FC] cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCustomPfpUpload(file);
                    }}
                  />
                </label>
              </div>

              {/* Active Avatar Preview */}
              <div className="flex items-center gap-3 p-2 bg-[#0D1017] rounded-2xl border border-white/5 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F5F6F8] p-0.5 border border-[#6366F1] shrink-0">
                  <img src={profileAvatarSelected} alt="Current" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">Selected Avatar</p>
                  <p className="text-[10px] text-[#7A8396]">Pick below or upload custom photo</p>
                </div>
              </div>

              {/* 16 Doodle Avatars Grid */}
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto scroll p-1 bg-[#0D1017] rounded-2xl border border-white/5">
                {AVATAR_OPTIONS.map((av, idx) => {
                  const isSelected = profileAvatarSelected === av;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfileAvatarSelected(av)}
                      className={`relative aspect-square rounded-xl p-1 transition-all overflow-hidden bg-[#F5F6F8] border-2 ${
                        isSelected
                          ? 'border-[#6366F1] ring-2 ring-[#6366F1]/50 scale-105 shadow-md'
                          : 'border-transparent hover:border-white/30 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt={`Avatar ${idx + 1}`} className="w-full h-full object-contain" />
                      {isSelected && (
                        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#6366F1] text-white grid place-items-center text-[8px] shadow">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username input */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">Username</label>
              <input
                type="text"
                value={profileNameInput}
                onChange={(e) => setProfileNameInput(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#5A6376] outline-none"
                required
              />
            </div>

            {/* Bio Input */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">Bio</label>
              <textarea
                value={profileBioInput}
                onChange={(e) => setProfileBioInput(e.target.value)}
                placeholder="Write a bio about yourself..."
                rows={2}
                className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#5A6376] outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#6366F1] hover:bg-[#5457E5] active:scale-[0.98] text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#6366F1]/25 flex items-center justify-center gap-2"
            >
              Save & Enter Chats <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* CREATE NEW CHANNEL MODAL */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleCreateGroup}
            className="w-full max-w-sm bg-[#131722] border border-[#232B3E] rounded-3xl p-6 shadow-2xl animate-msg-in"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#818CF8]" /> Create Channel
              </h2>
              <button
                type="button"
                onClick={() => setShowNewGroupModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Public vs Private Selector */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-[#0D1017] p-1.5 rounded-xl border border-[#232B3E]">
              <button
                type="button"
                onClick={() => setNewGroupIsPrivate(false)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  !newGroupIsPrivate ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Public
              </button>
              <button
                type="button"
                onClick={() => setNewGroupIsPrivate(true)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  newGroupIsPrivate ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Private 🔒
              </button>
            </div>

            <p className="text-[11px] text-[#7A8396] mb-3">
              {newGroupIsPrivate
                ? 'Only members invited by you can see and chat in this room.'
                : 'Anyone in the squad can chat and share media here.'}
            </p>

            <div className="mb-3">
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">Channel Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Channel name..."
                className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-sm text-white placeholder-[#5A6376] outline-none"
                required
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">Description</label>
              <textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="What is this channel about?"
                rows={2}
                className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-sm text-white placeholder-[#5A6376] outline-none resize-none"
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-[#A8B2C7] block mb-1">
                {newGroupIsPrivate ? 'Invited Members' : 'Invite Members (Optional)'}
              </label>
              <input
                type="text"
                value={newGroupInviteMember}
                onChange={(e) => setNewGroupInviteMember(e.target.value)}
                placeholder="Type usernames separated by comma"
                className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#6366F1] hover:bg-[#5457E5] active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md"
            >
              {newGroupIsPrivate ? 'Create Private Channel' : 'Create Public Channel'}
            </button>
          </form>
        </div>
      )}

      {/* LEFT SIDEBAR (Instagram & Telegram style) */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 bg-[#0E121B] border-r border-[#1B212E] flex flex-col transition-all duration-300 ease-out ${
          railCollapsed ? 'w-[76px] min-w-[76px]' : 'w-[290px] min-w-[290px]'
        } ${mobileRailOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header with Official Circular Mascot */}
        <div className="p-3.5 flex items-center justify-between border-b border-[#1B212E]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#162044] p-0.5 border border-white/10 shrink-0 shadow-md">
              <img src="/logo.png" alt="LMC Mascot" className="w-full h-full object-contain" />
            </div>
            {!railCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm tracking-tight text-white leading-tight">LMC Chats</span>
                <span className="text-[10px] font-semibold text-[#818CF8]">Since 2026</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setRailCollapsed(!railCollapsed)}
            className="hidden md:grid place-items-center w-8 h-8 rounded-lg text-[#7A8396] hover:text-white hover:bg-white/5 transition-colors"
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileRailOpen(false)}
            className="md:hidden grid place-items-center w-8 h-8 rounded-lg text-[#7A8396] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-2.5 relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="w-full flex items-center gap-2.5 p-2 rounded-2xl bg-[#141824] border border-[#232B3E] hover:border-white/15 transition-all text-left"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#F5F6F8] p-0.5 border border-white/10">
                <img
                  src={user.avatar || AVATAR_OPTIONS[0]}
                  alt={user.name || 'User'}
                  className="w-full h-full object-contain"
                />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#141824] ${
                  user.status === 'online' ? 'bg-[#22C55E]' : user.status === 'idle' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                }`}
              />
            </div>
            {!railCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name || 'Set your name'}</p>
                <p className="text-[10px] text-[#7A8396] truncate">{user.bio || 'Online'}</p>
              </div>
            )}
            {!railCollapsed && <ChevronDown className="w-3.5 h-3.5 text-[#7A8396] shrink-0" />}
          </button>

          {/* Status & Profile Dropdown */}
          {showStatusMenu && (
            <div className="absolute top-16 left-3 right-3 z-50 bg-[#161B28] border border-white/10 rounded-2xl p-1.5 shadow-2xl animate-msg-in">
              <button
                onClick={() => {
                  saveUserSession({ ...user, status: 'online' });
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left"
              >
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span className="flex-1 text-white">Online</span>
                {user.status === 'online' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
              </button>
              <button
                onClick={() => {
                  saveUserSession({ ...user, status: 'idle' });
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left"
              >
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="flex-1 text-white">Away</span>
                {user.status === 'idle' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
              </button>
              <button
                onClick={() => {
                  saveUserSession({ ...user, status: 'dnd' });
                  setShowStatusMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left"
              >
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="flex-1 text-white">Do Not Disturb</span>
                {user.status === 'dnd' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
              </button>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={() => {
                  setShowStatusMenu(false);
                  setProfileNameInput(user.name);
                  setProfileBioInput(user.bio || '');
                  setProfileAvatarSelected(user.avatar || AVATAR_OPTIONS[0]);
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-[#818CF8]"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile & Photo
              </button>
            </div>
          )}
        </div>

        {/* New Channel Button */}
        <div className="px-3 py-1">
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="w-full bg-[#6366F1] hover:bg-[#5457E5] text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!railCollapsed && <span>New Channel</span>}
          </button>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto scroll px-2 py-2 space-y-3">
          {/* Public Channels */}
          <div>
            {!railCollapsed && (
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-[#7A8396]">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-[#22C55E]" /> Channels
                </span>
                <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                  {visibleGroups.filter((g) => !g.is_private).length}
                </span>
              </div>
            )}
            <div className="space-y-1 mt-1">
              {visibleGroups
                .filter((g) => !g.is_private)
                .map((group) => {
                  const isActive = group.id === activeGroupId;
                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        setActiveGroupId(group.id);
                        setMobileRailOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-2xl transition-all text-left relative ${
                        isActive
                          ? 'bg-[#6366F1]/15 text-white font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#6366F1] before:rounded-r'
                          : 'text-[#A8B2C7] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#162044] p-0.5 border border-white/5">
                          <img src={group.avatar || '/logo.png'} alt={group.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 bg-black/80 rounded-full p-0.5 text-[#22C55E]">
                          <Globe className="w-2.5 h-2.5" />
                        </span>
                      </div>
                      {!railCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold truncate block text-white">{group.name}</span>
                          <p className="text-[11px] text-[#7A8396] truncate">{group.description}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Private Channels */}
          <div>
            {!railCollapsed && (
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-[#7A8396]">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#F59E0B]" /> Private Rooms
                </span>
                <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
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
                      className={`w-full flex items-center gap-2.5 p-2 rounded-2xl transition-all text-left relative ${
                        isActive
                          ? 'bg-[#6366F1]/15 text-white font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#6366F1] before:rounded-r'
                          : 'text-[#A8B2C7] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#162044] p-0.5 border border-white/5">
                          <img src={group.avatar || '/logo.png'} alt={group.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 bg-black/80 rounded-full p-0.5 text-[#F59E0B]">
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
                          <p className="text-[11px] text-[#7A8396] truncate">{group.description}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#1B212E] text-[11px] flex items-center justify-between text-[#7A8396]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            {!railCollapsed && <span>LMC Realtime Online</span>}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Scrim */}
      {mobileRailOpen && (
        <div
          onClick={() => setMobileRailOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* MAIN CHAT COLUMN */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-[#0B0E17]">
        {/* Chat Header */}
        <header className="h-16 px-3 sm:px-5 flex items-center justify-between border-b border-[#1B212E] bg-[#0B0E17]/95 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* 3-line hamburger menu for mobile */}
            <button
              onClick={() => setMobileRailOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl grid place-items-center text-[#7A8396] hover:text-white hover:bg-white/5 active:scale-95"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Clickable Channel Header to view Group Details */}
            <div
              onClick={() => setInfoOpen(!infoOpen)}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity min-w-0"
              title="View Channel Details & Members"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#162044] p-0.5 border border-white/10 shadow-sm">
                  <img src={activeGroup.avatar || '/logo.png'} alt={activeGroup.name} className="w-full h-full object-contain" />
                </div>
                {activeGroup.is_private && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-black/90 p-0.5 rounded-full text-[#F59E0B]">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="truncate">
                <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
                  {activeGroup.name}
                </h1>
                <p className="text-[11px] text-[#7A8396] flex items-center gap-1.5 truncate">
                  <span>{(activeGroup.members || []).length} members</span>
                  <span>• Tap for info</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Actions: Voice Call, Video Call, Search & Info */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Input */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-[#7A8396] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-[#131722] border border-[#232B3E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#E9ECF4] placeholder-[#5A6376] focus:outline-none focus:border-[#6366F1] w-36 lg:w-48 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A8396] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Voice Call Button */}
            <button
              onClick={() => startCall('audio', activeGroup.name, activeGroup.avatar || '/logo.png')}
              className="w-9 h-9 rounded-xl grid place-items-center text-[#A8B2C7] hover:text-white hover:bg-white/5 active:scale-90 transition-all"
              title="Start Voice Call"
            >
              <Phone className="w-4 h-4 text-[#22C55E]" />
            </button>

            {/* Video Call Button */}
            <button
              onClick={() => startCall('video', activeGroup.name, activeGroup.avatar || '/logo.png')}
              className="w-9 h-9 rounded-xl grid place-items-center text-[#A8B2C7] hover:text-white hover:bg-white/5 active:scale-90 transition-all"
              title="Start Video Call"
            >
              <Video className="w-4 h-4 text-[#818CF8]" />
            </button>

            {/* Channel Info Button */}
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className={`w-9 h-9 rounded-xl grid place-items-center transition-all ${
                infoOpen ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'text-[#A8B2C7] hover:text-white hover:bg-white/5'
              }`}
              title="Channel Details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto scroll p-3 sm:p-6 space-y-4">
          <div className="flex items-center justify-center my-2">
            <span className="text-[10px] font-semibold text-[#7A8396] bg-white/5 px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          {displayedMessages.map((msg) => {
            const isMe = user.name && msg.sender_name.toLowerCase() === user.name.toLowerCase();
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 group relative animate-msg-in ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {!isMe && (
                  <button
                    onClick={() =>
                      setViewingProfile({
                        name: msg.sender_name,
                        avatar: msg.sender_avatar,
                        bio: msg.sender_bio,
                        status: 'online',
                      })
                    }
                    className="w-8 h-8 rounded-full overflow-hidden bg-[#F5F6F8] p-0.5 shrink-0 mt-1 border border-white/5 hover:scale-105 transition-transform"
                    title={`View @${msg.sender_name}'s profile`}
                  >
                    <img
                      src={msg.sender_avatar}
                      alt={msg.sender_name}
                      className="w-full h-full object-contain"
                    />
                  </button>
                )}

                <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <button
                      onClick={() =>
                        setViewingProfile({
                          name: msg.sender_name,
                          avatar: msg.sender_avatar,
                          bio: msg.sender_bio,
                          status: 'online',
                        })
                      }
                      className="flex items-center gap-2 mb-1 px-1 hover:underline text-left"
                    >
                      <span className="text-xs font-bold text-[#DDE2EE]">{msg.sender_name}</span>
                      <time className="text-[10px] text-[#7A8396]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </button>
                  )}

                  {/* Message Content */}
                  {msg.msg_type === 'text' && (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-md select-text ${
                        isMe
                          ? 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white rounded-tr-sm'
                          : 'bg-[#141824] text-[#E9ECF4] border border-[#232B3E] rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  {msg.msg_type === 'sticker' && (
                    <div className="p-1">
                      <img
                        src={msg.media_url}
                        alt="Sticker"
                        className="w-32 h-32 sm:w-36 sm:h-36 object-contain hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {msg.msg_type === 'gif' && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg max-w-xs">
                      <img
                        src={msg.media_url}
                        alt="GIF"
                        className="w-full h-auto object-cover max-h-60"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {msg.msg_type === 'image' && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg max-w-sm">
                      <img
                        src={msg.media_url}
                        alt="Image"
                        className="w-full h-auto object-cover max-h-72"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Reactions Bar */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5 px-0.5">
                    {Object.entries(msg.reactions || {}).map(([emoji, count]) => {
                      if (count <= 0) return null;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="flex items-center gap-1 bg-[#141824] hover:bg-[#1E2538] border border-[#232B3E] px-2 py-0.5 rounded-full text-xs transition-all active:scale-95"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] text-[#A8B2C7] font-semibold">{count}</span>
                        </button>
                      );
                    })}

                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setReactionPopCoords({ x: rect.left, y: rect.top - 45 });
                        setReactionPopForMsg(reactionPopForMsg === msg.id ? null : msg.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/10 p-1 rounded-full text-[#7A8396] hover:text-white transition-all text-xs"
                      title="Add Reaction"
                    >
                      <SmilePlus className="w-3.5 h-3.5" />
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
            style={{
              top: `${Math.max(10, reactionPopCoords.y)}px`,
              left: `${Math.max(10, reactionPopCoords.x - 80)}px`,
            }}
            className="fixed z-50 flex items-center gap-1 bg-[#161B28]/95 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-2xl animate-pop-in"
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
        <div className="p-2.5 sm:p-4 bg-[#0B0E17] border-t border-[#1B212E] relative">
          {/* Sticker & GIF Drawer (with WhatsApp Custom Stickers) */}
          {showTray && (
            <div className="absolute bottom-full mb-3 right-2.5 sm:right-6 left-2.5 sm:left-auto sm:w-[420px] bg-[#141824]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3.5 shadow-2xl z-50 animate-msg-in">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                  <button
                    onClick={() => setTrayTab('gifs')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      trayTab === 'gifs' ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                    }`}
                  >
                    GIFs
                  </button>
                  <button
                    onClick={() => setTrayTab('stickers')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      trayTab === 'stickers' ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                    }`}
                  >
                    Stickers
                  </button>
                  <button
                    onClick={() => setTrayTab('custom')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      trayTab === 'custom' ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                    }`}
                  >
                    My Stickers
                  </button>
                </div>
                <button
                  onClick={() => setShowTray(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* GIFs Tab */}
              {trayTab === 'gifs' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#7A8396] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={gifSearch}
                      onChange={(e) => setGifSearch(e.target.value)}
                      placeholder="Search Tenor & Giphy..."
                      className="w-full bg-[#0D1017] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-[#5A6376] outline-none focus:border-[#6366F1]"
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
                        className="relative rounded-xl overflow-hidden aspect-video bg-[#0D1017] border border-white/5 hover:border-[#6366F1] hover:scale-[1.02] transition-all"
                      >
                        <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pre-made Stickers Tab */}
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
                        className="p-1.5 rounded-2xl bg-black/20 hover:bg-[#6366F1]/20 border border-transparent hover:border-[#6366F1] flex items-center justify-center transition-all hover:scale-110"
                        title={st.name}
                      >
                        <img src={st.url} alt={st.name} className="w-14 h-14 object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom WhatsApp-style Sticker Maker */}
              {trayTab === 'custom' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <label className="flex-1 bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/30 rounded-2xl p-2.5 text-center cursor-pointer transition-all">
                      <span className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#818CF8]" /> Create from Photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCreateCustomSticker(file);
                        }}
                      />
                    </label>
                  </div>

                  {userStickers.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto scroll pr-1">
                      {userStickers.map((stUrl, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            handleSendMessage('', 'sticker', stUrl);
                            setShowTray(false);
                          }}
                          className="p-1.5 rounded-2xl bg-black/30 hover:bg-[#6366F1]/20 border border-white/5 hover:border-[#6366F1] flex items-center justify-center transition-all hover:scale-110"
                        >
                          <img src={stUrl} alt="Custom Sticker" className="w-14 h-14 object-contain" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#7A8396] text-center py-4">
                      Upload any image above to create your personal WhatsApp-style sticker!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* INSTAGRAM EMOJI PICKER WITH INSTANT SEARCH */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-3 right-2.5 sm:right-28 left-2.5 sm:left-auto sm:w-[340px] bg-[#141824]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl z-50 animate-msg-in">
              {/* Emoji Search */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#7A8396] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Search emojis..."
                  className="w-full bg-[#0D1017] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#5A6376] outline-none focus:border-[#6366F1]"
                />
              </div>

              {/* Category tabs */}
              {!emojiSearch && (
                <div className="flex gap-1 pb-2 border-b border-white/10 mb-2 overflow-x-auto scroll">
                  {EMOJI_CATEGORIES.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveEmojiCat(idx)}
                      className={`px-2.5 py-1 rounded-xl text-sm transition-all ${
                        activeEmojiCat === idx ? 'bg-[#6366F1]/30 text-white' : 'hover:bg-white/5 opacity-70'
                      }`}
                    >
                      {cat.icon}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-7 gap-1 max-h-52 overflow-y-auto scroll pr-1">
                {displayedEmojis.map((em, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText((prev) => prev + em);
                      textareaRef.current?.focus();
                    }}
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
              if (!inputText.trim()) return;
              handleSendMessage(inputText, 'text');
            }}
            className="max-w-4xl mx-auto flex items-end gap-2 bg-[#131722] border border-[#232B3E] focus-within:border-[#6366F1] rounded-2xl p-2 transition-all shadow-xl"
          >
            {/* Upload Image button */}
            <label
              className="p-2 rounded-xl text-[#A8B2C7] hover:text-white hover:bg-white/5 cursor-pointer shrink-0"
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

            {/* Input Textarea with Enter key deduplication */}
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
                  e.stopPropagation();
                  if (!inputText.trim()) return;
                  handleSendMessage(inputText, 'text');
                }
              }}
              placeholder={`Message #${activeGroup.name}...`}
              className="flex-1 bg-transparent border-0 outline-none resize-none px-2 py-1.5 text-sm text-[#E9ECF4] placeholder-[#5A6376] max-h-32 leading-relaxed"
            />

            <div className="flex items-center gap-1 shrink-0">
              {/* Emoji Picker toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowTray(false);
                }}
                className={`p-2 rounded-xl transition-all ${
                  showEmojiPicker ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'text-[#A8B2C7] hover:text-white hover:bg-white/5'
                }`}
                title="Instagram Emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Stickers & GIFs toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowTray(!showTray);
                  setShowEmojiPicker(false);
                }}
                className={`p-2 rounded-xl transition-all ${
                  showTray ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'text-[#A8B2C7] hover:text-white hover:bg-white/5'
                }`}
                title="Stickers & GIFs"
              >
                <Layers className="w-4 h-4" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className={`w-9 h-9 rounded-xl grid place-items-center text-white transition-all shadow-md ml-1 ${
                  inputText.trim() && !isSending
                    ? 'bg-[#6366F1] hover:bg-[#5457E5] active:scale-95'
                    : 'bg-[#1C2230] text-[#5A6376] cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* RIGHT SIDEBAR (Instagram-style Group Details & Members) */}
      <aside
        className={`fixed md:relative top-0 bottom-0 right-0 z-40 bg-[#0E121B] border-l border-[#1B212E] w-[300px] min-w-[300px] flex flex-col transition-transform duration-300 ease-out ${
          infoOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:hidden'
        }`}
      >
        <div className="p-4 border-b border-[#1B212E] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A8B2C7] flex items-center gap-1.5">
            {activeGroup.is_private ? <Lock className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Globe className="w-3.5 h-3.5 text-[#22C55E]" />}
            Group Info
          </span>
          <button
            onClick={() => setInfoOpen(false)}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll p-4 space-y-5">
          {/* Group Mascot & Info */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#162044] p-1.5 border-2 border-[#6366F1]/40 shadow-lg mb-3">
              <img
                src={activeGroup.avatar || '/logo.png'}
                alt={activeGroup.name}
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              {activeGroup.name}
              {activeGroup.is_private && <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />}
            </h2>
            <p className="text-xs text-[#7A8396] mt-1">{activeGroup.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#A8B2C7]">
                {activeGroup.is_private ? '🔒 Private' : '🌐 Public'}
              </span>
              {isAdminOfActiveGroup && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#6366F1]/20 text-[#818CF8] flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-[#F59E0B]" /> Admin
                </span>
              )}
            </div>
          </div>

          {/* Quick Call Actions in Group */}
          <div className="flex gap-2">
            <button
              onClick={() => startCall('audio', activeGroup.name, activeGroup.avatar || '/logo.png')}
              className="flex-1 bg-[#141824] hover:bg-[#1E2538] border border-[#232B3E] py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-[#22C55E]" /> Call
            </button>
            <button
              onClick={() => startCall('video', activeGroup.name, activeGroup.avatar || '/logo.png')}
              className="flex-1 bg-[#6366F1] hover:bg-[#5457E5] py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow"
            >
              <Video className="w-3.5 h-3.5" /> Video
            </button>
          </div>

          {/* ADMIN: Direct Add Member Input */}
          {isAdminOfActiveGroup && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#7A8396] block mb-1.5">
                Add Member
              </label>
              <form onSubmit={handleAdminAddMember} className="flex gap-1.5">
                <input
                  type="text"
                  value={adminAddMemberInput}
                  onChange={(e) => setAdminAddMemberInput(e.target.value)}
                  placeholder="Username to add..."
                  className="flex-1 bg-[#131722] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#5A6376] outline-none"
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

          {/* Members List with Click to View Profile */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A8396] mb-2.5">
              <span>Members ({activeGroup.members?.length || 0})</span>
            </div>
            <div className="space-y-1.5">
              {(activeGroup.members || []).map((mName, idx) => {
                const isCreator = activeGroup.created_by?.toLowerCase() === mName.toLowerCase();
                const isCurrent = user.name && user.name.toLowerCase() === mName.toLowerCase();
                const memberAvatar = AVATAR_OPTIONS[idx % AVATAR_OPTIONS.length];
                return (
                  <button
                    key={mName}
                    onClick={() =>
                      setViewingProfile({
                        name: mName,
                        avatar: memberAvatar,
                        bio: isCreator ? 'Squad Admin & Creator' : 'Squad Member',
                        status: 'online',
                      })
                    }
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-[#141824] border border-[#232B3E] hover:border-white/20 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F5F6F8] p-0.5 shrink-0 border border-white/5">
                      <img
                        src={memberAvatar}
                        alt={mName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {mName} {isCurrent && '(You)'}
                      </p>
                      <p className="text-[10px] text-[#7A8396]">
                        {isCreator ? 'Admin 👑' : 'Member'}
                      </p>
                    </div>
                    {isCreator && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B]">
                        Admin
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shared Assets */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#7A8396] mb-2">
              <span>Shared Files</span>
              <span>{sharedMedia.length}</span>
            </div>

            <div className="flex gap-1 bg-[#131722] p-1 rounded-xl mb-3 border border-[#232B3E]">
              <button
                onClick={() => setInfoMediaTab('media')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  infoMediaTab === 'media' ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                }`}
              >
                Media & GIFs
              </button>
              <button
                onClick={() => setInfoMediaTab('links')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  infoMediaTab === 'links' ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
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
                      className="aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/5 relative group cursor-pointer"
                      onClick={() => triggerToast(`Opened media by ${m.sender_name}`)}
                    >
                      <img
                        src={m.media_url}
                        alt="Shared"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/80 px-1 rounded uppercase text-white">
                        {m.msg_type}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="col-span-3 text-xs text-[#7A8396] text-center py-4">No media shared yet</p>
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
                      className="flex items-center gap-2 p-2 rounded-xl bg-[#141824] border border-[#232B3E] hover:border-[#6366F1] transition-all text-xs"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-[#818CF8] shrink-0" />
                      <div className="flex-1 truncate">
                        <p className="text-white font-medium truncate">{l.url}</p>
                        <p className="text-[10px] text-[#7A8396]">Shared by {l.sender}</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-[#7A8396] text-center py-4">No links shared yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

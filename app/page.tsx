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
  Settings,
  Hash,
  Ghost,
  Flame,
  Music,
  Bot,
  Radio,
  Disc,
  AtSign,
  Copy,
} from 'lucide-react';
import { supabase, isSupabaseConfigured, Group, Message } from '@/lib/supabase';
import { STICKERS, AVATAR_OPTIONS, FALLBACK_GIFS, EMOJI_CATEGORIES } from '@/lib/data';
import AvatarCreatorModal from '@/components/AvatarCreatorModal';
import TelegramMusicPlayer from '@/components/TelegramMusicPlayer';
import MusicBotModal from '@/components/MusicBotModal';
import GhostBurnTimer from '@/components/GhostBurnTimer';
import AddMemberModal from '@/components/AddMemberModal';
import {
  UserProfile,
  SEED_USERS,
  validateUsernameFormat,
  isUsernameAvailable,
} from '@/lib/users';
import { MusicTrack, RoomPlaybackState, CURATED_TRACKS } from '@/lib/musicPlayer';
import {
  AvatarConfig,
  DEFAULT_AVATAR,
  DEFAULT_AVATAR_DATA_URL,
  PRESET_AVATARS,
  renderAvatarSvgString,
  svgToDataUrl,
} from '@/lib/avatarStudio';

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd';
}

const DEFAULT_GROUPS: Group[] = [
  {
    id: 'lmc-squad',
    name: 'LMC Squad',
    description: 'Official squad room for chats, calls & music.',
    avatar: '/logo.png',
    created_by: 'LMC',
    is_private: false,
    members: [],
    join_requests: [],
    created_at: new Date().toISOString(),
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Message[] = [];

export default function Home() {
  // Current user state
  const [user, setUser] = useState<CurrentUser>({
    id: '',
    username: '',
    name: '',
    avatar: DEFAULT_AVATAR_DATA_URL,
    bio: 'Living life • LMC Squad member ⚡',
    status: 'online',
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);
  const [avatarStudioConfig, setAvatarStudioConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileUsernameInput, setProfileUsernameInput] = useState('');
  const [profileBioInput, setProfileBioInput] = useState('');
  const [profileAvatarSelected, setProfileAvatarSelected] = useState(DEFAULT_AVATAR_DATA_URL);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Global Registered Users Directory & Search
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(SEED_USERS);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showUserSearchDropdown, setShowUserSearchDropdown] = useState(false);

  // Real-time username availability validation
  const [usernameAvailability, setUsernameAvailability] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  }>({ checked: false, available: true, message: '' });

  // Ghost Mode (Burn-on-Read: 10s auto self-destruct)
  const [ghostModeActive, setGhostModeActive] = useState(false);

  // Telegram Music Player & Room Bot
  const [showMusicBotModal, setShowMusicBotModal] = useState(false);
  const [roomPlayback, setRoomPlayback] = useState<RoomPlaybackState | null>(null);

  // User Profile Viewer Modal (Visiting other users)
  const [viewingProfile, setViewingProfile] = useState<{
    id?: string;
    username?: string;
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

  // Check Username Uniqueness in Real-Time
  useEffect(() => {
    const raw = profileUsernameInput.trim().toLowerCase().replace(/^@/, '');
    if (!raw) {
      setUsernameAvailability({ checked: false, available: true, message: '' });
      return;
    }
    const check = validateUsernameFormat(raw);
    if (!check.valid) {
      setUsernameAvailability({ checked: true, available: false, message: check.error || 'Invalid format' });
      return;
    }
    const avail = isUsernameAvailable(raw, registeredUsers, user.id);
    if (!avail) {
      setUsernameAvailability({ checked: true, available: false, message: `@${raw} is already taken!` });
    } else {
      setUsernameAvailability({ checked: true, available: true, message: `@${raw} is available!` });
    }
  }, [profileUsernameInput, registeredUsers, user.id]);

  // Load User, Groups, Messages, and Custom Stickers from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Registered Users Directory (Purge any old dummy seed users)
    const FAKE_USER_IDS = ['usr_kai', 'usr_aria', 'usr_zayn', 'usr_rin', 'usr_marcus', 'usr_elena'];
    const FAKE_USERNAMES = ['kai', 'aria', 'zayn', 'rin', 'marcus', 'elena'];
    let allUsers: UserProfile[] = [];
    const storedUsers = localStorage.getItem('lmc_registered_users');
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allUsers = parsed.filter(
            (u: UserProfile) =>
              !FAKE_USER_IDS.includes(u.id) &&
              !FAKE_USERNAMES.includes(u.username?.toLowerCase())
          );
          localStorage.setItem('lmc_registered_users', JSON.stringify(allUsers));
        }
      } catch {}
    }
    setRegisteredUsers(allUsers);

    // 1. Load User Session
    const storedUser = localStorage.getItem('lmc_session');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.name || parsed.username)) {
          const rawUsername =
            parsed.username ||
            parsed.name.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
            `user_${Math.floor(Math.random() * 1000)}`;
          const normalizedUser: CurrentUser = {
            id: parsed.id || `usr_${rawUsername}`,
            username: rawUsername,
            name: parsed.name || rawUsername,
            avatar: parsed.avatar || DEFAULT_AVATAR_DATA_URL,
            bio: parsed.bio || 'Living life • LMC Squad member ⚡',
            status: parsed.status || 'online',
          };
          setUser(normalizedUser);
          setProfileNameInput(normalizedUser.name);
          setProfileUsernameInput(normalizedUser.username);
          setProfileAvatarSelected(normalizedUser.avatar);
          setProfileBioInput(normalizedUser.bio || '');

          if (!allUsers.some((u) => u.username.toLowerCase() === rawUsername.toLowerCase())) {
            const updated = [...allUsers, normalizedUser];
            setRegisteredUsers(updated);
            localStorage.setItem('lmc_registered_users', JSON.stringify(updated));
          }
        } else {
          setShowProfileModal(true);
        }
      } catch {
        setShowProfileModal(true);
      }
    } else {
      setShowProfileModal(true);
    }

    // Load persisted Avatar Studio config
    const storedAvatarConfig = localStorage.getItem('lmc_avatar_config');
    if (storedAvatarConfig) {
      try {
        const parsedConf = JSON.parse(storedAvatarConfig);
        if (parsedConf && parsedConf.skinColor) {
          setAvatarStudioConfig(parsedConf);
        }
      } catch {}
    }

    // 2. Load Persisted Groups & auto-migrate old "LMC Main Lounge" and purge dummy members
    const FAKE_MEMBERS = ['alex', 'sam', 'kira'];
    const storedGroups = localStorage.getItem('lmc_saved_groups');
    if (storedGroups) {
      try {
        const parsedGroups = JSON.parse(storedGroups);
        if (Array.isArray(parsedGroups) && parsedGroups.length > 0) {
          const sanitized = parsedGroups.map((g) => {
            const cleanMembers = (g.members || []).filter(
              (m: string) => !FAKE_MEMBERS.includes(m.toLowerCase())
            );
            if (g.name === 'LMC Main Lounge' || g.id === 'lmc-main-lounge') {
              return {
                ...g,
                id: 'lmc-squad',
                name: 'LMC Squad',
                avatar: '/logo.png',
                description: 'Official squad room for chats, calls & music.',
                members: cleanMembers,
              };
            }
            return { ...g, members: cleanMembers };
          });
          setGroups(sanitized);
          setActiveGroupId(sanitized[0].id);
          localStorage.setItem('lmc_saved_groups', JSON.stringify(sanitized));
        }
      } catch {
        // ignore
      }
    }

    // 3. Load Persisted Messages & auto-migrate, removing dummy messages
    const storedMessages = localStorage.getItem('lmc_saved_messages');
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          const sanitizedMsgs = parsedMessages
            .filter(
              (m) =>
                m.id !== 'init-1' &&
                m.id !== 'init-2' &&
                m.sender_name !== 'Alex' &&
                m.sender_name !== 'Sam'
            )
            .map((m) =>
              m.group_id === 'lmc-main-lounge' ? { ...m, group_id: 'lmc-squad' } : m
            );
          setMessages(sanitizedMsgs);
          localStorage.setItem('lmc_saved_messages', JSON.stringify(sanitizedMsgs));
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
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            setMessages((prev) => {
              const updated = prev.filter((m) => m.id !== deletedId);
              localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
              return updated;
            });
          }
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
      .on('broadcast', { event: 'room_music_sync' }, ({ payload }) => {
        if (payload && payload.track) {
          setRoomPlayback(payload);
        }
      })
      .on('broadcast', { event: 'room_burn_sync' }, ({ payload }) => {
        if (payload && payload.msgId) {
          setMessages((prev) => {
            const updated = prev.filter((m) => m.id !== payload.msgId);
            localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Multi-tab / Local BroadcastChannel Sync for Music & Ghost Mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const bc = new BroadcastChannel('lmc_local_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'music_sync') {
          setRoomPlayback(event.data.payload);
        } else if (event.data?.type === 'burn_sync') {
          const burnId = event.data.msgId;
          setMessages((prev) => prev.filter((m) => m.id !== burnId));
        }
      };
      return () => bc.close();
    } catch {}
  }, []);

  // Load Saved Room Music per channel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMusic = localStorage.getItem(`lmc_active_music_${activeGroupId}`);
    if (savedMusic) {
      try {
        const parsed = JSON.parse(savedMusic);
        if (parsed && parsed.track) {
          setRoomPlayback(parsed);
        }
      } catch {}
    }
  }, [activeGroupId]);

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

  // User Search Matching by @username, user ID or display name
  const matchingUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim().replace(/^@/, '');
    if (!q) return [];
    return registeredUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.id && u.id.toLowerCase().includes(q))
    );
  }, [searchQuery, registeredUsers]);

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

  // Save Profile Handler (with unique username, display name, custom PFP and Bio)
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = profileNameInput.trim();
    const rawUsername = profileUsernameInput.trim().toLowerCase().replace(/^@/, '');

    if (!trimmedName) {
      triggerToast('Please enter your display name');
      return;
    }

    const usernameCheck = validateUsernameFormat(rawUsername);
    if (!usernameCheck.valid) {
      triggerToast(usernameCheck.error || 'Invalid username format');
      return;
    }

    if (!isUsernameAvailable(rawUsername, registeredUsers, user.id)) {
      triggerToast(`@${rawUsername} is already taken! Please choose another.`);
      return;
    }

    const userId = user.id || `usr_${rawUsername}_${Math.random().toString(36).substring(2, 7)}`;
    const updatedUser: CurrentUser = {
      id: userId,
      username: rawUsername,
      name: trimmedName,
      avatar: profileAvatarSelected,
      bio: profileBioInput.trim() || 'LMC Squad member ⚡',
      status: user.status || 'online',
    };

    saveUserSession(updatedUser);

    // Update global registered users directory
    const updatedDirectory = registeredUsers.filter(
      (u) => u.id !== userId && u.username.toLowerCase() !== rawUsername
    );
    updatedDirectory.push(updatedUser);
    setRegisteredUsers(updatedDirectory);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lmc_registered_users', JSON.stringify(updatedDirectory));
      try {
        const bc = new BroadcastChannel('lmc_local_sync');
        bc.postMessage({ type: 'user_registered', payload: updatedUser });
        bc.close();
      } catch {}
    }

    setShowProfileModal(false);

    // Auto-register to public channels
    const updatedGroups = groups.map((g) => {
      const hasMember = (g.members || []).some(
        (m) =>
          m.toLowerCase() === rawUsername ||
          m.toLowerCase() === `@${rawUsername}` ||
          m.toLowerCase() === trimmedName.toLowerCase()
      );
      if (!g.is_private && !hasMember) {
        return { ...g, members: [...(g.members || []), `@${rawUsername}`] };
      }
      return g;
    });
    savePersistedGroups(updatedGroups);

    triggerToast(`Profile saved: @${rawUsername} (${trimmedName})!`);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
  };

  // Add Member to Current Channel Handler
  const handleAddMemberToChannel = useCallback(
    (targetUser: UserProfile) => {
      if (!activeGroup) return;

      const memberTag = `@${targetUser.username.toLowerCase()}`;
      const isAlready = (activeGroup.members || []).some(
        (m) =>
          m.toLowerCase() === memberTag ||
          m.toLowerCase() === targetUser.username.toLowerCase() ||
          m.toLowerCase() === targetUser.name.toLowerCase()
      );

      if (isAlready) {
        triggerToast(`@${targetUser.username} is already in #${activeGroup.name}`);
        return;
      }

      const updatedMembers = [...(activeGroup.members || []), memberTag];
      const updatedGroup = { ...activeGroup, members: updatedMembers };

      setGroups((prev) => {
        const list = prev.map((g) => (g.id === activeGroup.id ? updatedGroup : g));
        if (typeof window !== 'undefined') {
          localStorage.setItem('lmc_saved_groups', JSON.stringify(list));
        }
        return list;
      });

      // Post Announcement Message in Channel
      const announcementMsg: Message = {
        id: `ann-${Date.now()}`,
        group_id: activeGroup.id,
        sender_name: 'LMC Squad System',
        sender_username: 'system',
        sender_avatar: '/logo.png',
        sender_bio: 'Official Squad Concierge',
        content: `🎉 @${targetUser.username} (${targetUser.name}) was added to #${activeGroup.name} by @${user.username || user.name}! Welcome to the squad! 👋`,
        msg_type: 'text',
        reactions: { '🎉': 2, '👋': 1 },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        const list = [...prev, announcementMsg];
        if (typeof window !== 'undefined') {
          localStorage.setItem('lmc_saved_messages', JSON.stringify(list));
        }
        return list;
      });

      if (isSupabaseConfigured && supabase) {
        Promise.resolve(supabase.from('groups').update({ members: updatedMembers }).eq('id', activeGroup.id)).catch(() => {});
        Promise.resolve(supabase.from('messages').insert([announcementMsg])).catch(() => {});
      }

      triggerToast(`Added @${targetUser.username} to #${activeGroup.name}! 🎉`);
      setShowAddMemberModal(false);
    },
    [activeGroup, user, isSupabaseConfigured]
  );

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

  // Snapchat / Bitmoji Avatar Studio Save Handler
  const handleAvatarStudioSave = (dataUrl: string, config: AvatarConfig) => {
    setProfileAvatarSelected(dataUrl);
    setAvatarStudioConfig(config);
    try {
      localStorage.setItem('lmc_avatar_config', JSON.stringify(config));
    } catch {}

    if (user.name) {
      const updatedUser: CurrentUser = {
        ...user,
        avatar: dataUrl,
      };
      saveUserSession(updatedUser);
    }
    setShowAvatarStudio(false);
    triggerToast('Bitmoji Avatar saved & applied!');
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

  // Burn-on-Read Message Deletion Handler (Ghost Mode)
  const handleBurnMessage = useCallback(
    async (msgId: string) => {
      // 1. Remove from React messages state
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== msgId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
        }
        return updated;
      });

      // 2. Broadcast to other tabs & windows
      if (typeof window !== 'undefined') {
        try {
          const bc = new BroadcastChannel('lmc_local_sync');
          bc.postMessage({ type: 'burn_sync', msgId });
          bc.close();
        } catch {}
      }

      // 3. Permanently Delete from Supabase Database
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('messages').delete().eq('id', msgId);
        } catch (err) {
          console.error('Error burning message from Supabase:', err);
        }
      }
    },
    []
  );

  // Telegram Music Sync & Broadcast Handlers
  const broadcastMusicState = useCallback(
    (state: RoomPlaybackState | null) => {
      setRoomPlayback(state);

      if (typeof window !== 'undefined') {
        if (state) {
          localStorage.setItem(`lmc_active_music_${activeGroupId}`, JSON.stringify(state));
        } else {
          localStorage.removeItem(`lmc_active_music_${activeGroupId}`);
        }

        try {
          const bc = new BroadcastChannel('lmc_local_sync');
          bc.postMessage({ type: 'music_sync', payload: state });
          bc.close();
        } catch {}
      }

      // Broadcast via Supabase Realtime channel
      if (isSupabaseConfigured && supabase) {
        try {
          supabase.channel('public:lmc_changes').send({
            type: 'broadcast',
            event: 'room_music_sync',
            payload: state,
          });
        } catch (err) {
          console.warn('Music broadcast notice:', err);
        }
      }
    },
    [activeGroupId]
  );

  const handlePlayTrack = useCallback(
    (track: MusicTrack) => {
      const newState: RoomPlaybackState = {
        groupId: activeGroupId,
        track,
        isPlaying: true,
        currentTime: 0,
        updatedAt: Date.now(),
        requestedBy: user.name || 'Anonymous',
      };
      broadcastMusicState(newState);

      // Post Bot announcement into chat
      const botMsgId = `bot-${Date.now()}`;
      const botMsg: Message = {
        id: botMsgId,
        group_id: activeGroupId,
        sender_name: 'LMC Music Bot 🎵',
        sender_avatar: '/logo.png',
        sender_bio: 'Official Room DJ & Music Bot 🎧',
        content: `Now playing "${track.title}" by ${track.artist} (${track.genre}) for everyone in this room! 🎧`,
        msg_type: 'music_bot',
        media_url: track.coverUrl,
        reactions: { '🎵': 1, '🔥': 1 },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        if (typeof window !== 'undefined') {
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
        }
        return updated;
      });

      if (isSupabaseConfigured && supabase) {
        Promise.resolve(supabase.from('messages').insert([botMsg])).catch(() => {});
      }

      triggerToast(`🎵 Now playing: ${track.title}`);
    },
    [activeGroupId, user.name, broadcastMusicState]
  );

  const handleTogglePlayMusic = useCallback(
    (isPlaying: boolean) => {
      if (!roomPlayback) return;
      const updated: RoomPlaybackState = {
        ...roomPlayback,
        isPlaying,
        updatedAt: Date.now(),
      };
      broadcastMusicState(updated);
    },
    [roomPlayback, broadcastMusicState]
  );

  const handleNextTrack = useCallback(() => {
    if (!roomPlayback) return;
    const currentIdx = CURATED_TRACKS.findIndex((t) => t.id === roomPlayback.track.id);
    const nextIdx = (currentIdx + 1) % CURATED_TRACKS.length;
    handlePlayTrack(CURATED_TRACKS[nextIdx]);
  }, [roomPlayback, handlePlayTrack]);

  const handlePrevTrack = useCallback(() => {
    if (!roomPlayback) return;
    const currentIdx = CURATED_TRACKS.findIndex((t) => t.id === roomPlayback.track.id);
    const prevIdx = (currentIdx - 1 + CURATED_TRACKS.length) % CURATED_TRACKS.length;
    handlePlayTrack(CURATED_TRACKS[prevIdx]);
  }, [roomPlayback, handlePlayTrack]);

  const handleSeekMusic = useCallback(
    (seconds: number) => {
      if (!roomPlayback) return;
      const updated: RoomPlaybackState = {
        ...roomPlayback,
        currentTime: seconds,
        updatedAt: Date.now(),
      };
      broadcastMusicState(updated);
    },
    [roomPlayback, broadcastMusicState]
  );

  const handleClosePlayer = useCallback(() => {
    broadcastMusicState(null);
    triggerToast('Music player closed');
  }, [broadcastMusicState]);

  // SEND MESSAGE (With Strict Deduplication Lock, Ghost Mode & Bot Commands)
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

      const trimmedContent = content.trim();

      // Check for Telegram Music Bot Slash Commands
      if (msg_type === 'text' && trimmedContent.startsWith('/')) {
        const lower = trimmedContent.toLowerCase();
        if (lower.startsWith('/play')) {
          setInputText('');
          const query = lower.replace('/play', '').trim();
          let targetTrack = CURATED_TRACKS[0];
          if (query) {
            const found = CURATED_TRACKS.find(
              (t) =>
                t.title.toLowerCase().includes(query) ||
                t.genre.toLowerCase().includes(query) ||
                t.id.toLowerCase().includes(query)
            );
            if (found) targetTrack = found;
            else if (query.startsWith('http')) {
              targetTrack = {
                id: `cmd-${Date.now()}`,
                title: 'Custom Stream Track',
                artist: 'Online Stream',
                genre: 'Custom Audio',
                coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
                audioUrl: query,
                durationSec: 180,
              };
            }
          }
          handlePlayTrack(targetTrack);
          return;
        }

        if (lower === '/pause') {
          setInputText('');
          handleTogglePlayMusic(false);
          triggerToast('Music paused ⏸️');
          return;
        }

        if (lower === '/resume') {
          setInputText('');
          handleTogglePlayMusic(true);
          triggerToast('Music resumed ▶️');
          return;
        }

        if (lower === '/stop') {
          setInputText('');
          handleClosePlayer();
          return;
        }

        if (lower === '/next' || lower === '/skip') {
          setInputText('');
          handleNextTrack();
          return;
        }

        if (lower === '/music' || lower === '/bot') {
          setInputText('');
          setShowMusicBotModal(true);
          return;
        }
      }

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
        sender_username: user.username,
        sender_avatar: user.avatar || DEFAULT_AVATAR_DATA_URL,
        sender_bio: user.bio,
        content: trimmedContent,
        msg_type,
        media_url,
        reactions: {},
        created_at: new Date().toISOString(),
        burn_after_read: ghostModeActive,
        burn_seconds: ghostModeActive ? 10 : undefined,
      };

      if (ghostModeActive) {
        triggerToast('Ghost message sent! Burns 10s after read 🔥');
      }

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
    [
      user,
      activeGroupId,
      isMemberOfActiveGroup,
      isSending,
      ghostModeActive,
      handlePlayTrack,
      handleTogglePlayMusic,
      handleClosePlayer,
      handleNextTrack,
    ]
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

      {/* USER PROFILE CARD MODAL (When clicking someone's avatar/name/search result) */}
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
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#161C28] p-1 border-2 border-indigo-500/50 shadow-xl">
                <img
                  src={viewingProfile.avatar}
                  alt={viewingProfile.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#22C55E] border-2 border-[#131722]" />
            </div>

            <h3 className="text-lg font-bold text-white">{viewingProfile.name}</h3>
            <p className="text-xs text-[#818CF8] font-mono font-semibold">
              @{viewingProfile.username || viewingProfile.name.toLowerCase().replace(/\s+/g, '')}
            </p>

            {/* Unique User ID Pill with Copy button */}
            <div className="mt-2 mb-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1017] border border-white/5">
              <span className="text-[10px] text-[#7A8396] font-mono">
                ID: {viewingProfile.id || `usr_${(viewingProfile.username || viewingProfile.name).toLowerCase()}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  const idText = viewingProfile.id || `usr_${(viewingProfile.username || viewingProfile.name).toLowerCase()}`;
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(idText);
                    triggerToast(`Copied ID: ${idText} 📋`);
                  }
                }}
                className="text-[#7A8396] hover:text-white p-0.5 rounded transition-colors"
                title="Copy User ID"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-[#0D1017] border border-[#232B3E] rounded-2xl p-3 w-full mb-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A8396] mb-1">About & Bio</p>
              <p className="text-xs text-[#A8B2C7] leading-relaxed">
                {viewingProfile.bio || 'Living life • LMC Squad member ⚡'}
              </p>
            </div>

            {/* Quick Actions: Call & Add to active group */}
            <div className="w-full space-y-2">
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

              {/* Add to Active Channel button */}
              {activeGroup && (
                <button
                  type="button"
                  onClick={() => {
                    const uProfile: UserProfile = {
                      id: viewingProfile.id || `usr_${(viewingProfile.username || viewingProfile.name).toLowerCase()}`,
                      username: viewingProfile.username || viewingProfile.name.toLowerCase().replace(/\s+/g, ''),
                      name: viewingProfile.name,
                      avatar: viewingProfile.avatar,
                      bio: viewingProfile.bio,
                    };
                    handleAddMemberToChannel(uProfile);
                    setViewingProfile(null);
                  }}
                  className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add @{viewingProfile.username || viewingProfile.name} to #{activeGroup.name}</span>
                </button>
              )}
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

            {/* Profile Avatar Selection & Studio */}
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

              {/* Active Avatar Card */}
              <div className="flex items-center gap-3 p-2.5 bg-[#0D1017] rounded-2xl border border-white/5 mb-2.5">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#161C28] p-0.5 border-2 border-[#6366F1] shrink-0 shadow-md">
                  <img src={profileAvatarSelected} alt="Current" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">Active Avatar</p>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#6366F1]/20 text-[#818CF8] font-semibold">
                      Snap Vector
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7A8396] truncate">Pick a preset or build custom below</p>
                </div>
              </div>

              {/* Primary Launch Button for Avatar Studio */}
              <button
                type="button"
                onClick={() => setShowAvatarStudio(true)}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] mb-2.5 group"
              >
                <Sparkles className="w-4 h-4 text-yellow-300 group-hover:rotate-12 transition-transform" />
                <span className="text-xs">Create Custom Avatar (Studio)</span>
              </button>

              {/* Quick Presets Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8396]">Quick Presets</span>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
                      const dataUrl = svgToDataUrl(renderAvatarSvgString(rand.config));
                      setProfileAvatarSelected(dataUrl);
                      setAvatarStudioConfig(rand.config);
                    }}
                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    🎲 Shuffle
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-[#0D1017] rounded-xl border border-white/5">
                  {PRESET_AVATARS.map((p, idx) => {
                    const pDataUrl = svgToDataUrl(renderAvatarSvgString(p.config));
                    const isSelected = profileAvatarSelected === pDataUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setProfileAvatarSelected(pDataUrl);
                          setAvatarStudioConfig(p.config);
                        }}
                        className={`relative aspect-square rounded-full p-0.5 transition-all overflow-hidden bg-[#161C28] border-2 ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105 shadow-md'
                            : 'border-transparent hover:border-white/30 opacity-85 hover:opacity-100'
                        }`}
                        title={p.name + ' - ' + p.tag}
                      >
                        <img src={pDataUrl} alt={p.name} className="w-full h-full object-cover rounded-full" />
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-indigo-600 text-white grid place-items-center text-[7px] shadow">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Display Name input (Can be same for multiple people) */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#A8B2C7]">Display Name</label>
                <span className="text-[10px] text-[#7A8396]">Can be shared with others</span>
              </div>
              <input
                type="text"
                value={profileNameInput}
                onChange={(e) => setProfileNameInput(e.target.value)}
                placeholder="e.g. Koshen Siwanchi"
                className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-[#6366F1] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#5A6376] outline-none"
                required
              />
            </div>

            {/* Unique Username input (Only 1 person can own it) */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#A8B2C7] flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-indigo-400" />
                  <span>Unique Username</span>
                </label>
                <span className="text-[10px] text-amber-400 font-medium">100% Unique</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-400">@</span>
                <input
                  type="text"
                  value={profileUsernameInput}
                  onChange={(e) =>
                    setProfileUsernameInput(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    )
                  }
                  placeholder="username (e.g. koshen)"
                  className={`w-full bg-[#0D1017] border rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white placeholder-[#5A6376] outline-none transition-colors ${
                    profileUsernameInput
                      ? usernameAvailability.available
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : 'border-rose-500/60 focus:border-rose-500'
                      : 'border-[#232B3E] focus:border-[#6366F1]'
                  }`}
                  required
                />
              </div>

              {/* Real-time uniqueness badge */}
              {profileUsernameInput && (
                <p
                  className={`text-[11px] font-semibold flex items-center gap-1 mt-1.5 px-1 ${
                    usernameAvailability.available ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {usernameAvailability.available ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <X className="w-3 h-3 text-rose-400" />
                  )}
                  <span>{usernameAvailability.message}</span>
                </p>
              )}
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
              disabled={!profileUsernameInput || !usernameAvailability.available}
              className={`w-full font-semibold py-3 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                profileUsernameInput && usernameAvailability.available
                  ? 'bg-[#6366F1] hover:bg-[#5457E5] active:scale-[0.98] text-white shadow-[#6366F1]/25'
                  : 'bg-[#1C2230] text-[#5A6376] cursor-not-allowed'
              }`}
            >
              Save Profile & ID <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* SNAPCHAT / BITMOJI AVATAR CREATOR STUDIO MODAL */}
      {showAvatarStudio && (
        <AvatarCreatorModal
          initialConfig={avatarStudioConfig}
          onSave={handleAvatarStudioSave}
          onClose={() => setShowAvatarStudio(false)}
        />
      )}

      {/* TELEGRAM MUSIC BOT & CHANNEL LOUNGE MODAL */}
      {showMusicBotModal && (
        <MusicBotModal
          currentTrackId={roomPlayback?.track.id}
          isPlaying={roomPlayback?.isPlaying}
          onSelectTrack={handlePlayTrack}
          onClose={() => setShowMusicBotModal(false)}
        />
      )}

      {/* ADD MEMBER TO CHANNEL MODAL */}
      {showAddMemberModal && (
        <AddMemberModal
          channelName={activeGroup.name}
          currentMembers={activeGroup.members || []}
          registeredUsers={registeredUsers}
          onAddMember={handleAddMemberToChannel}
          onClose={() => setShowAddMemberModal(false)}
        />
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

      {/* LEFT SIDEBAR (Discord & Linear style professional navigation) */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-40 bg-[#0C0F17] border-r border-[#1B212E] flex flex-col transition-all duration-300 ease-out select-none ${
          railCollapsed ? 'w-[72px] min-w-[72px]' : 'w-[268px] min-w-[268px]'
        } ${mobileRailOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Workspace Brand Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#1A202E] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-transparent shrink-0 ring-1 ring-white/10 shadow-sm">
              <img src="/logo.png" alt="LMC Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            {!railCollapsed && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-[14px] tracking-tight text-white truncate">LMC Chats</span>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-400 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">
                  Squad
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRailCollapsed(!railCollapsed)}
              className="hidden md:grid place-items-center w-7 h-7 rounded-lg text-[#7A8396] hover:text-white hover:bg-white/5 transition-colors"
              title={railCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileRailOpen(false)}
              className="md:hidden grid place-items-center w-7 h-7 rounded-lg text-[#7A8396] hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation & Channel List */}
        <div className="flex-1 overflow-y-auto scroll px-2 py-2.5 space-y-4">
          {/* Public Channels Section */}
          <div>
            {!railCollapsed ? (
              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#7A8396]">
                <span className="flex items-center gap-1.5">Channels</span>
                <button
                  onClick={() => {
                    setNewGroupIsPrivate(false);
                    setShowNewGroupModal(true);
                  }}
                  className="w-5 h-5 rounded hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors"
                  title="Create Public Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-full h-px bg-white/10 my-1" />
            )}

            <div className="space-y-0.5 mt-1">
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
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left relative group ${
                        isActive
                          ? 'bg-[#6366F1]/15 text-white font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-[#6366F1] before:rounded-r'
                          : 'text-[#9DA6B8] hover:bg-white/[0.05] hover:text-white font-medium'
                      }`}
                      title={group.name}
                    >
                      <div className="relative shrink-0">
                        {group.avatar && group.avatar !== '/logo.png' ? (
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-transparent shrink-0">
                            <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-full" />
                          </div>
                        ) : (
                          <Hash
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-[#818CF8]' : 'text-[#7A8396] group-hover:text-white'
                            }`}
                          />
                        )}
                      </div>
                      {!railCollapsed && (
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                          <span className="text-[13px] truncate">{group.name}</span>
                          {group.unreadCount && group.unreadCount > 0 ? (
                            <span className="bg-[#6366F1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                              {group.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Private Rooms Section */}
          <div>
            {!railCollapsed ? (
              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#7A8396]">
                <span className="flex items-center gap-1.5">Private Rooms</span>
                <button
                  onClick={() => {
                    setNewGroupIsPrivate(true);
                    setShowNewGroupModal(true);
                  }}
                  className="w-5 h-5 rounded hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors"
                  title="Create Private Room"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-full h-px bg-white/10 my-1" />
            )}

            <div className="space-y-0.5 mt-1">
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
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left relative group ${
                        isActive
                          ? 'bg-[#6366F1]/15 text-white font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-[#6366F1] before:rounded-r'
                          : 'text-[#9DA6B8] hover:bg-white/[0.05] hover:text-white font-medium'
                      }`}
                      title={group.name}
                    >
                      <Lock
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#F59E0B]' : 'text-[#7A8396] group-hover:text-white'
                        }`}
                      />
                      {!railCollapsed && (
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                          <span className="text-[13px] truncate">{group.name}</span>
                          <span className="text-[9px] text-[#F59E0B] font-semibold bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">
                            Lock
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* User Profile Footer (Discord / Slack style) */}
        <div className="p-2 border-t border-[#1A202E] bg-[#0A0D14]/90 backdrop-blur shrink-0 relative">
          <div className="flex items-center justify-between gap-2 p-1 rounded-xl hover:bg-white/[0.04] transition-colors">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left group"
              title="Click to change status"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#161C28] border border-white/15">
                  <img
                    src={user.avatar || DEFAULT_AVATAR_DATA_URL}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0D14] ${
                    user.status === 'online' ? 'bg-[#22C55E]' : user.status === 'idle' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                  }`}
                />
              </div>
              {!railCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-[#818CF8] transition-colors">
                    {user.name || 'Set your name'}
                  </p>
                  <p className="text-[10px] text-[#7A8396] truncate">
                    {user.status === 'online' ? 'Online' : user.status === 'idle' ? 'Away' : 'Do Not Disturb'}
                  </p>
                </div>
              )}
            </button>

            {!railCollapsed && (
              <button
                onClick={() => {
                  setProfileNameInput(user.name);
                  setProfileBioInput(user.bio || '');
                  setProfileAvatarSelected(user.avatar || DEFAULT_AVATAR_DATA_URL);
                  setShowProfileModal(true);
                }}
                className="w-7 h-7 rounded-lg grid place-items-center text-[#7A8396] hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Edit Profile & Photo"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upwards Discord-style Status Flyout */}
          {showStatusMenu && (
            <div className="absolute bottom-14 left-2 right-2 z-50 bg-[#141824] border border-white/10 rounded-2xl p-2 shadow-2xl animate-msg-in">
              <div className="px-2 py-1.5 border-b border-white/10 mb-1.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-[#161C28] shrink-0 border border-white/10">
                  <img
                    src={user.avatar || DEFAULT_AVATAR_DATA_URL}
                    alt="avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.name || 'User'}</p>
                  <p className="text-[10px] text-[#7A8396] truncate">{user.bio || 'LMC squad member'}</p>
                </div>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    saveUserSession({ ...user, status: 'online' });
                    setShowStatusMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left text-white transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  <span className="flex-1">Online</span>
                  {user.status === 'online' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
                </button>
                <button
                  onClick={() => {
                    saveUserSession({ ...user, status: 'idle' });
                    setShowStatusMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left text-white transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span className="flex-1">Away</span>
                  {user.status === 'idle' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
                </button>
                <button
                  onClick={() => {
                    saveUserSession({ ...user, status: 'dnd' });
                    setShowStatusMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-left text-white transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  <span className="flex-1">Do Not Disturb</span>
                  {user.status === 'dnd' && <Check className="w-3.5 h-3.5 text-[#818CF8]" />}
                </button>
              </div>

              <div className="border-t border-white/10 my-1.5" />

              <button
                onClick={() => {
                  setShowStatusMenu(false);
                  setShowAvatarStudio(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-[#A78BFA] font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Snapchat Avatar Studio</span>
              </button>

              <button
                onClick={() => {
                  setShowStatusMenu(false);
                  setProfileNameInput(user.name);
                  setProfileBioInput(user.bio || '');
                  setProfileAvatarSelected(user.avatar || DEFAULT_AVATAR_DATA_URL);
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-[#818CF8] font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile & Status</span>
              </button>
            </div>
          )}
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
                <div className="w-10 h-10 rounded-full overflow-hidden bg-transparent border border-white/10 shadow-sm">
                  <img src={activeGroup.avatar || '/logo.png'} alt={activeGroup.name} className="w-full h-full object-cover rounded-full" />
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
            {/* Search Input with User @username & Message Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7A8396] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowUserSearchDropdown(true)}
                placeholder="Search @username, ID, messages..."
                className="bg-[#131722] border border-[#232B3E] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#E9ECF4] placeholder-[#5A6376] focus:outline-none focus:border-[#6366F1] w-32 sm:w-52 lg:w-64 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowUserSearchDropdown(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A8396] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Live Search Results Dropdown for @username and User IDs */}
              {showUserSearchDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#141824]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-msg-in">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7A8396] flex items-center justify-between border-b border-white/10 mb-1">
                    <span>User Search (@username / ID)</span>
                    <button
                      type="button"
                      onClick={() => setShowUserSearchDropdown(false)}
                      className="text-white hover:opacity-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto scroll space-y-1">
                    {matchingUsers.length > 0 ? (
                      matchingUsers.map((u) => (
                        <div
                          key={u.id || u.username}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] transition-colors"
                        >
                          <div
                            onClick={() => {
                              setViewingProfile({
                                id: u.id,
                                username: u.username,
                                name: u.name,
                                avatar: u.avatar,
                                bio: u.bio,
                                status: u.status,
                              });
                              setShowUserSearchDropdown(false);
                            }}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                          >
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{u.name}</p>
                              <p className="text-[10px] text-indigo-400 font-mono truncate">@{u.username}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAddMemberToChannel(u);
                              setShowUserSearchDropdown(false);
                            }}
                            className="text-[10px] font-semibold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 px-2 py-1 rounded-lg transition-colors ml-2 shrink-0 flex items-center gap-1"
                            title={`Add @${u.username} to #${activeGroup.name}`}
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-[#7A8396]">
                        No user found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Add Member Button */}
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-9 h-9 rounded-xl grid place-items-center text-[#A8B2C7] hover:text-white hover:bg-white/5 active:scale-90 transition-all"
              title={`Add Members to #${activeGroup.name}`}
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
            </button>

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

            {/* Telegram Music Bot & Room Player Button */}
            <button
              onClick={() => setShowMusicBotModal(true)}
              className="w-9 h-9 rounded-xl grid place-items-center text-[#A8B2C7] hover:text-white hover:bg-white/5 active:scale-90 transition-all relative"
              title="LMC Music Bot & Channel Player"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              {roomPlayback?.isPlaying && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
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

        {/* Telegram-style Pinned Audio Player Bar */}
        {roomPlayback && (
          <TelegramMusicPlayer
            playbackState={roomPlayback}
            currentUserId={user.name}
            onTogglePlay={handleTogglePlayMusic}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
            onSeek={handleSeekMusic}
            onOpenLounge={() => setShowMusicBotModal(true)}
            onClosePlayer={handleClosePlayer}
          />
        )}

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
                    onClick={() => {
                      const matched = registeredUsers.find(
                        (u) =>
                          (msg.sender_username && u.username.toLowerCase() === msg.sender_username.toLowerCase()) ||
                          u.name.toLowerCase() === msg.sender_name.toLowerCase()
                      );
                      setViewingProfile({
                        id: matched?.id || `usr_${msg.sender_name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                        name: msg.sender_name,
                        username: msg.sender_username || matched?.username,
                        avatar: msg.sender_avatar,
                        bio: msg.sender_bio || matched?.bio,
                        status: matched?.status || 'online',
                      });
                    }}
                    className="w-8 h-8 rounded-full overflow-hidden bg-[#161C28] p-0.5 shrink-0 mt-1 border border-white/10 hover:scale-105 transition-transform"
                    title={`View @${msg.sender_username || msg.sender_name}'s profile`}
                  >
                    <img
                      src={msg.sender_avatar}
                      alt={msg.sender_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                )}

                <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <button
                      onClick={() => {
                        const matched = registeredUsers.find(
                          (u) =>
                            (msg.sender_username && u.username.toLowerCase() === msg.sender_username.toLowerCase()) ||
                            u.name.toLowerCase() === msg.sender_name.toLowerCase()
                        );
                        setViewingProfile({
                          id: matched?.id || `usr_${msg.sender_name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                          name: msg.sender_name,
                          username: msg.sender_username || matched?.username,
                          avatar: msg.sender_avatar,
                          bio: msg.sender_bio || matched?.bio,
                          status: matched?.status || 'online',
                        });
                      }}
                      className="flex items-center gap-1.5 mb-1 px-1 hover:underline text-left group"
                    >
                      <span className="text-xs font-bold text-[#DDE2EE] group-hover:text-white">{msg.sender_name}</span>
                      {msg.sender_username && (
                        <span className="text-[11px] text-[#818CF8] font-mono">@{msg.sender_username}</span>
                      )}
                      <time className="text-[10px] text-[#7A8396]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </button>
                  )}

                  {/* Message Content */}
                  {msg.msg_type === 'text' && (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-md select-text ${
                        msg.burn_after_read
                          ? isMe
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border border-amber-400/40 shadow-amber-500/20 rounded-tr-sm'
                            : 'bg-[#18131B] text-[#F3E8FF] border border-amber-500/40 shadow-amber-500/10 rounded-tl-sm'
                          : isMe
                          ? 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white rounded-tr-sm'
                          : 'bg-[#141824] text-[#E9ECF4] border border-[#232B3E] rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                      {msg.burn_after_read && (
                        <GhostBurnTimer
                          messageId={msg.id}
                          totalSeconds={msg.burn_seconds || 10}
                          onBurn={handleBurnMessage}
                        />
                      )}
                    </div>
                  )}

                  {/* Telegram Music Bot Announcement Card */}
                  {msg.msg_type === 'music_bot' && (
                    <div className="p-3 bg-gradient-to-br from-indigo-950/60 via-[#131726] to-[#0E121E] border border-indigo-500/30 rounded-2xl max-w-sm shadow-xl space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
                          <img
                            src={msg.media_url || '/logo.png'}
                            alt="Music Cover"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Disc className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '4s' }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white leading-snug">{msg.content}</p>
                          <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 mt-1">
                            <Bot className="w-3 h-3" /> @LMC Music Bot
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMusicBotModal(true)}
                        className="w-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Music className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Open Music Lounge / Change Song</span>
                      </button>
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

          {/* Ghost Mode Active Banner */}
          {ghostModeActive && (
            <div className="max-w-4xl mx-auto mb-2 px-3 py-1.5 bg-gradient-to-r from-amber-950/70 via-orange-950/50 to-amber-950/70 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-300 font-semibold animate-msg-in shadow-md">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Ghost Mode (Burn-on-Read): Message burns from screen & database 10s after read</span>
              </span>
              <button
                type="button"
                onClick={() => setGhostModeActive(false)}
                className="text-[10px] text-amber-300 hover:text-white px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
              >
                Disable
              </button>
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
              placeholder={
                ghostModeActive
                  ? 'Ghost Mode Active: Type self-destructing message...'
                  : `Message #${activeGroup.name}... (try /play lofi)`
              }
              className="flex-1 bg-transparent border-0 outline-none resize-none px-2 py-1.5 text-sm text-[#E9ECF4] placeholder-[#5A6376] max-h-32 leading-relaxed"
            />

            <div className="flex items-center gap-1 shrink-0">
              {/* Ghost Mode (Burn-on-Read) Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !ghostModeActive;
                  setGhostModeActive(nextState);
                  triggerToast(
                    nextState
                      ? '🔥 Ghost Mode ON: Messages burn 10s after read!'
                      : 'Ghost Mode OFF'
                  );
                }}
                className={`p-2 rounded-xl transition-all ${
                  ghostModeActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-md shadow-amber-500/20 animate-pulse'
                    : 'text-[#A8B2C7] hover:text-white hover:bg-white/5'
                }`}
                title="Burn-on-Read Ghost Mode (Auto self-destruct in 10s)"
              >
                <Flame className={`w-4 h-4 ${ghostModeActive ? 'text-amber-400' : ''}`} />
              </button>

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
                    ? ghostModeActive
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 shadow-amber-500/30'
                      : 'bg-[#6366F1] hover:bg-[#5457E5] active:scale-95 shadow-[#6366F1]/30'
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
            <div className="w-20 h-20 rounded-full overflow-hidden bg-transparent border-2 border-[#6366F1]/40 shadow-lg mb-3">
              <img
                src={activeGroup.avatar || '/logo.png'}
                alt={activeGroup.name}
                className="w-full h-full object-cover rounded-full"
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
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="text-[11px] font-semibold text-[#818CF8] hover:text-white transition-colors flex items-center gap-1 normal-case bg-[#6366F1]/10 hover:bg-[#6366F1]/20 px-2 py-0.5 rounded-lg border border-[#6366F1]/20"
                title="Add member from registered directory"
              >
                + Add Member
              </button>
            </div>
            <div className="space-y-1.5">
              {(activeGroup.members || []).map((mName, idx) => {
                const isCreator = activeGroup.created_by?.toLowerCase() === mName.toLowerCase();
                const isCurrent = user.name && user.name.toLowerCase() === mName.toLowerCase();
                const matchedUser = registeredUsers.find(
                  (u) =>
                    u.name.toLowerCase() === mName.toLowerCase() ||
                    u.username.toLowerCase() === mName.toLowerCase() ||
                    u.id === mName
                );
                const displayName = matchedUser?.name || mName;
                const displayUsername = matchedUser?.username
                  ? `@${matchedUser.username}`
                  : isCurrent && user.username
                  ? `@${user.username}`
                  : null;
                const memberAvatar =
                  isCurrent && user.avatar
                    ? user.avatar
                    : matchedUser?.avatar ||
                      svgToDataUrl(renderAvatarSvgString(PRESET_AVATARS[idx % PRESET_AVATARS.length].config));
                const memberBio = matchedUser?.bio || (isCreator ? 'Squad Admin & Creator' : 'Squad Member');
                const memberId =
                  matchedUser?.id ||
                  (isCurrent ? user.id : `usr_${mName.toLowerCase().replace(/[^a-z0-9]/g, '')}`);

                return (
                  <button
                    key={mName}
                    onClick={() =>
                      setViewingProfile({
                        id: memberId,
                        name: displayName,
                        username: matchedUser?.username || (isCurrent ? user.username : undefined),
                        avatar: memberAvatar,
                        bio: memberBio,
                        status: matchedUser?.status || 'online',
                      })
                    }
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-[#141824] border border-[#232B3E] hover:border-white/20 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F5F6F8] p-0.5 shrink-0 border border-white/5">
                      <img
                        src={memberAvatar}
                        alt={displayName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white truncate">
                          {displayName} {isCurrent && '(You)'}
                        </p>
                      </div>
                      <p className="text-[10px] text-[#7A8396] truncate">
                        {displayUsername ? (
                          <span className="text-[#818CF8] font-mono mr-1">{displayUsername}</span>
                        ) : null}
                        • {isCreator ? 'Admin 👑' : 'Member'}
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

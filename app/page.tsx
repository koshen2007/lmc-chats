'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
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
  Bell,
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
  Palette,
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
  Trash2,
  ArrowLeft,
  Compass,
  Users,
  MoreVertical,
  Reply,
} from 'lucide-react';
import { supabase, isSupabaseConfigured, Group, Message, BannedUser } from '@/lib/supabase';
import { STICKERS, AVATAR_OPTIONS, FALLBACK_GIFS, EMOJI_CATEGORIES } from '@/lib/data';
import AvatarCreatorModal from '@/components/AvatarCreatorModal';
import TelegramMusicPlayer from '@/components/TelegramMusicPlayer';
import MusicBotModal from '@/components/MusicBotModal';
import GhostBurnTimer from '@/components/GhostBurnTimer';
import AddMemberModal from '@/components/AddMemberModal';
import AdminModerationModal from '@/components/AdminModerationModal';
import GoogleAuthModal from '@/components/GoogleAuthModal';
import InstagramSearchModal from '@/components/InstagramSearchModal';
import AuthLoginScreen from '@/components/AuthLoginScreen';
import DiscoverChannelsModal from '@/components/DiscoverChannelsModal';
import UserWelcomeModal from '@/components/UserWelcomeModal';
import VoiceNotePlayer from '@/components/VoiceNotePlayer';
import IncomingCallModal from '@/components/IncomingCallModal';
import WhatsAppChatsList from '@/components/WhatsAppChatsList';
import CreateStoryModal from '@/components/CreateStoryModal';
import StoryViewerModal from '@/components/StoryViewerModal';
import NewChatModal from '@/components/NewChatModal';
import { UserStory } from '@/types/story';
import { fetchServerStories, postNewStory, markStoryAsViewed, getLocalStories } from '@/lib/stories';
import {
  UserProfile,
  SEED_USERS,
  validateUsernameFormat,
  isUsernameAvailable,
  searchUsersInstagramStyle,
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
  role?: 'admin' | 'user';
  provider?: 'google' | 'custom';
  email?: string;
}

const DEFAULT_GROUPS: Group[] = [];

const INITIAL_MESSAGES: Message[] = [];

export default function Home() {
  // Current user state
  const [user, setUser] = useState<CurrentUser>({
    id: '',
    username: '',
    name: '',
    avatar: DEFAULT_AVATAR_DATA_URL,
    bio: '',
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showInstagramSearch, setShowInstagramSearch] = useState(false);
  const [showDiscoverChannels, setShowDiscoverChannels] = useState(false);

  // Global Registered Users Directory & Search
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(SEED_USERS);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showUserSearchDropdown, setShowUserSearchDropdown] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

  // Admin Moderation Panel & Google Auth
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeDmUsernames, setActiveDmUsernames] = useState<string[]>([]);
  // Instagram DM Requests System (pending, accepted, declined)
  const [dmRequests, setDmRequests] = useState<Record<string, {
    initiator: string;
    target: string;
    status: 'pending' | 'accepted' | 'declined';
    updated_at: number;
  }>>({});
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);

  // App Layout
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Groups and Messages with permanent LocalStorage persistence
  const [groups, setGroups] = useState<Group[]>(DEFAULT_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom User Stickers (like WhatsApp)
  const [userStickers, setUserStickers] = useState<string[]>([]);

  // WhatsApp / Telegram Stories & New Chat
  const [stories, setStories] = useState<UserStory[]>([]);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [viewingStory, setViewingStory] = useState<UserStory | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Modals & Drawers
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [newGroupInviteMember, setNewGroupInviteMember] = useState('');
  const [adminAddMemberInput, setAdminAddMemberInput] = useState('');

  // WebRTC Peer-to-Peer Call System (Audio & Video Calling)
  const [activeCall, setActiveCall] = useState<{
    id?: string;
    type: 'audio' | 'video';
    targetName: string;
    targetAvatar: string;
    targetUsername?: string;
    duration: number;
    isMuted: boolean;
    isVideoOff: boolean;
    statusText?: string;
  } | null>(null);

  const [incomingCall, setIncomingCall] = useState<{
    id: string;
    caller: string;
    caller_name: string;
    caller_avatar: string;
    type: 'audio' | 'video';
    offer: any;
  } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Emoji, Sticker & GIF
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emojis' | 'gifs' | 'stickers'>('emojis');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [activeEmojiCat, setActiveEmojiCat] = useState(0);
  const [showTray, setShowTray] = useState(false);
  const [trayTab, setTrayTab] = useState<'gifs' | 'stickers' | 'custom'>('gifs');
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState(FALLBACK_GIFS);
  const [customStickerUrl, setCustomStickerUrl] = useState('');
  const [reactionPopForMsg, setReactionPopForMsg] = useState<string | null>(null);
  const [reactionPopCoords, setReactionPopCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Quoted Message Reply
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

  // 2. Real-time Typing Indicators
  const [activeTypers, setActiveTypers] = useState<Array<{ username: string; name: string }>>([]);
  const lastTypingSentRef = useRef<number>(0);

  // 3. Voice Note Audio Recording
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceRecordingDuration, setVoiceRecordingDuration] = useState(0);
  const voiceMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceAudioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 4. Browser Notifications & Audio Chime
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const lastKnownMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadDoneRef = useRef(false);

  // 5. Real-Time Online Presence & Last Seen Heartbeat
  const [presenceMap, setPresenceMap] = useState<Record<string, {
    is_online: boolean;
    last_seen: number;
    last_seen_text: string;
    name?: string;
    avatar?: string;
  }>>({});
  const [totalOnlineCount, setTotalOnlineCount] = useState<number>(0);

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

  // Web Audio Synth Notification Chime (Zero external audio file dependencies)
  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Two-tone marimba chime (E5 -> C6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

      osc2.frequency.setValueAtTime(329.63, now); // E4

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch {}
  }, []);

  // Request Browser Notification Permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      triggerToast('ℹ️ Notifications are not supported in this browser');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      if (result === 'granted') {
        playNotificationChime();
        triggerToast('🔔 Notifications enabled for incoming messages & voice notes!');
      } else if (result === 'denied') {
        triggerToast('⚠️ Notifications blocked. Please allow in browser settings.');
      }
    } catch {}
  }, [playNotificationChime]);

  // Dispatch Audio Chime and Browser Push Notification
  const notifyIncomingMessage = useCallback(
    (msg: Message) => {
      const myHandle = (user.username || user.name || '').toLowerCase();
      const senderHandle = (msg.sender_username || msg.sender_name || '').toLowerCase();
      if (senderHandle === myHandle) return; // Ignore own sent message

      // 1. Play sound alert
      playNotificationChime();

      // 2. Dispatch desktop/mobile push notification if tab blurred or hidden
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted' && (document.hidden || !document.hasFocus())) {
          try {
            const title = msg.sender_name ? `${msg.sender_name} (@${msg.sender_username || 'user'})` : 'LMC Chats';
            let body = msg.content || '';
            if (msg.msg_type === 'audio') body = '🎙️ Sent a voice note';
            else if (msg.msg_type === 'image') body = '📷 Sent a photo';
            else if (msg.msg_type === 'sticker') body = '✨ Sent a sticker';

            const notif = new Notification(title, {
              body,
              icon: msg.sender_avatar || '/logo.png',
              badge: '/logo.png',
              tag: msg.id,
            });

            notif.onclick = () => {
              window.focus();
              notif.close();
              if (msg.group_id) setActiveGroupId(msg.group_id);
            };
          } catch {}
        }
      }
    },
    [user.username, user.name, playNotificationChime]
  );

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

    // Load Registered Users Directory (Only real registered users)
    const FAKE_USER_IDS = ['usr_harshita', 'usr_koshen', 'usr_kai', 'usr_aria', 'usr_zayn', 'usr_rin', 'usr_marcus', 'usr_elena'];
    const FAKE_USERNAMES = ['harshita', 'koshen', 'kai', 'aria', 'zayn', 'rin', 'marcus', 'elena'];
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
        }
      } catch {}
    }

    // Merge seed users so they are always in directory
    const userMap = new Map<string, UserProfile>();
    for (const su of SEED_USERS) {
      userMap.set(su.username.toLowerCase(), su);
    }
    for (const au of allUsers) {
      if (au && au.username) {
        userMap.set(au.username.toLowerCase(), au);
      }
    }
    const mergedUsers = Array.from(userMap.values());
    allUsers = mergedUsers;
    setRegisteredUsers(allUsers);
    localStorage.setItem('lmc_registered_users', JSON.stringify(allUsers));

    // Also fetch the full directory from server API across all devices
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.users)) {
          setRegisteredUsers((prev) => {
            const map = new Map<string, UserProfile>();
            for (const su of SEED_USERS) if (su?.username) map.set(su.username.toLowerCase(), su);
            for (const u of prev) if (u?.username) map.set(u.username.toLowerCase(), u);
            for (const u of data.users) if (u?.username) map.set(u.username.toLowerCase(), u);
            const combined = Array.from(map.values());
            localStorage.setItem('lmc_registered_users', JSON.stringify(combined));
            return combined;
          });
        }
      })
      .catch(() => {});

    // 1. Load User Session
    const storedUser = localStorage.getItem('lmc_session');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.name || parsed.username)) {
          const rawUsername =
            parsed.username ||
            parsed.name.toLowerCase().replace(/[^a-z0-9_]/g, '');
          const normalizedUser: CurrentUser = {
            id: parsed.id || `usr_${rawUsername}`,
            username: rawUsername,
            name: parsed.name || rawUsername,
            avatar: parsed.avatar || DEFAULT_AVATAR_DATA_URL,
            bio: parsed.bio || '',
            status: parsed.status || 'online',
            provider: parsed.provider || 'custom',
            email: parsed.email,
          };
          setUser(normalizedUser);
          setIsLoggedIn(true);
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
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
    setIsAuthChecking(false);

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

    // 2. Load Persisted Groups & purge dummy mock groups ('lmc-squad', 'lmc-main-lounge', etc.)
    const FAKE_MEMBERS = ['alex', 'sam', 'kira'];
    const storedGroups = localStorage.getItem('lmc_saved_groups');
    if (storedGroups) {
      try {
        const parsedGroups = JSON.parse(storedGroups);
        if (Array.isArray(parsedGroups)) {
          const sanitized = parsedGroups
            .filter(
              (g) =>
                g &&
                g.id !== 'lmc-squad' &&
                g.id !== 'lmc-main-lounge' &&
                g.name !== 'LMC Squad' &&
                g.name !== 'LMC Main Lounge' &&
                !g.name.toLowerCase().includes('gang war') &&
                !g.id.toLowerCase().includes('gang')
            )
            .map((g) => {
              const cleanMembers = (g.members || []).filter(
                (m: string) => !FAKE_MEMBERS.includes(m.toLowerCase())
              );
              return { ...g, members: cleanMembers };
            });
          setGroups(sanitized);
          if (sanitized.length > 0) {
            setActiveGroupId(sanitized[0].id);
          } else {
            setActiveGroupId('');
          }
          localStorage.setItem('lmc_saved_groups', JSON.stringify(sanitized));
        }
      } catch {
        // ignore
      }
    } else {
      setGroups([]);
      setActiveGroupId('');
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
                m.sender_name !== 'Sam' &&
                !m.group_id?.toLowerCase().includes('gang')
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

    // 5. Load Banned Users
    const storedBanned = localStorage.getItem('lmc_banned_users');
    if (storedBanned) {
      try {
        const parsedBanned = JSON.parse(storedBanned);
        if (Array.isArray(parsedBanned)) {
          setBannedUsers(parsedBanned);
        }
      } catch {}
    }

    // 6. Load Active DMs & DM Requests
    const storedDms = localStorage.getItem('lmc_active_dms');
    if (storedDms) {
      try {
        const parsedDms = JSON.parse(storedDms);
        if (Array.isArray(parsedDms)) {
          setActiveDmUsernames(parsedDms);
        }
      } catch {}
    }

    const storedDmRequests = localStorage.getItem('lmc_dm_requests');
    if (storedDmRequests) {
      try {
        const parsed = JSON.parse(storedDmRequests);
        if (parsed && typeof parsed === 'object') {
          setDmRequests(parsed);
        }
      } catch {}
    }

    // 7. Load Stories
    setStories(getLocalStories());
    fetchServerStories().then((list) => {
      if (Array.isArray(list)) setStories(list);
    });

    try {
      const bcStories = new BroadcastChannel('lmc_stories_channel');
      bcStories.onmessage = (event) => {
        if (event.data?.type === 'STORIES_UPDATED' && Array.isArray(event.data.stories)) {
          setStories(event.data.stories);
        }
      };
    } catch {}
  }, []);

  // Real-Time Cross-Device Sync Poller (Phone 1 <-> Phone 2 live updates)
  useEffect(() => {
    if (!isLoggedIn) return;

    let isMounted = true;
    const pollServerUpdates = async () => {
      try {
        // 1. Sync Groups from server API
        const grpRes = await fetch('/api/groups');
        if (grpRes.ok && isMounted) {
          const grpData = await grpRes.json();
          if (grpData.groups && Array.isArray(grpData.groups)) {
            setGroups((prev) => {
              const map = new Map<string, Group>();
              for (const g of grpData.groups) map.set(g.id, g);
              for (const g of prev) if (!map.has(g.id)) map.set(g.id, g);
              return Array.from(map.values());
            });
          }
        }

        // 2. Sync Messages for current channel or DM room
        if (activeGroupId && isMounted) {
          const msgRes = await fetch(`/api/messages?group_id=${encodeURIComponent(activeGroupId)}`);
          if (msgRes.ok && isMounted) {
            const msgData = await msgRes.json();
            if (msgData.messages && Array.isArray(msgData.messages)) {
              // Trigger notification chime / push notification for new incoming messages
              if (isInitialLoadDoneRef.current) {
                for (const m of msgData.messages) {
                  if (!lastKnownMessageIdsRef.current.has(m.id)) {
                    notifyIncomingMessage(m);
                  }
                }
              }
              for (const m of msgData.messages) {
                lastKnownMessageIdsRef.current.add(m.id);
              }
              isInitialLoadDoneRef.current = true;

              setMessages((prev) => {
                const map = new Map<string, Message>();
                // 1. Keep ALL existing local messages (never drop messages if server poll is empty/delayed)
                for (const m of prev) {
                  map.set(m.id, m);
                }
                // 2. Merge server messages (updates read_by, reactions, and incoming cross-device messages)
                for (const m of msgData.messages) {
                  const existing = map.get(m.id);
                  map.set(m.id, existing ? { ...existing, ...m } : m);
                }
                const merged = Array.from(map.values()).sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                if (typeof window !== 'undefined') {
                  localStorage.setItem('lmc_saved_messages', JSON.stringify(merged));
                }
                return merged;
              });

              // Self-heal serverless: If local client has messages for this room that server instance lacks, sync them up
              const serverMsgIds = new Set(msgData.messages.map((m: Message) => m.id));
              const missingOnServer = messages.filter(
                (m) => m.group_id === activeGroupId && !serverMsgIds.has(m.id)
              );
              for (const missing of missingOnServer) {
                fetch('/api/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(missing),
                }).catch(() => {});
              }
            }
          }
        }

        // 2b. Sync Typing status for current room
        if (activeGroupId && isMounted) {
          fetch(`/api/typing?group_id=${encodeURIComponent(activeGroupId)}`)
            .then((res) => res.json())
            .then((tData) => {
              if (tData && Array.isArray(tData.typers) && isMounted) {
                const myHandle = (user.username || user.name || '').toLowerCase();
                const others = tData.typers.filter(
                  (t: { username: string }) => (t.username || '').toLowerCase() !== myHandle
                );
                setActiveTypers(others);
              }
            })
            .catch(() => {});
        }

        // 3. Sync Registered Users
        const usrRes = await fetch('/api/users');
        if (usrRes.ok && isMounted) {
          const usrData = await usrRes.json();
          if (usrData.users && Array.isArray(usrData.users)) {
            setRegisteredUsers(usrData.users);
          }
        }

        // 4. Sync Real-Time Online Presence & Last Seen
        const presRes = await fetch('/api/presence');
        if (presRes.ok && isMounted) {
          const presData = await presRes.json();
          if (presData && presData.presence) {
            setPresenceMap(presData.presence);
            setTotalOnlineCount(presData.online_count || 0);
          }
        }
      } catch {
        // Polling errors ignored
      }
    };

    pollServerUpdates();
    const interval = setInterval(pollServerUpdates, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLoggedIn, activeGroupId, notifyIncomingMessage]);

  // Presence Heartbeat Effect: Pings /api/presence every 15s while active, and on focus/visibility
  useEffect(() => {
    if (!isLoggedIn || !user.username) return;

    const sendHeartbeat = () => {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          name: user.name,
          avatar: user.avatar,
        }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 15000);

    const handleVisibility = () => {
      if (!document.hidden) {
        sendHeartbeat();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isLoggedIn, user.username, user.name, user.avatar]);

  // Reset Document Title on Window Focus
  useEffect(() => {
    const handleFocus = () => {
      if (typeof document !== 'undefined') {
        document.title = 'LMC Chats';
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // WebRTC Incoming Call Listener: Checks for incoming call rings for current user
  useEffect(() => {
    if (!isLoggedIn || !user.username) return;

    const checkIncomingCalls = async () => {
      if (activeCall) return; // Do not interrupt active call
      try {
        const res = await fetch(`/api/calls?user=${encodeURIComponent(user.username)}`);
        const data = await res.json();
        if (data && data.incomingCall) {
          setIncomingCall((prev) => {
            if (prev?.id === data.incomingCall.id) return prev;
            return data.incomingCall;
          });
        }
      } catch {}
    };

    const callPoller = setInterval(checkIncomingCalls, 3000);
    return () => clearInterval(callPoller);
  }, [isLoggedIn, user.username, activeCall]);

  // Auto-mark messages as read in active channel for double blue ticks (read receipts)
  useEffect(() => {
    if (!activeGroupId || !user.username) return;

    const myHandle = user.username.toLowerCase();
    const hasUnread = messages.some(
      (m) => m.group_id === activeGroupId && !(m.read_by || []).some((r) => r.toLowerCase() === myHandle)
    );

    if (hasUnread) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.group_id === activeGroupId) {
            const currentReads = Array.isArray(m.read_by) ? m.read_by : [];
            if (!currentReads.some((r) => r.toLowerCase() === myHandle)) {
              return { ...m, read_by: [...currentReads, user.username!] };
            }
          }
          return m;
        })
      );

      fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          group_id: activeGroupId,
          username: user.username,
        }),
      }).catch(() => {});

      try {
        const channel = new BroadcastChannel('lmc_chat_sync');
        channel.postMessage({
          type: 'MESSAGES_READ',
          payload: { group_id: activeGroupId, username: user.username },
        });
        channel.close();
      } catch {}
    }
  }, [activeGroupId, messages.length, user.username]);

  // BroadcastChannel for instant typing sync across tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('lmc_typing_sync');
    bc.onmessage = (event) => {
      const { group_id, username, name, is_typing } = event.data || {};
      if (group_id !== activeGroupId) return;
      const myHandle = (user.username || user.name || '').toLowerCase();
      if ((username || '').toLowerCase() === myHandle) return;

      setActiveTypers((prev) => {
        if (is_typing) {
          if (prev.some((t) => (t.username || '').toLowerCase() === username.toLowerCase())) return prev;
          return [...prev, { username, name: name || username }];
        } else {
          return prev.filter((t) => (t.username || '').toLowerCase() !== username.toLowerCase());
        }
      });
    };
    return () => bc.close();
  }, [activeGroupId, user.username, user.name]);

  // Deep Linking for ?join=<groupId> and ?user=<username>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const joinGroupId = params.get('join');
    const profileUsername = params.get('user');

    if (joinGroupId) {
      setActiveGroupId(joinGroupId);
      handleJoinGroup(joinGroupId);
    }

    if (profileUsername) {
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.users)) {
            const matched = data.users.find(
              (u: UserProfile) => u.username.toLowerCase() === profileUsername.toLowerCase()
            );
            if (matched) {
              setViewingProfile(matched);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Permanent Storage Sync Handlers
  const saveUserSession = (updated: CurrentUser) => {
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lmc_session', JSON.stringify(updated));
    }
  };

  const handleLoginSuccess = (userData: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    bio?: string;
    provider?: 'google' | 'custom';
    email?: string;
  }) => {
    const fullUser: CurrentUser = {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      avatar: userData.avatar,
      bio: userData.bio || '',
      status: 'online',
      provider: userData.provider || 'custom',
      email: userData.email,
    };
    saveUserSession(fullUser);
    setIsLoggedIn(true);
    setShowProfileModal(false);
    setProfileNameInput(fullUser.name);
    setProfileUsernameInput(fullUser.username);
    setProfileAvatarSelected(fullUser.avatar);
    setProfileBioInput(fullUser.bio || '');

    // Add to global registered users
    const existing = [...registeredUsers];
    if (!existing.some((u) => u.username.toLowerCase() === fullUser.username.toLowerCase())) {
      existing.push(fullUser);
      setRegisteredUsers(existing);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lmc_registered_users', JSON.stringify(existing));
      }
    }

    // Persist to server API
    try {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullUser),
      }).catch(() => {});
    } catch {}

    // Check if user has seen professional welcome onboarding screen
    const welcomedKey = `lmc_welcomed_${fullUser.id}`;
    if (typeof window !== 'undefined' && !localStorage.getItem(welcomedKey)) {
      setShowWelcomeModal(true);
      localStorage.setItem(welcomedKey, 'true');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lmc_session');
    }
    setUser({
      id: '',
      username: '',
      name: '',
      avatar: DEFAULT_AVATAR_DATA_URL,
      bio: '',
      status: 'online',
    });
    setActiveGroupId('');
    setIsLoggedIn(false);
    setShowStatusMenu(false);
    triggerToast('Logged out of LMC Chats. See you soon! 👋');
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

  const saveDmRequests = (updated: Record<string, { initiator: string; target: string; status: 'pending' | 'accepted' | 'declined'; updated_at: number }>) => {
    setDmRequests(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lmc_dm_requests', JSON.stringify(updated));
      try {
        const bc = new BroadcastChannel('lmc_chat_sync');
        bc.postMessage({ type: 'UPDATE_DM_REQUESTS', payload: updated });
        bc.close();
      } catch {}
    }
  };

  // Cross-tab synchronization via BroadcastChannel with strict deduplication
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel('lmc_chat_sync');
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'NEW_MESSAGE') {
        if (!lastKnownMessageIdsRef.current.has(payload.id)) {
          lastKnownMessageIdsRef.current.add(payload.id);
          notifyIncomingMessage(payload);
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          const updated = [...prev, payload];
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'DELETE_MESSAGE') {
        setMessages((prev) => {
          const updated = prev.filter((m) => m.id !== payload.id);
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'CLEAR_MESSAGES') {
        setMessages((prev) => {
          const updated = prev.filter((m) => m.group_id !== payload.group_id);
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'BAN_USER') {
        setBannedUsers((prev) => {
          const updated = [
            ...prev.filter((b) => b.username.toLowerCase() !== payload.username.toLowerCase()),
            payload,
          ];
          localStorage.setItem('lmc_banned_users', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'UNBAN_USER') {
        setBannedUsers((prev) => {
          const updated = prev.filter(
            (b) => b.username.toLowerCase() !== payload.username.toLowerCase()
          );
          localStorage.setItem('lmc_banned_users', JSON.stringify(updated));
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
      } else if (type === 'MESSAGES_READ') {
        setMessages((prev) => {
          const updated = prev.map((m) => {
            if (m.group_id === payload.group_id) {
              const reads = Array.isArray(m.read_by) ? m.read_by : [];
              if (!reads.includes(payload.username)) {
                return { ...m, read_by: [...reads, payload.username] };
              }
            }
            return m;
          });
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
      } else if (type === 'UPDATE_DM_REQUESTS') {
        setDmRequests(payload);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lmc_dm_requests', JSON.stringify(payload));
        }
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
          if (!lastKnownMessageIdsRef.current.has(newMsg.id)) {
            lastKnownMessageIdsRef.current.add(newMsg.id);
            notifyIncomingMessage(newMsg);
          }
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

  // Direct Message (DM) mode detection
  const isDmMode = Boolean(activeGroupId && activeGroupId.startsWith('dm_'));

  // Target user in 1-on-1 Direct Message
  const activeDmOtherUser = useMemo(() => {
    if (!isDmMode) return null;
    const myHandle = (user.username || user.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    const raw = activeGroupId.replace(/^dm_+/, '');

    let otherHandle = '';
    if (raw.includes('__')) {
      const parts = raw.split('__');
      otherHandle = parts.find((p) => p.toLowerCase() !== myHandle) || parts[0];
    } else {
      // Check registered users & activeDmUsernames first
      const known = [...registeredUsers.map((u) => u.username), ...activeDmUsernames].find(
        (handle) => handle && handle.toLowerCase() !== myHandle && raw.toLowerCase().includes(handle.toLowerCase())
      );
      if (known) {
        otherHandle = known;
      } else {
        const parts = raw.split('_');
        otherHandle = parts.find((p) => p.toLowerCase() !== myHandle) || parts[0];
      }
    }

    const found = registeredUsers.find(
      (u) =>
        u.username.toLowerCase() === otherHandle.toLowerCase() ||
        u.name.toLowerCase() === otherHandle.toLowerCase()
    );
    return (
      found || {
        id: `usr_${otherHandle}`,
        username: otherHandle,
        name: otherHandle,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${otherHandle}&backgroundColor=b6e3f4,d1d4f9`,
        bio: '',
        status: 'online' as const,
      }
    );
  }, [isDmMode, activeGroupId, user.username, user.name, registeredUsers, activeDmUsernames]);

  // Active Group Resolution (Works seamlessly for BOTH Groups and 1-on-1 Direct Messages)
  const activeGroup = useMemo(() => {
    if (isDmMode) {
      if (!activeDmOtherUser) return null;
      return {
        id: activeGroupId,
        name: activeDmOtherUser.name || `@${activeDmOtherUser.username}`,
        description: activeDmOtherUser.bio || `Direct 1-on-1 chat with @${activeDmOtherUser.username}`,
        avatar: activeDmOtherUser.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${activeDmOtherUser.username}&backgroundColor=b6e3f4,d1d4f9`,
        created_at: new Date().toISOString(),
        is_private: true,
        members: [user.username || user.name || 'me', activeDmOtherUser.username || activeDmOtherUser.name],
        admins: [user.username || user.name || 'me'],
      } as Group;
    }
    return groups.find((g) => g.id === activeGroupId) || null;
  }, [groups, activeGroupId, isDmMode, activeDmOtherUser, user.username, user.name]);

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

  // In Public groups & DMs, everyone can chat! In Private, only creator or member.
  const isMemberOfActiveGroup = useMemo(() => {
    if (isDmMode) return true;
    if (!activeGroup) return false;
    if (!activeGroup.is_private) return true;
    if (!user.name) return false;
    const isCreator = activeGroup.created_by?.toLowerCase() === user.name.toLowerCase();
    const isMember = (activeGroup.members || []).some((m) => m.toLowerCase() === user.name.toLowerCase());
    return isCreator || isMember;
  }, [isDmMode, activeGroup, user.name]);

  // Direct Message (DM) Launch Handler
  const handleStartDm = useCallback(
    (targetUser: { username?: string; name: string }) => {
      const myHandle = (user.username || user.name || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const theirHandle = (targetUser.username || targetUser.name).toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!myHandle || !theirHandle) return;

      const sorted = [myHandle, theirHandle].sort();
      const dmRoomId = `dm_${sorted[0]}_${sorted[1]}`;

      // Initialize request if not exists
      setDmRequests((prev) => {
        if (!prev[dmRoomId]) {
          const updated = {
            ...prev,
            [dmRoomId]: {
              initiator: myHandle,
              target: theirHandle,
              status: 'pending' as const,
              updated_at: Date.now(),
            },
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('lmc_dm_requests', JSON.stringify(updated));
            try {
              const bc = new BroadcastChannel('lmc_chat_sync');
              bc.postMessage({ type: 'UPDATE_DM_REQUESTS', payload: updated });
              bc.close();
            } catch {}
          }
          return updated;
        }
        return prev;
      });

      setActiveDmUsernames((prev) => {
        if (!prev.includes(theirHandle)) {
          const next = [theirHandle, ...prev];
          if (typeof window !== 'undefined') {
            localStorage.setItem('lmc_active_dms', JSON.stringify(next));
          }
          return next;
        }
        return prev;
      });

      setActiveGroupId(dmRoomId);
      setMobileRailOpen(false);
      triggerToast(`Opened chat with @${theirHandle} 💬`);
    },
    [user.username, user.name]
  );

  const handleAcceptDmRequest = useCallback(
    (dmRoomId: string) => {
      const myH = (user.username || user.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const currentReq = dmRequests[dmRoomId];
      const other = currentReq
        ? currentReq.initiator
        : dmRoomId.replace(/^dm_/, '').split('_').find((p) => p !== myH) || '';

      const updated = {
        ...dmRequests,
        [dmRoomId]: {
          initiator: currentReq?.initiator || other,
          target: myH,
          status: 'accepted' as const,
          updated_at: Date.now(),
        },
      };
      saveDmRequests(updated);

      setActiveDmUsernames((prev) => {
        if (!prev.includes(other)) {
          const next = [other, ...prev];
          if (typeof window !== 'undefined') {
            localStorage.setItem('lmc_active_dms', JSON.stringify(next));
          }
          return next;
        }
        return prev;
      });

      triggerToast(`Accepted message request from @${other}! 💬`);
    },
    [user.username, user.name, dmRequests]
  );

  const handleDeclineDmRequest = useCallback(
    (dmRoomId: string) => {
      const myH = (user.username || user.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const currentReq = dmRequests[dmRoomId];
      const other = currentReq
        ? currentReq.initiator
        : dmRoomId.replace(/^dm_/, '').split('_').find((p) => p !== myH) || '';

      const updated = {
        ...dmRequests,
        [dmRoomId]: {
          initiator: currentReq?.initiator || other,
          target: myH,
          status: 'declined' as const,
          updated_at: Date.now(),
        },
      };
      saveDmRequests(updated);
      setActiveDmUsernames((prev) => prev.filter((u) => u.toLowerCase() !== other.toLowerCase()));
      setActiveGroupId('');
      triggerToast('Declined message request');
    },
    [user.username, user.name, dmRequests]
  );

  const myHandle = (user.username || user.name || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const pendingIncomingRequests = useMemo(() => {
    if (!myHandle) return [];
    return Object.entries(dmRequests)
      .filter(([id, r]) => r && r.target.toLowerCase() === myHandle && r.status === 'pending')
      .map(([id, r]) => ({
        roomId: id,
        senderHandle: r.initiator,
        ...r,
      }));
  }, [dmRequests, myHandle]);

  // Check if user is an official joined member in active channel's member list
  const isJoinedToActiveGroup = useMemo(() => {
    if (isDmMode) return true;
    if (!activeGroup) return false;
    const members = activeGroup.members || [];
    const handle = (user.username || '').toLowerCase();
    const uName = (user.name || '').toLowerCase();
    return members.some((m) => {
      const clean = m.toLowerCase().replace(/^@/, '');
      return clean === handle || clean === uName;
    });
  }, [isDmMode, activeGroup?.members, user.username, user.name]);

  const handleJoinGroup = (groupId: string) => {
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return;
    const handle = user.username || user.name;
    if (!handle) return;
    const members = targetGroup.members || [];
    const alreadyIn = members.some((m) => {
      const clean = m.toLowerCase().replace(/^@/, '');
      return clean === handle.toLowerCase() || clean === user.name.toLowerCase();
    });
    if (!alreadyIn) {
      const updatedMembers = [...members, `@${handle}`];
      const updatedGroups = groups.map((g) => (g.id === groupId ? { ...g, members: updatedMembers } : g));
      savePersistedGroups(updatedGroups);
      try {
        fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join', groupId, memberName: `@${handle}` }),
        }).catch(() => {});
      } catch {}
      triggerToast(`Joined #${targetGroup.name}! 🎉`);
    } else {
      triggerToast(`Switched to #${targetGroup.name}`);
    }
    setActiveGroupId(groupId);
  };

  const isAdminOfActiveGroup = useMemo(() => {
    if (!activeGroup || !user.name) return false;
    const isOwner = activeGroup.created_by?.toLowerCase() === user.name.toLowerCase();
    const isChannelAdmin = (activeGroup.admins || []).some(
      (a) =>
        a.toLowerCase() === user.name.toLowerCase() ||
        (user.username && a.toLowerCase() === user.username.toLowerCase())
    );
    const isSuperAdmin = user.role === 'admin';
    const isDefaultLmcAdmin =
      activeGroup.id === 'lmc-squad' &&
      (!activeGroup.created_by || activeGroup.created_by === 'LMC' || isOwner || isChannelAdmin);
    return isOwner || isChannelAdmin || isSuperAdmin || isDefaultLmcAdmin;
  }, [activeGroup, user.name, user.username, user.role]);

  const isCurrentUserBanned = useMemo(() => {
    return bannedUsers.some((b) => {
      const matchUsername = user.username && b.username.toLowerCase() === user.username.toLowerCase();
      const matchName = user.name && b.username.toLowerCase() === user.name.toLowerCase();
      const matchChannel = !b.channel_id || b.channel_id === activeGroupId;
      return (matchUsername || matchName) && matchChannel;
    });
  }, [bannedUsers, user.username, user.name, activeGroupId]);

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

  // User Search Matching by @username, user ID or display name (Instagram Ranked Search)
  const matchingUsers = useMemo(() => {
    return searchUsersInstagramStyle(searchQuery, registeredUsers);
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
      bio: profileBioInput.trim(),
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

      // Server API sync for cross-device support
      try {
        fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_member',
            groupId: activeGroup.id,
            memberName: memberTag,
          }),
        }).catch(() => {});
        fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(announcementMsg),
        }).catch(() => {});
      } catch {}

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

      // 3. Delete from central server API for cross-device burn sync
      try {
        fetch(`/api/messages?id=${encodeURIComponent(msgId)}`, {
          method: 'DELETE',
        }).catch(() => {});
      } catch {}

      // 4. Permanently Delete from Supabase Database
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

  // Canvas Image Compressor (Downscales high-res photos to prevent storage overflow)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Real-time Typing notification throttled
  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeGroupId || !user.username) return;
      const now = Date.now();
      if (isTyping && now - lastTypingSentRef.current < 1500) return;
      lastTypingSentRef.current = now;

      fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: activeGroupId,
          username: user.username,
          name: user.name,
          is_typing: isTyping,
        }),
      }).catch(() => {});

      try {
        const bc = new BroadcastChannel('lmc_typing_sync');
        bc.postMessage({
          group_id: activeGroupId,
          username: user.username,
          name: user.name,
          is_typing: isTyping,
        });
        bc.close();
      } catch {}
    },
    [activeGroupId, user.username, user.name]
  );

  // SEND MESSAGE (With Strict Deduplication Lock, Ghost Mode, Quoted Reply & Bot Commands)
  const handleSendMessage = useCallback(
    async (
      content: string,
      msg_type: 'text' | 'sticker' | 'gif' | 'image' | 'audio' = 'text',
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
      if (isCurrentUserBanned) {
        triggerToast('🚫 You are banned from sending messages in this channel');
        return;
      }
      if (activeGroup?.is_read_only && !isAdminOfActiveGroup) {
        triggerToast('🔒 Channel is in Admin Read-Only mode');
        return;
      }
      // Slow Mode Protection (Anti-Spam)
      if (activeGroup?.slow_mode && !isAdminOfActiveGroup) {
        const lastSent = Number(sessionStorage.getItem(`slow_mode_${activeGroupId}`) || 0);
        const elapsed = (Date.now() - lastSent) / 1000;
        if (elapsed < 5) {
          triggerToast(`⏳ Slow mode is active. Please wait ${Math.ceil(5 - elapsed)}s.`);
          return;
        }
        sessionStorage.setItem(`slow_mode_${activeGroupId}`, Date.now().toString());
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
        read_by: [user.username || user.name],
        reply_to: replyingToMessage
          ? {
              id: replyingToMessage.id,
              sender_name: replyingToMessage.sender_name,
              sender_username: replyingToMessage.sender_username,
              content: replyingToMessage.content,
              msg_type: replyingToMessage.msg_type,
              media_url: replyingToMessage.media_url,
            }
          : null,
      };

      setReplyingToMessage(null);
      notifyTyping(false);

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

      // Central Server API sync with rate-limit and spam protection handling
      try {
        fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMsg),
        })
          .then(async (res) => {
            if (res.status === 429) {
              const data = await res.json().catch(() => ({}));
              triggerToast(data.error || '⚠️ Too many messages. Please slow down.');
            }
          })
          .catch(() => {});
      } catch {}

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
      replyingToMessage,
      notifyTyping,
    ]
  );

  // Story / Status Action Handlers
  const handlePublishStory = useCallback(
    async (storyPayload: Partial<UserStory>) => {
      const published = await postNewStory(storyPayload);
      if (published) {
        setStories((prev) => [published, ...prev.filter((s) => s.id !== published.id)]);
        triggerToast('Status updated! Disappears after 24 hours ✨');
      }
    },
    [triggerToast]
  );

  const handleSendStoryReply = useCallback(
    (targetHandle: string, storyContent: string, replyText: string) => {
      const targetUser = registeredUsers.find(
        (u) => u.username.toLowerCase() === targetHandle.toLowerCase()
      ) || { name: targetHandle, username: targetHandle };

      handleStartDm(targetUser);

      // Send formatted direct reply
      setTimeout(() => {
        handleSendMessage(
          `💬 *Replying to status:* "${storyContent.slice(0, 45)}${storyContent.length > 45 ? '...' : ''}"\n\n${replyText}`
        );
        triggerToast(`Sent status reply to @${targetHandle}! 🚀`);
      }, 200);
    },
    [registeredUsers, handleStartDm, handleSendMessage, triggerToast]
  );

  const handleMarkStoryViewed = useCallback(
    (storyId: string) => {
      const myU = user.username || user.name || 'user';
      markStoryAsViewed(storyId, myU);
      setStories((prev) =>
        prev.map((s) => {
          if (s.id === storyId && !s.views.includes(myU.toLowerCase())) {
            return { ...s, views: [...s.views, myU.toLowerCase()] };
          }
          return s;
        })
      );
    },
    [user.username, user.name]
  );

  // Voice Memo / Audio Recording Handlers
  const handleStartVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        triggerToast('Microphone not supported on this device/browser');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceAudioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      voiceMediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          voiceAudioChunksRef.current.push(e.data);
        }
      };

      recorder.start(200);
      setIsVoiceRecording(true);
      setVoiceRecordingDuration(0);

      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      triggerToast('Microphone permission required for voice notes');
    }
  };

  const handleCancelVoiceRecording = () => {
    if (voiceMediaRecorderRef.current) {
      voiceMediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      voiceMediaRecorderRef.current = null;
    }
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    voiceAudioChunksRef.current = [];
    setIsVoiceRecording(false);
    setVoiceRecordingDuration(0);
    triggerToast('Voice note discarded');
  };

  const handleFinishVoiceRecording = () => {
    if (!voiceMediaRecorderRef.current) return;
    const recorder = voiceMediaRecorderRef.current;

    recorder.onstop = () => {
      const audioBlob = new Blob(voiceAudioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        handleSendMessage('', 'audio', base64Audio);
      };
      reader.readAsDataURL(audioBlob);

      recorder.stream.getTracks().forEach((track) => track.stop());
      voiceMediaRecorderRef.current = null;
    };

    recorder.stop();
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    setIsVoiceRecording(false);
    setVoiceRecordingDuration(0);
  };

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

    // Sync reaction update to central server API
    try {
      fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msgId, reactions: newReactions }),
      }).catch(() => {});
    } catch {}

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

    const creatorHandle = user.username || user.name || 'Anonymous';
    const initialMembers = [`@${creatorHandle}`, creatorHandle];
    if (newGroupInviteMember.trim()) {
      newGroupInviteMember
        .split(',')
        .map((m) => m.trim().replace(/^@/, ''))
        .filter(Boolean)
        .forEach((m) => {
          if (!initialMembers.includes(`@${m}`)) initialMembers.push(`@${m}`);
        });
    }

    const newGroup: Group = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newGroupName.trim().replace(/^#/, ''),
      description: newGroupDesc.trim() || (newGroupIsPrivate ? 'Private squad room' : 'Public channel'),
      avatar: '/logo.png',
      created_by: creatorHandle,
      admins: [creatorHandle],
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

    // Sync to shared server API so other devices receive this new channel!
    try {
      fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newGroup }),
      }).catch(() => {});
    } catch {}

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

  // DELETE SINGLE MESSAGE (Admin & Sender)
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== messageId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lmc_saved_messages', JSON.stringify(updated));
        }
        return updated;
      });
      triggerToast('Message deleted');

      if (typeof window !== 'undefined') {
        const channel = new BroadcastChannel('lmc_chat_sync');
        channel.postMessage({ type: 'DELETE_MESSAGE', payload: { id: messageId } });
        channel.close();
      }

      // Delete from central server API for cross-device sync
      try {
        fetch(`/api/messages?id=${encodeURIComponent(messageId)}`, {
          method: 'DELETE',
        }).catch(() => {});
      } catch {}

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('messages').delete().eq('id', messageId);
        } catch (err) {
          console.error('Delete message error:', err);
        }
      }
    },
    []
  );

  // ADMIN: KICK MEMBER
  const handleKickMember = useCallback(
    (target: string) => {
      if (!activeGroup) return;
      const cleanTarget = target.replace(/^@/, '').toLowerCase();
      const updatedMembers = (activeGroup.members || []).filter(
        (m) => m.toLowerCase() !== cleanTarget && m.toLowerCase() !== `@${cleanTarget}`
      );
      const updatedGroup = { ...activeGroup, members: updatedMembers };
      const updatedGroups = groups.map((g) => (g.id === activeGroup.id ? updatedGroup : g));
      savePersistedGroups(updatedGroups);

      handleSendMessage(`🛡️ Admin removed @${cleanTarget} from #${activeGroup.name}`, 'text');
      triggerToast(`Removed @${cleanTarget} from channel`);

      if (typeof window !== 'undefined') {
        const channel = new BroadcastChannel('lmc_chat_sync');
        channel.postMessage({ type: 'UPDATE_GROUP', payload: updatedGroup });
        channel.close();
      }
    },
    [activeGroup, groups, handleSendMessage]
  );

  // ADMIN: BAN USER
  const handleBanUser = useCallback(
    (target: string, reason: string = 'Rule violation') => {
      if (!activeGroup) return;
      const cleanTarget = target.replace(/^@/, '').toLowerCase();
      const newBan: BannedUser = {
        id: `ban_${Date.now()}`,
        username: cleanTarget,
        banned_at: new Date().toISOString(),
        banned_by: user.username || user.name || 'Admin',
        reason,
        channel_id: activeGroup.id,
      };

      const updatedBans = [...bannedUsers.filter((b) => b.username.toLowerCase() !== cleanTarget), newBan];
      setBannedUsers(updatedBans);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lmc_banned_users', JSON.stringify(updatedBans));
        const channel = new BroadcastChannel('lmc_chat_sync');
        channel.postMessage({ type: 'BAN_USER', payload: newBan });
        channel.close();
      }

      // Kick them from the channel as well
      const updatedMembers = (activeGroup.members || []).filter(
        (m) => m.toLowerCase() !== cleanTarget && m.toLowerCase() !== `@${cleanTarget}`
      );
      const updatedGroup = { ...activeGroup, members: updatedMembers };
      savePersistedGroups(groups.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));

      handleSendMessage(`🚫 Admin banned @${cleanTarget} (${reason})`, 'text');
      triggerToast(`Banned @${cleanTarget}`);
    },
    [activeGroup, bannedUsers, user, groups, handleSendMessage]
  );

  // ADMIN: UNBAN USER
  const handleUnbanUser = useCallback(
    (target: string) => {
      const cleanTarget = target.replace(/^@/, '').toLowerCase();
      const updatedBans = bannedUsers.filter((b) => b.username.toLowerCase() !== cleanTarget);
      setBannedUsers(updatedBans);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lmc_banned_users', JSON.stringify(updatedBans));
        const channel = new BroadcastChannel('lmc_chat_sync');
        channel.postMessage({ type: 'UNBAN_USER', payload: { username: cleanTarget } });
        channel.close();
      }
      triggerToast(`Unbanned @${cleanTarget}`);
    },
    [bannedUsers]
  );

  // ADMIN: PROMOTE TO ADMIN
  const handlePromoteAdmin = useCallback(
    (target: string) => {
      if (!activeGroup) return;
      const cleanTarget = target.replace(/^@/, '');
      const admins = [...(activeGroup.admins || [])];
      if (!admins.some((a) => a.toLowerCase() === cleanTarget.toLowerCase())) {
        admins.push(cleanTarget);
      }
      const updatedGroup = { ...activeGroup, admins };
      savePersistedGroups(groups.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));
      triggerToast(`Promoted @${cleanTarget} to Admin`);
    },
    [activeGroup, groups]
  );

  // ADMIN: DEMOTE ADMIN
  const handleDemoteAdmin = useCallback(
    (target: string) => {
      if (!activeGroup) return;
      const cleanTarget = target.replace(/^@/, '').toLowerCase();
      const admins = (activeGroup.admins || []).filter((a) => a.toLowerCase() !== cleanTarget);
      const updatedGroup = { ...activeGroup, admins };
      savePersistedGroups(groups.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));
      triggerToast(`Demoted @${cleanTarget}`);
    },
    [activeGroup, groups]
  );

  // ADMIN: CLEAR ALL CHANNEL MESSAGES
  const handleClearChannelMessages = useCallback(() => {
    if (!activeGroup) return;
    setMessages((prev) => {
      const remaining = prev.filter((m) => m.group_id !== activeGroupId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lmc_saved_messages', JSON.stringify(remaining));
      }
      return remaining;
    });
    triggerToast(`Cleared all messages in #${activeGroup.name}`);

    if (typeof window !== 'undefined') {
      const channel = new BroadcastChannel('lmc_chat_sync');
      channel.postMessage({ type: 'CLEAR_MESSAGES', payload: { group_id: activeGroupId } });
      channel.close();
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('messages').delete().eq('group_id', activeGroupId).then(() => {});
    }
  }, [activeGroupId, activeGroup]);

  // ADMIN: TOGGLE READ ONLY
  const handleToggleReadOnly = useCallback(
    (enabled: boolean) => {
      if (!activeGroup) return;
      const updatedGroup = { ...activeGroup, is_read_only: enabled };
      savePersistedGroups(groups.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));
      triggerToast(enabled ? 'Channel locked (Read-Only)' : 'Channel unlocked');
    },
    [activeGroup, groups]
  );

  // ADMIN: TOGGLE SLOW MODE
  const handleToggleSlowMode = useCallback(
    (enabled: boolean) => {
      if (!activeGroup) return;
      const updatedGroup = { ...activeGroup, slow_mode: enabled };
      savePersistedGroups(groups.map((g) => (g.id === activeGroup.id ? updatedGroup : g)));
      triggerToast(enabled ? 'Slow mode enabled (10s)' : 'Slow mode disabled');
    },
    [activeGroup, groups]
  );

  // ADMIN: DELETE CHANNEL (Permanent delete with cross-device & server sync)
  const handleDeleteChannel = useCallback(() => {
    if (!activeGroup) return;
    const deletedGroupId = activeGroup.id;
    const deletedGroupName = activeGroup.name;

    // 1. Update local groups
    const updatedGroups = groups.filter((g) => g.id !== deletedGroupId);
    savePersistedGroups(updatedGroups);

    // 2. Remove deleted channel messages from local memory
    setMessages((prev) => {
      const remaining = prev.filter((m) => m.group_id !== deletedGroupId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lmc_saved_messages', JSON.stringify(remaining));
      }
      return remaining;
    });

    // 3. Switch active group to the next public channel or first available
    const nextGroup = updatedGroups.find((g) => !g.id.startsWith('dm_')) || updatedGroups[0];
    setActiveGroupId(nextGroup?.id || '');
    setInfoOpen(false);
    triggerToast(`Deleted #${deletedGroupName} 🗑️`);

    // 4. Notify Server API for cross-device deletion with security authorization
    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        groupId: deletedGroupId,
        requester: user.username || user.name || 'User',
      }),
    }).catch(() => {});

    // 5. Broadcast to other tabs
    if (typeof window !== 'undefined') {
      try {
        const bc = new BroadcastChannel('lmc_chat_sync');
        bc.postMessage({ type: 'CLEAR_MESSAGES', payload: { group_id: deletedGroupId } });
        bc.close();
      } catch {}
    }
  }, [activeGroup, groups]);

  // GOOGLE AUTH SUCCESS HANDLER
  const handleGoogleAuthSuccess = (googleUser: {
    name: string;
    email: string;
    avatar: string;
    username: string;
  }) => {
    const updatedUser: CurrentUser = {
      id: `usr_${googleUser.username}`,
      username: googleUser.username,
      name: googleUser.name,
      avatar: googleUser.avatar,
      bio: '',
      status: 'online',
      provider: 'google',
      email: googleUser.email,
      role: 'admin',
    };

    saveUserSession(updatedUser);

    const updatedDir = registeredUsers.filter(
      (u) => u.username.toLowerCase() !== googleUser.username && u.id !== updatedUser.id
    );
    updatedDir.push({
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      status: 'online',
      provider: 'google',
      email: googleUser.email,
      role: 'admin',
    });
    setRegisteredUsers(updatedDir);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lmc_registered_users', JSON.stringify(updatedDir));
    }

    setShowProfileModal(false);
    setShowGoogleAuthModal(false);
    triggerToast(`Signed in as ${googleUser.name} with Google! 🎉`);
  };

  // WebRTC Peer-to-Peer Calling Engine
  const startCall = async (
    type: 'audio' | 'video',
    targetName: string,
    targetAvatar: string,
    targetUsernameOverride?: string
  ) => {
    // Determine target handle
    let targetUsername = targetUsernameOverride || '';
    if (!targetUsername && activeGroupId.startsWith('dm_')) {
      targetUsername =
        activeGroupId
          .replace('dm_', '')
          .split('_')
          .find((u) => u.toLowerCase() !== (user.username || user.name || '').toLowerCase()) || '';
    }
    if (!targetUsername && viewingProfile?.username) {
      targetUsername = viewingProfile.username;
    }

    const initialCallState = {
      type,
      targetName,
      targetAvatar,
      targetUsername,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      statusText: 'Ringing receiver...',
    };
    setActiveCall(initialCallState);

    // Live duration counter
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    callIntervalRef.current = setInterval(() => {
      setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
    }, 1000);

    // Synthesize gentle telephone ringing
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

        setTimeout(() => {
          try {
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
            setTimeout(() => ctx.close(), 600);
          } catch {}
        }, 3500);
      }
    } catch {}

    // Initialize WebRTC
    try {
      const isVideo = type === 'video';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      videoStreamRef.current = stream;

      if (localVideoRef.current && isVideo) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          if (isVideo && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Signal initiate call
      const initRes = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          caller: user.username,
          caller_name: user.name,
          caller_avatar: user.avatar,
          receiver: targetUsername,
          type,
          offer,
        }),
      });

      const initData = await initRes.json();
      if (!initData.success || !initData.callId) {
        triggerToast('Failed to initiate call');
        return;
      }

      const callId = initData.callId;
      setActiveCall((prev) => (prev ? { ...prev, id: callId } : null));

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'ice_candidate',
              call_id: callId,
              candidate: event.candidate,
              is_caller: true,
            }),
          }).catch(() => {});
        }
      };

      // Poll call status until accepted or rejected
      if (callPollIntervalRef.current) clearInterval(callPollIntervalRef.current);
      callPollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/calls?call_id=${callId}`);
          const json = await res.json();
          if (json && json.call) {
            if (json.call.status === 'accepted' && json.call.answer) {
              if (callPollIntervalRef.current) clearInterval(callPollIntervalRef.current);
              if (pc.signalingState !== 'stable') {
                await pc.setRemoteDescription(new RTCSessionDescription(json.call.answer));
              }
              setActiveCall((prev) => (prev ? { ...prev, statusText: 'Connected (Live)' } : null));
              triggerToast('Call connected! 🎙️');
            } else if (json.call.status === 'rejected') {
              if (callPollIntervalRef.current) clearInterval(callPollIntervalRef.current);
              endCall();
              triggerToast('Call was declined');
            } else if (json.call.status === 'ended') {
              if (callPollIntervalRef.current) clearInterval(callPollIntervalRef.current);
              endCall();
            }
          }
        } catch {}
      }, 1500);
    } catch (err) {
      console.warn('Call setup notice:', err);
      triggerToast('Audio/Video permission required for calling');
    }
  };

  // Accept incoming call (Receiver side)
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    const callToAccept = incomingCall;
    setIncomingCall(null);

    const isVideo = callToAccept.type === 'video';
    setActiveCall({
      id: callToAccept.id,
      type: callToAccept.type,
      targetName: callToAccept.caller_name,
      targetAvatar: callToAccept.caller_avatar,
      targetUsername: callToAccept.caller,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      statusText: 'Connecting...',
    });

    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    callIntervalRef.current = setInterval(() => {
      setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      videoStreamRef.current = stream;

      if (localVideoRef.current && isVideo) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          if (isVideo && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'ice_candidate',
              call_id: callToAccept.id,
              candidate: event.candidate,
              is_caller: false,
            }),
          }).catch(() => {});
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(callToAccept.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          call_id: callToAccept.id,
          answer,
        }),
      });

      setActiveCall((prev) => (prev ? { ...prev, statusText: 'Connected (Live)' } : null));
      triggerToast('Call connected! 🎙️');
    } catch (err) {
      console.warn('Accept call error:', err);
      triggerToast('Microphone/Camera permission required');
      endCall();
    }
  };

  // Decline incoming call
  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', call_id: incomingCall.id }),
    }).catch(() => {});
    setIncomingCall(null);
    triggerToast('Call declined');
  };

  const endCall = () => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
      callIntervalRef.current = null;
    }
    if (callPollIntervalRef.current) {
      clearInterval(callPollIntervalRef.current);
      callPollIntervalRef.current = null;
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
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (activeCall?.id) {
      fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', call_id: activeCall.id }),
      }).catch(() => {});
    }

    // Log call duration in chat if active
    if (activeCall && activeCall.duration > 0 && activeGroupId) {
      const minutes = Math.floor(activeCall.duration / 60);
      const seconds = activeCall.duration % 60;
      const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      const callIcon = activeCall.type === 'video' ? '📹' : '📞';

      const callLogMsg: Message = {
        id: `msg_call_${Date.now()}`,
        group_id: activeGroupId,
        sender_name: user.name,
        sender_username: user.username,
        sender_avatar: user.avatar,
        content: `${callIcon} ${activeCall.type === 'video' ? 'Video' : 'Audio'} Call ended • ${durationStr}`,
        msg_type: 'text',
        reactions: {},
        created_at: new Date().toISOString(),
        read_by: [user.username],
      };

      setMessages((prev) => [...prev, callLogMsg]);
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callLogMsg),
      }).catch(() => {});
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

  if (isAuthChecking) {
    return (
      <div className="flex h-screen h-[100dvh] w-full items-center justify-center bg-[#080B11]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-[#7A8396]">Loading LMC Chats...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <AuthLoginScreen
        registeredUsers={registeredUsers}
        onLoginSuccess={handleLoginSuccess}
        triggerToast={triggerToast}
      />
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-[#0B0E17] text-[#E9ECF4] relative font-sans select-text">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] flex items-center gap-2 bg-[#1A2234]/95 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm animate-msg-in">
          <Info className="w-4 h-4 text-[#818CF8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* INCOMING WEBRTC CALL MODAL (Ringing popup for receiver) */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {/* CALL OVERLAY MODAL (Voice & Video Call) */}
      {activeCall && (
        <div className="fixed inset-0 z-[250] bg-[#0A0D14]/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-msg-in">
          {/* Hidden Remote Audio Player */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

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
          <div className="flex flex-col items-center my-auto w-full max-w-md">
            {activeCall.type === 'video' ? (
              <div className="relative w-full aspect-[3/4] max-h-[60vh] rounded-3xl overflow-hidden bg-black border-2 border-white/10 shadow-2xl flex items-center justify-center">
                {/* Remote Video Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Local Video Stream Picture-in-Picture (PiP) */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute top-3 right-3 w-24 h-32 rounded-2xl object-cover border-2 border-white/30 shadow-2xl z-10 ${
                    activeCall.isVideoOff ? 'hidden' : 'block'
                  }`}
                />

                <div className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white z-10 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{activeCall.statusText || 'Live WebRTC HD'}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-[#162044] p-2 border-4 border-[#6366F1]/50 shadow-2xl animate-pulse">
                    <img
                      src={activeCall.targetAvatar}
                      alt={activeCall.targetName}
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <span className="absolute bottom-1 right-2 w-5 h-5 rounded-full bg-[#22C55E] border-2 border-[#0A0D14]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{activeCall.targetName}</h3>
                <p className="text-xs text-[#818CF8] font-semibold flex items-center gap-1">
                  {activeCall.statusText === 'Connected (Live)' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <span>{activeCall.statusText || (activeCall.duration > 0 ? 'Connected' : 'Connecting...')}</span>
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

            {/* Profile Action Buttons: DM & Share Link */}
            <div className="w-full space-y-2 mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const targetUser: UserProfile = {
                    id: viewingProfile.id || `usr_${(viewingProfile.username || viewingProfile.name).toLowerCase()}`,
                    username: viewingProfile.username || viewingProfile.name.toLowerCase().replace(/\s+/g, ''),
                    name: viewingProfile.name,
                    avatar: viewingProfile.avatar,
                    bio: viewingProfile.bio,
                  };
                  handleStartDm(targetUser);
                  setViewingProfile(null);
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Direct Message (DM)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const handle = viewingProfile.username || viewingProfile.name.toLowerCase().replace(/\s+/g, '');
                  if (typeof window !== 'undefined') {
                    const link = `${window.location.origin}/?user=${encodeURIComponent(handle)}`;
                    navigator.clipboard.writeText(link);
                    triggerToast(`Copied @${handle}'s profile link! 📋`);
                  }
                }}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <LinkIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>Share Profile Link</span>
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
            className="w-full max-w-sm bg-[#131722] border border-[#232B3E] rounded-3xl p-5 sm:p-6 shadow-2xl animate-msg-in flex flex-col max-h-[92vh] overflow-y-auto scroll"
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

            {/* Google Sign In One-Tap Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowGoogleAuthModal(true)}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs">Sign in with Google</span>
              </button>

              <div className="flex items-center gap-2 mt-3 mb-1">
                <span className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-[#7A8396] uppercase font-semibold">Or Custom Identity</span>
                <span className="flex-1 h-px bg-white/10" />
              </div>
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
                <Palette className="w-4 h-4 text-indigo-300 group-hover:rotate-12 transition-transform" />
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
                placeholder="Enter your name"
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
                  placeholder="your_handle"
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
      {showAddMemberModal && activeGroup && (
        <AddMemberModal
          channelName={activeGroup.name}
          currentMembers={activeGroup.members || []}
          registeredUsers={registeredUsers}
          onAddMember={handleAddMemberToChannel}
          onClose={() => setShowAddMemberModal(false)}
        />
      )}

      {/* ADMIN MODERATION & BAN PANEL MODAL */}
      {showAdminModal && activeGroup && (
        <AdminModerationModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          channel={activeGroup}
          currentUser={{
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
          }}
          registeredUsers={registeredUsers}
          bannedUsers={bannedUsers}
          onKickMember={handleKickMember}
          onBanUser={handleBanUser}
          onUnbanUser={handleUnbanUser}
          onPromoteAdmin={handlePromoteAdmin}
          onDemoteAdmin={handleDemoteAdmin}
          onClearMessages={handleClearChannelMessages}
          onToggleReadOnly={handleToggleReadOnly}
          onToggleSlowMode={handleToggleSlowMode}
          onDeleteChannel={handleDeleteChannel}
        />
      )}

      {/* GOOGLE SIGN IN MODAL */}
      {showGoogleAuthModal && (
        <GoogleAuthModal
          isOpen={showGoogleAuthModal}
          onClose={() => setShowGoogleAuthModal(false)}
          onSuccess={handleGoogleAuthSuccess}
        />
      )}

      {/* INSTAGRAM SEARCH MODAL */}
      {showInstagramSearch && (
        <InstagramSearchModal
          isOpen={showInstagramSearch}
          onClose={() => setShowInstagramSearch(false)}
          registeredUsers={registeredUsers}
          groups={groups}
          activeGroup={activeGroup}
          currentUserId={user.username || user.id}
          onSelectUser={(u) => {
            setViewingProfile({
              id: u.id,
              username: u.username,
              name: u.name,
              avatar: u.avatar,
              bio: u.bio,
              status: u.status,
            });
          }}
          onAddMemberToChannel={handleAddMemberToChannel}
          onJoinGroup={handleJoinGroup}
          onStartCall={startCall}
          onStartDm={handleStartDm}
          triggerToast={triggerToast}
          onSyncUsers={(serverList) => {
            setRegisteredUsers((prev) => {
              const map = new Map<string, UserProfile>();
              for (const u of prev) if (u?.username) map.set(u.username.toLowerCase(), u);
              for (const u of serverList) if (u?.username) map.set(u.username.toLowerCase(), u);
              const merged = Array.from(map.values());
              if (typeof window !== 'undefined') {
                localStorage.setItem('lmc_registered_users', JSON.stringify(merged));
              }
              return merged;
            });
          }}
        />
      )}

      {/* DISCOVER CHANNELS MODAL */}
      {showDiscoverChannels && (
        <DiscoverChannelsModal
          isOpen={showDiscoverChannels}
          onClose={() => setShowDiscoverChannels(false)}
          groups={groups}
          activeGroupId={activeGroupId}
          currentUserId={user.username || user.name}
          onSelectGroup={(id) => setActiveGroupId(id)}
          onJoinGroup={handleJoinGroup}
          onOpenCreateChannel={() => {
            setNewGroupIsPrivate(false);
            setShowNewGroupModal(true);
          }}
        />
      )}

      {/* CREATE NEW CHANNEL MODAL */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleCreateGroup}
            className="w-full max-w-sm bg-[#131722] border border-[#232B3E] rounded-3xl p-5 sm:p-6 shadow-2xl animate-msg-in max-h-[90vh] overflow-y-auto scroll"
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

      {/* 1. WHATSAPP & TELEGRAM CHAT CONVERSATIONS LIST (Primary screen on mobile when !activeGroupId, Left panel on desktop) */}
      <div
        className={`h-full shrink-0 transition-all select-none relative z-30 ${
          !activeGroupId
            ? 'w-full md:w-[360px] lg:w-[400px]'
            : 'hidden md:block md:w-[360px] lg:w-[400px]'
        }`}
      >
        <WhatsAppChatsList
          currentUser={user}
          activeGroupId={activeGroupId}
          groups={visibleGroups}
          messages={messages}
          activeDmUsernames={activeDmUsernames}
          registeredUsers={registeredUsers}
          presenceMap={presenceMap}
          stories={stories}
          pendingDmRequestsCount={pendingIncomingRequests.length}
          onSelectChat={(groupId) => {
            setActiveGroupId(groupId);
          }}
          onOpenNewChatModal={() => setShowNewChatModal(true)}
          onOpenCreateStory={() => setShowCreateStoryModal(true)}
          onViewStory={(s) => setViewingStory(s)}
          onOpenInstagramSearch={() => setShowInstagramSearch(true)}
          onOpenStatusMenu={() => setShowStatusMenu(!showStatusMenu)}
          onOpenSettingsModal={() => {
            setProfileNameInput(user.name);
            setProfileBioInput(user.bio || '');
            setProfileAvatarSelected(user.avatar || DEFAULT_AVATAR_DATA_URL);
            setShowProfileModal(true);
          }}
          onViewDmRequests={() => {
            if (pendingIncomingRequests.length > 0) {
              setActiveGroupId(pendingIncomingRequests[0].roomId);
            }
          }}
        />

        {/* Upwards / Flyout Status & Profile Menu */}
        {showStatusMenu && (
          <div className="absolute top-16 left-3 z-50 w-64 bg-[#141824] border border-white/10 rounded-2xl p-2 shadow-2xl animate-msg-in">
            <div className="px-2 py-1.5 border-b border-white/10 mb-1.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#161C28] shrink-0 border border-white/10">
                <img
                  src={user.avatar || DEFAULT_AVATAR_DATA_URL}
                  alt="avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name || 'User'}</p>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-[10px] text-indigo-400 font-mono">@{user.username || 'user'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const idText = user.id || `usr_${user.username}`;
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard?.writeText(idText);
                        triggerToast(`Copied your User ID: ${idText} 📋`);
                      }
                    }}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-mono flex items-center gap-1 transition-colors"
                    title="Click to copy your User ID"
                  >
                    <span>ID: {user.id || `usr_${user.username}`}</span>
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                </div>
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
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
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

            <button
              onClick={() => {
                setShowStatusMenu(false);
                setShowGoogleAuthModal(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 text-slate-200 font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{user.provider === 'google' ? 'Switch Google Account' : 'Sign in with Google'}</span>
            </button>

            {isAdminOfActiveGroup && (
              <button
                onClick={() => {
                  setShowStatusMenu(false);
                  setShowAdminModal(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 text-amber-300 font-medium transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin & Ban Panel</span>
              </button>
            )}

            <div className="border-t border-white/10 my-1.5" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-rose-500/15 text-rose-400 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out / Switch Account</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN CONVERSATION COLUMN (WhatsApp Web / Telegram Desktop 2-column or mobile conversation view) */}
      <main
        className={`flex-1 flex flex-col min-w-0 h-full relative bg-[#0B0E17] ${
          !activeGroupId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {!activeGroup ? (
          /* WhatsApp Web / Telegram Desktop Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-[#090C13]">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 via-indigo-500/20 to-purple-500/20 border border-white/10 grid place-items-center shadow-2xl">
                <MessageSquare className="w-10 h-10 text-emerald-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 text-white grid place-items-center text-xs shadow-md">
                ⚡
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">LMC Chats Web</h2>
            <p className="text-xs sm:text-sm text-[#7A8396] max-w-sm mb-6 leading-relaxed">
              Send and receive messages with your squad in real-time. Select a chat from the left or click New Chat to start talking.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInstagramSearch(true)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-white/10 active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Search Squad</span>
              </button>
            </div>
            <div className="mt-12 flex items-center gap-2 text-[11px] text-[#5A6376]">
              <Lock className="w-3.5 h-3.5 text-emerald-400/80" />
              <span>End-to-end encrypted • Real-time Sync • WebRTC Voice & Video</span>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
        <header className="h-16 px-2.5 sm:px-5 flex items-center justify-between border-b border-[#1B212E] bg-[#0B0E17]/95 backdrop-blur-md z-10 shrink-0 relative">
          {mobileSearchOpen ? (
            /* Full-width Mobile Search Bar Overlay */
            <div className="flex-1 flex items-center gap-2 animate-msg-in">
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchQuery('');
                  setShowUserSearchDropdown(false);
                }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white shrink-0 active:scale-95 transition-all"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#7A8396] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowUserSearchDropdown(true)}
                  placeholder="Search @username, ID, messages..."
                  className="w-full bg-[#131722] border border-[#232B3E] focus:border-[#6366F1] rounded-xl pl-9 pr-8 py-2 text-xs text-[#E9ECF4] placeholder-[#5A6376] outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowUserSearchDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8396] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Back Button (ArrowLeft) -> Returns to WhatsApp Chats list! */}
                <button
                  onClick={() => setActiveGroupId('')}
                  className="md:hidden w-9 h-9 rounded-xl grid place-items-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-95 shrink-0"
                  title="Back to Chats"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Clickable Channel Header to view Group Details */}
                <div
                  onClick={() => setInfoOpen(!infoOpen)}
                  className="flex items-center gap-2 sm:gap-2.5 cursor-pointer hover:opacity-85 transition-opacity min-w-0"
                  title="View Channel Details & Members"
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-transparent border border-white/10 shadow-sm">
                      <img src={activeGroup.avatar || '/logo.png'} alt={activeGroup.name} className="w-full h-full object-cover rounded-full" />
                    </div>
                    {activeGroup.is_private && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-black/90 p-0.5 rounded-full text-[#F59E0B]">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xs sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
                      <span>{activeGroup.name}</span>
                      {!isJoinedToActiveGroup && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinGroup(activeGroup.id);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-[10px] shadow-sm flex items-center gap-1 active:scale-95 transition-all shrink-0"
                          title="Join this channel"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Join</span>
                        </button>
                      )}
                    </h1>
                    {activeTypers.length > 0 ? (
                      <p className="text-[10px] sm:text-[11px] text-indigo-400 font-semibold flex items-center gap-1.5 truncate animate-pulse">
                        <span className="flex gap-0.5 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span>
                          {activeTypers.length === 1
                            ? `${activeTypers[0].name} is typing...`
                            : `${activeTypers[0].name} and ${activeTypers.length - 1} other${activeTypers.length > 2 ? 's' : ''} are typing...`}
                        </span>
                      </p>
                    ) : activeGroupId.startsWith('dm_') ? (
                      (() => {
                        const dmPartnerHandle = activeGroupId
                          .replace('dm_', '')
                          .split('_')
                          .find((u) => u.toLowerCase() !== (user.username || user.name || '').toLowerCase());
                        const dmPresence = dmPartnerHandle ? presenceMap[dmPartnerHandle.toLowerCase()] : null;
                        const partner = registeredUsers.find(
                          (u) => u.username.toLowerCase() === (dmPartnerHandle || '').toLowerCase()
                        );
                        const partnerId = partner?.id || (dmPartnerHandle ? `usr_${dmPartnerHandle}` : '');

                        return (
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] truncate">
                            {dmPresence?.is_online ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Online</span>
                              </span>
                            ) : (
                              <span className="text-[#7A8396] flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                <span>{dmPresence?.last_seen_text || 'Offline'}</span>
                              </span>
                            )}
                            {dmPartnerHandle && (
                              <>
                                <span className="text-[#5A6376]">•</span>
                                <span className="text-indigo-400 font-mono font-medium truncate">@{dmPartnerHandle}</span>
                              </>
                            )}
                            {partnerId && (
                              <>
                                <span className="text-[#5A6376]">•</span>
                                <span className="text-[#A8B2C7] font-mono text-[9px] bg-white/5 px-1.5 py-0.2 rounded shrink-0">
                                  ID: {partnerId}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      (() => {
                        const grpMembers = (activeGroup.members || []).map((m: string) => m.toLowerCase());
                        const onlineInGrp = Object.entries(presenceMap).filter(
                          ([h, p]) => p.is_online && grpMembers.includes(h)
                        ).length;
                        return (
                          <p className="text-[10px] sm:text-[11px] text-[#7A8396] flex items-center gap-1.5 truncate">
                            <span>{(activeGroup.members || []).length} members</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              {Math.max(1, onlineInGrp)} online
                            </span>
                          </p>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Right Header Actions - Sleek & Lightweight */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative">
                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => setShowInstagramSearch(true)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl grid place-items-center text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 active:scale-90 transition-all shrink-0"
                  title="Search Users & Channels"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Voice Call Button */}
                <button
                  onClick={() => startCall('audio', activeGroup.name, activeGroup.avatar || '/logo.png')}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl grid place-items-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-90 transition-all shrink-0"
                  title="Start Voice Call"
                >
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22C55E]" />
                </button>

                {/* Channel Info Button */}
                <button
                  onClick={() => setInfoOpen(!infoOpen)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl grid place-items-center transition-all shrink-0 ${
                    infoOpen ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'text-[#A8B2C7] hover:text-white hover:bg-white/5'
                  }`}
                  title="Chat Details & Members"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Unified 3-Dots More Menu (Desktop & Mobile) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMobileHeaderMenuOpen(!mobileHeaderMenuOpen)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl grid place-items-center transition-all shrink-0 ${
                      mobileHeaderMenuOpen ? 'bg-white/10 text-white' : 'text-[#A8B2C7] hover:text-white hover:bg-white/5'
                    }`}
                    title="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* 3-Dots Dropdown */}
                  {mobileHeaderMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/30"
                        onClick={() => setMobileHeaderMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-[#131722]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-msg-in flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileHeaderMenuOpen(false);
                            startCall('video', activeGroup.name, activeGroup.avatar || '/logo.png');
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E9ECF4] hover:bg-white/5 transition-all text-left"
                        >
                          <Video className="w-4 h-4 text-indigo-400" />
                          <span>Start Video Call</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMobileHeaderMenuOpen(false);
                            setShowMusicBotModal(true);
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#E9ECF4] hover:bg-white/5 transition-all text-left"
                        >
                          <span className="flex items-center gap-2.5">
                            <Bot className="w-4 h-4 text-purple-400" />
                            <span>Music Bot & Player</span>
                          </span>
                          {roomPlayback?.isPlaying && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          )}
                        </button>

                        {/* Push Notification Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setMobileHeaderMenuOpen(false);
                            requestNotificationPermission();
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E9ECF4] hover:bg-white/5 transition-all text-left"
                        >
                          {notificationPermission === 'granted' ? (
                            <>
                              <Bell className="w-4 h-4 text-emerald-400" />
                              <span>Sound Alerts: On</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="w-4 h-4 text-[#7A8396]" />
                              <span>Enable Sound Alerts</span>
                            </>
                          )}
                        </button>

                        {!isDmMode && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setMobileHeaderMenuOpen(false);
                                setShowAddMemberModal(true);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E9ECF4] hover:bg-white/5 transition-all text-left"
                            >
                              <UserPlus className="w-4 h-4 text-emerald-400" />
                              <span>Add Members</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMobileHeaderMenuOpen(false);
                                setNewGroupIsPrivate(false);
                                setShowNewGroupModal(true);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E9ECF4] hover:bg-white/5 transition-all text-left"
                            >
                              <Plus className="w-4 h-4 text-indigo-400" />
                              <span>Create New Channel</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMobileHeaderMenuOpen(false);
                                setShowDiscoverChannels(true);
                              }}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E9ECF4] hover:bg-white/5 transition-all text-left"
                            >
                              <Compass className="w-4 h-4 text-purple-400" />
                              <span>Discover Channels</span>
                            </button>
                          </>
                        )}

                        {isAdminOfActiveGroup && (
                          <button
                            type="button"
                            onClick={() => {
                              setMobileHeaderMenuOpen(false);
                              setShowAdminModal(true);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-all text-left border-t border-white/5 mt-1 pt-2"
                          >
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span>Admin Moderation</span>
                          </button>
                        )}

                        {isAdminOfActiveGroup && !isDmMode && (
                          <button
                            type="button"
                            onClick={() => {
                              setMobileHeaderMenuOpen(false);
                              if (window.confirm(`Permanently delete #${activeGroup.name}?`)) {
                                handleDeleteChannel();
                              }
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                            <span>Delete Channel</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Live Search Results Dropdown for @username and User IDs */}
          {showUserSearchDropdown && searchQuery.trim().length > 0 && (
            <div className="absolute left-2.5 right-2.5 sm:left-auto sm:right-4 top-full mt-2 sm:w-80 bg-[#141824]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-msg-in">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7A8396] flex items-center justify-between border-b border-white/10 mb-1">
                <span>User Search (@username / ID)</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserSearchDropdown(false);
                    setMobileSearchOpen(false);
                  }}
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
                          setMobileSearchOpen(false);
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
                          setMobileSearchOpen(false);
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

        {/* Join Channel Banner if user is viewing as guest */}
        {!isJoinedToActiveGroup && (
          <div className="bg-gradient-to-r from-indigo-950/90 via-purple-950/70 to-indigo-950/90 border-b border-indigo-500/30 px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0 animate-msg-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
              <p className="text-xs text-indigo-200 truncate">
                Viewing <span className="font-bold text-white">#{activeGroup.name}</span>. Join to chat & react!
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleJoinGroup(activeGroup.id)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-all shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Join Channel</span>
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto scroll p-3 sm:p-6 space-y-4">
          <div className="flex items-center justify-center my-2">
            <span className="text-[10px] font-semibold text-[#7A8396] bg-white/5 px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          {displayedMessages.map((msg) => {
            const isMe = Boolean(user.name && msg.sender_name.toLowerCase() === user.name.toLowerCase());
            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex gap-2.5 sm:gap-3 group relative animate-msg-in transition-colors rounded-2xl p-1 ${
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

                  {/* Quoted Message Reply Context */}
                  {msg.reply_to && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = document.getElementById(`msg-${msg.reply_to?.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('ring-2', 'ring-indigo-400', 'bg-indigo-500/10');
                          setTimeout(() => {
                            el.classList.remove('ring-2', 'ring-indigo-400', 'bg-indigo-500/10');
                          }, 2000);
                        }
                      }}
                      className={`mb-1 p-2 rounded-xl text-left cursor-pointer border-l-2 transition-all max-w-full shadow-sm ${
                        isMe
                          ? 'bg-indigo-950/70 border-indigo-300 text-white hover:bg-indigo-900/80'
                          : 'bg-[#181E2E] border-indigo-400 text-[#E9ECF4] hover:bg-[#20273B]'
                      }`}
                      title="Click to jump to quoted message"
                    >
                      <p className="text-[10px] font-bold text-indigo-300 truncate flex items-center gap-1">
                        <Reply className="w-2.5 h-2.5" />
                        <span>{msg.reply_to.sender_name}</span>
                      </p>
                      <p className="text-[11px] text-[#A8B2C7] truncate mt-0.5 max-w-xs">
                        {msg.reply_to.content || (msg.reply_to.msg_type === 'audio' ? '🎙️ Voice Note' : msg.reply_to.msg_type === 'image' ? '📷 Photo' : '📎 Attachment')}
                      </p>
                    </div>
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

                      {/* WhatsApp & Telegram Double Ticks + Time */}
                      <div className={`flex items-center gap-1 mt-1 text-[10px] select-none ${isMe ? 'justify-end text-white/70' : 'justify-end text-[#7A8396]'}`}>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (() => {
                          const isDm = activeGroupId.startsWith('dm_');
                          const otherUser = isDm
                            ? activeGroupId.replace('dm_', '').split('_').find((u) => u.toLowerCase() !== (user.username || user.name || '').toLowerCase())
                            : null;
                          const isSeen = otherUser
                            ? (msg.read_by || []).some((r) => r.toLowerCase() === otherUser.toLowerCase())
                            : (msg.read_by || []).length > 1;

                          if (isSeen) {
                            return (
                              <span title={isDm ? "Seen" : "Read by members"} className="inline-flex items-center">
                                <CheckCheck className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                              </span>
                            );
                          }
                          return (
                            <span title="Delivered" className="inline-flex items-center">
                              <CheckCheck className="w-3.5 h-3.5 text-white/60 shrink-0" />
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Voice Note Audio Memo */}
                  {msg.msg_type === 'audio' && msg.media_url && (
                    <div className="space-y-1">
                      <VoiceNotePlayer audioUrl={msg.media_url} isMe={isMe} />
                      <div className={`flex items-center gap-1 text-[10px] px-1 select-none ${isMe ? 'justify-end text-[#7A8396]' : 'justify-start text-[#7A8396]'}`}>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (
                          <span title="Delivered" className="inline-flex items-center">
                            <CheckCheck className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                          </span>
                        )}
                      </div>
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
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const screenW = typeof window !== 'undefined' ? window.innerWidth : 360;
                        const screenH = typeof window !== 'undefined' ? window.innerHeight : 640;
                        const popWidth = Math.min(screenW - 16, 296);
                        const pad = 8;
                        // On mobile: center horizontally relative to clicked button, clamped within viewport
                        let left = rect.left - 100;
                        if (screenW < 640) {
                          left = Math.max(pad, Math.min(screenW - popWidth - pad, rect.left + rect.width / 2 - popWidth / 2));
                        } else {
                          left = Math.max(pad, Math.min(screenW - popWidth - pad, left));
                        }
                        // Vertical placement: show above if space permits, else below
                        let top = rect.top - 46;
                        if (top < 65) {
                          top = rect.bottom + 8;
                        }
                        if (top > screenH - 60) {
                          top = Math.max(70, screenH - 70);
                        }
                        setReactionPopCoords({ x: left, y: top });
                        setReactionPopForMsg(reactionPopForMsg === msg.id ? null : msg.id);
                      }}
                      className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 p-1.5 rounded-full text-[#7A8396] hover:text-white transition-all text-xs touch-manipulation active:scale-110"
                      title="Add Reaction"
                    >
                      <SmilePlus className="w-3.5 h-3.5" />
                    </button>

                    {/* Reply to message */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToMessage(msg);
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                        }
                      }}
                      className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 p-1.5 rounded-full text-[#7A8396] hover:text-indigo-400 transition-all text-xs touch-manipulation active:scale-110"
                      title="Reply to message"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {(isAdminOfActiveGroup || isMe) && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 p-1.5 rounded-full text-[#7A8396] hover:text-rose-400 transition-all text-xs touch-manipulation active:scale-110"
                        title={isAdminOfActiveGroup ? "Delete Message (Admin)" : "Delete Message"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Real-time Floating Typing Indicator Bubble */}
          {activeTypers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#141826]/90 border border-indigo-500/30 text-indigo-300 text-xs w-fit shadow-lg animate-msg-in mb-2">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-[11px] font-semibold">
                {activeTypers.length === 1
                  ? `${activeTypers[0].name} is typing...`
                  : `${activeTypers.map((t) => t.name).join(', ')} are typing...`}
              </span>
            </div>
          )}
          <div ref={streamEndRef} />
        </div>

        {/* Reaction Quick Bar Popover */}
        {reactionPopForMsg && (
          <>
            {/* Backdrop to easily dismiss reaction bar on touch or click */}
            <div
              className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
              onClick={() => setReactionPopForMsg(null)}
              onTouchStart={() => setReactionPopForMsg(null)}
            />
            <div
              style={{
                top: `${reactionPopCoords.y}px`,
                left: `${reactionPopCoords.x}px`,
                maxWidth: 'calc(100vw - 16px)',
              }}
              className="fixed z-50 flex items-center gap-1 sm:gap-1.5 bg-[#141824]/95 backdrop-blur-xl border border-white/15 p-1.5 rounded-2xl shadow-2xl animate-pop-in touch-manipulation select-none overflow-x-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {['🔥', '😂', '❤️', '👍', '🎉', '👀', '💯', '🚀'].map((em) => (
                <button
                  key={em}
                  onClick={() => {
                    handleToggleReaction(reactionPopForMsg, em);
                    setReactionPopForMsg(null);
                  }}
                  className="w-8 h-8 shrink-0 rounded-xl hover:bg-white/10 active:bg-white/25 active:scale-125 grid place-items-center text-lg sm:text-base transition-transform select-none touch-manipulation"
                >
                  {em}
                </button>
              ))}
            </div>
          </>
        )}

        {/* COMPOSER DOCK */}
        <div className="p-2 sm:p-4 bg-[#0B0E17] border-t border-[#1B212E] relative pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          {/* Mobile Backdrop for Trays */}
          {showEmojiPicker && (
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
              onClick={() => {
                setShowEmojiPicker(false);
              }}
              onTouchStart={() => {
                setShowEmojiPicker(false);
              }}
            />
          )}

          {/* UNIFIED EMOJI, GIF & STICKER DRAWER */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-3 right-2.5 sm:right-16 left-2.5 sm:left-auto w-[calc(100vw-20px)] sm:w-[380px] max-h-[60vh] bg-[#141824]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3.5 shadow-2xl z-50 animate-msg-in flex flex-col">
              {/* Top Navigation Tabs */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPickerTab('emojis')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      pickerTab === 'emojis' ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                    }`}
                  >
                    Emojis
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('gifs')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      pickerTab === 'gifs' ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                    }`}
                  >
                    GIFs
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('stickers')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      pickerTab === 'stickers' ? 'bg-[#6366F1] text-white shadow' : 'text-[#7A8396] hover:text-white'
                    }`}
                  >
                    Stickers
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. EMOJIS TAB */}
              {pickerTab === 'emojis' && (
                <div className="flex flex-col flex-1 min-h-0">
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

                  {!emojiSearch && (
                    <div className="flex gap-1 pb-2 border-b border-white/10 mb-2 overflow-x-auto scroll">
                      {EMOJI_CATEGORIES.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
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
                        type="button"
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

              {/* 2. GIFS TAB */}
              {pickerTab === 'gifs' && (
                <div className="space-y-2 flex flex-col flex-1 min-h-0">
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
                        type="button"
                        onClick={() => {
                          handleSendMessage('', 'gif', gif.url);
                          setShowEmojiPicker(false);
                        }}
                        className="relative rounded-xl overflow-hidden aspect-video bg-[#0D1017] border border-white/5 hover:border-[#6366F1] hover:scale-[1.02] transition-all"
                      >
                        <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. STICKERS TAB */}
              {pickerTab === 'stickers' && (
                <div className="space-y-3 flex flex-col flex-1 min-h-0">
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

                  <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto scroll pr-1">
                    {STICKERS.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          handleSendMessage('', 'sticker', st.url);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1.5 rounded-2xl bg-black/20 hover:bg-[#6366F1]/20 border border-transparent hover:border-[#6366F1] flex items-center justify-center transition-all hover:scale-110"
                        title={st.name}
                      >
                        <img src={st.url} alt={st.name} className="w-14 h-14 object-contain" />
                      </button>
                    ))}
                    {userStickers.map((stUrl, i) => (
                      <button
                        key={`custom-${i}`}
                        type="button"
                        onClick={() => {
                          handleSendMessage('', 'sticker', stUrl);
                          setShowEmojiPicker(false);
                        }}
                        className="p-1.5 rounded-2xl bg-black/30 hover:bg-[#6366F1]/20 border border-white/5 hover:border-[#6366F1] flex items-center justify-center transition-all hover:scale-110"
                      >
                        <img src={stUrl} alt="Custom Sticker" className="w-14 h-14 object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Banned User Warning Banner */}
          {isCurrentUserBanned && (
            <div className="max-w-4xl mx-auto mb-2 px-3.5 py-2.5 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300 font-bold animate-msg-in">
              <UserX className="w-4 h-4 text-rose-400 shrink-0" />
              <span>You have been banned from sending messages in this channel by the admin.</span>
            </div>
          )}

          {/* Read Only Channel Banner */}
          {activeGroup.is_read_only && !isAdminOfActiveGroup && (
            <div className="max-w-4xl mx-auto mb-2 px-3.5 py-2.5 bg-indigo-950/80 border border-indigo-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-300 font-semibold animate-msg-in">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>This channel is in Admin Read-Only mode. Only channel admins can post.</span>
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

          {/* Replying Banner Above Input */}
          {replyingToMessage && (
            <div className="max-w-4xl mx-auto flex items-center justify-between px-3.5 py-2 bg-[#131724] border border-white/10 rounded-2xl mb-1.5 animate-msg-in shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-1 h-8 rounded-full bg-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-indigo-400 truncate flex items-center gap-1">
                    <Reply className="w-3 h-3 text-indigo-400" />
                    <span>Replying to {replyingToMessage.sender_name}</span>
                  </p>
                  <p className="text-xs text-[#A8B2C7] truncate mt-0.5 max-w-sm">
                    {replyingToMessage.content || (replyingToMessage.msg_type === 'audio' ? '🎙️ Voice Note' : replyingToMessage.msg_type === 'image' ? '📷 Photo' : '📎 Attachment')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingToMessage(null)}
                className="w-6 h-6 rounded-full hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors shrink-0"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Composer Input Bar or Join Channel CTA */}
          {!isJoinedToActiveGroup ? (
            <div className="max-w-4xl mx-auto flex items-center justify-between p-3.5 rounded-2xl bg-[#131722] border border-[#232B3E] shadow-xl animate-msg-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 grid place-items-center text-indigo-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    Join #{activeGroup.name} to send messages
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#7A8396] truncate">
                    Tap join to chat with members, share photos, and send voice notes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleJoinGroup(activeGroup.id)}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Join Channel</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isCurrentUserBanned) {
                  triggerToast('🚫 You are banned from sending messages in this channel');
                  return;
                }
                if (activeGroup?.is_read_only && !isAdminOfActiveGroup) {
                  triggerToast('🔒 Channel is in Admin Read-Only mode');
                  return;
                }
                if (!inputText.trim()) return;
                handleSendMessage(inputText, 'text');
              }}
              className="max-w-4xl mx-auto flex items-end gap-1.5 sm:gap-2 bg-[#121622]/90 backdrop-blur-md border border-white/10 focus-within:border-[#6366F1]/50 rounded-2xl p-1.5 sm:p-2 transition-all shadow-lg"
            >
              {isVoiceRecording ? (
                /* LIVE VOICE RECORDING STUDIO */
                <div className="flex-1 flex items-center justify-between gap-3 px-2 py-1.5 select-none animate-msg-in">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {Math.floor(voiceRecordingDuration / 60)}:{(voiceRecordingDuration % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1">
                      {[12, 24, 38, 20, 45, 30, 16, 40, 25, 35].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}px` }}
                          className="w-[2.5px] rounded-full bg-rose-400/80 animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelVoiceRecording}
                      className="p-2 rounded-xl text-[#7A8396] hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1"
                      title="Discard recording"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishVoiceRecording}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                      title="Send voice note"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Upload Image button with Compression */}
                  <label
                    className="p-1.5 sm:p-2 rounded-xl text-[#A8B2C7] hover:text-white hover:bg-white/5 cursor-pointer shrink-0 active:scale-95 transition-all"
                    title="Upload Image"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressedDataUrl = await compressImage(file);
                          handleSendMessage('', 'image', compressedDataUrl);
                        } catch (err) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              handleSendMessage('', 'image', reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        } finally {
                          e.target.value = '';
                        }
                      }}
                    />
                    <Upload className="w-4 h-4" />
                  </label>

                  {/* Input Textarea with Enter key & typing indicator */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      notifyTyping(Boolean(e.target.value.trim()));
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
                        ? 'Ghost Mode: Burns in 10s...'
                        : `Message #${activeGroup.name}... (try /play lofi)`
                    }
                    className="flex-1 bg-transparent border-0 outline-none resize-none px-2 py-1.5 text-base sm:text-sm text-[#E9ECF4] placeholder-[#5A6376] max-h-32 leading-relaxed no-scrollbar"
                  />

                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
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
                      className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                        ghostModeActive
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-md shadow-amber-500/20 animate-pulse'
                          : 'text-[#A8B2C7] hover:text-white hover:bg-white/5'
                      }`}
                      title="Burn-on-Read Ghost Mode (Auto self-destruct in 10s)"
                    >
                      <Flame className={`w-4 h-4 ${ghostModeActive ? 'text-amber-400' : ''}`} />
                    </button>

                    {/* Emoji, GIF & Sticker Picker toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                      className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                        showEmojiPicker ? 'bg-[#6366F1]/20 text-[#818CF8]' : 'text-[#A8B2C7] hover:text-white hover:bg-white/5'
                      }`}
                      title="Emojis, GIFs & Stickers"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Send Button or Mic Button (WhatsApp style: Mic when empty, Send when text typed) */}
                    {inputText.trim() ? (
                      <button
                        type="submit"
                        disabled={isSending}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl grid place-items-center text-white transition-all shadow-md ml-0.5 sm:ml-1 ${
                          ghostModeActive
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 shadow-amber-500/30'
                            : 'bg-[#6366F1] hover:bg-[#5457E5] active:scale-95 shadow-[#6366F1]/30'
                        }`}
                        title="Send message"
                      >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartVoiceRecording}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl grid place-items-center bg-[#181E2E] hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-200 border border-white/5 hover:border-indigo-500/40 active:scale-95 transition-all shadow-md ml-0.5 sm:ml-1"
                        title="Record Voice Note (Audio Memo)"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </form>
          )}
        </div>
          </>
        )}
      </main>

      {/* RIGHT SIDEBAR (Instagram-style Group Details & Members) */}
      {activeGroup && (
        <aside
        className={`fixed md:relative top-0 bottom-0 right-0 z-40 bg-[#0E121B] border-l border-[#1B212E] w-[300px] min-w-[300px] flex flex-col transition-transform duration-300 ease-out ${
          infoOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:hidden'
        }`}
      >
        <div className="p-4 border-b border-[#1B212E] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A8B2C7] flex items-center gap-1.5">
            {isDmMode ? (
              <>
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Direct Chat Info</span>
              </>
            ) : activeGroup.is_private ? (
              <>
                <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Group Info</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Group Info</span>
              </>
            )}
          </span>
          <button
            onClick={() => setInfoOpen(false)}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll p-4 space-y-5">
          {/* Group / User Mascot & Info */}
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
              {!isDmMode && activeGroup.is_private && <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />}
            </h2>
            <p className="text-xs text-[#7A8396] mt-1">{activeGroup.description}</p>
            {!isDmMode && (
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
            )}
          </div>

          {/* Join Group Button if not a member yet (Groups only) */}
          {!isJoinedToActiveGroup && !isDmMode && (
            <button
              onClick={() => handleJoinGroup(activeGroup.id)}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Join #{activeGroup.name}</span>
            </button>
          )}

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
          {isAdminOfActiveGroup && !isDmMode && (
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

          {/* Admin Moderation Panel Button */}
          {isAdminOfActiveGroup && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="w-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-500/30 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Admin Ban & Moderation</span>
            </button>
          )}

          {/* Admin Direct Delete Channel Button */}
          {isAdminOfActiveGroup && !isDmMode && (
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  `Are you sure you want to permanently delete #${activeGroup.name}? All messages will be wiped.`
                );
                if (confirmed) {
                  handleDeleteChannel();
                }
              }}
              className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              title={`Permanently delete #${activeGroup.name}`}
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete Channel (#{activeGroup.name})</span>
            </button>
          )}

          {/* Members List with Click to View Profile (Groups Only) */}
          {!isDmMode && (
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
                  const memberHandle = (matchedUser?.username || (isCurrent ? user.username : mName) || '').toLowerCase();
                  const memberPresence = presenceMap[memberHandle];
                  const isMemberOnline = isCurrent || memberPresence?.is_online;

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
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F5F6F8] p-0.5 border border-white/5">
                          <img
                            src={memberAvatar}
                            alt={displayName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {isMemberOnline ? (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#141824] animate-pulse" />
                        ) : (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-slate-500 border border-[#141824]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white truncate">
                            {displayName} {isCurrent && '(You)'}
                          </p>
                        </div>
                        <p className="text-[10px] text-[#7A8396] flex items-center gap-1 truncate">
                          {displayUsername ? (
                            <span className="text-[#818CF8] font-mono mr-0.5">{displayUsername}</span>
                          ) : null}
                          <span>•</span>
                          {isMemberOnline ? (
                            <span className="text-emerald-400 font-medium">Online</span>
                          ) : (
                            <span>{memberPresence?.last_seen_text || 'Offline'}</span>
                          )}
                          <span>•</span>
                          <span>{isCreator ? 'Admin 👑' : 'Member'}</span>
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
          )}

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
      )}

      {/* NEW CHAT MODAL (WhatsApp Style Contact Picker) */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        registeredUsers={registeredUsers}
        currentUserId={user.id}
        currentUsername={user.username}
        presenceMap={presenceMap}
        onStartDm={handleStartDm}
        onCreateGroup={() => {
          setNewGroupIsPrivate(false);
          setShowNewGroupModal(true);
        }}
        onDiscoverChannels={() => setShowDiscoverChannels(true)}
      />

      {/* CREATE STORY / STATUS MODAL */}
      <CreateStoryModal
        isOpen={showCreateStoryModal}
        onClose={() => setShowCreateStoryModal(false)}
        currentUser={user}
        onPublishStory={handlePublishStory}
      />

      {/* STORY VIEWER MODAL (Instagram / WhatsApp Fullscreen Player) */}
      <StoryViewerModal
        isOpen={Boolean(viewingStory)}
        onClose={() => setViewingStory(null)}
        story={viewingStory}
        allStories={stories}
        currentUser={user}
        onSendStoryReply={handleSendStoryReply}
        onMarkViewed={handleMarkStoryViewed}
      />
    </div>
  );
}

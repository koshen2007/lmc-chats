import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getClientIp,
  checkRateLimit,
  sanitizeInputText,
} from '@/lib/security/shield';
import { getSupabaseServerClient } from '@/lib/supabase';

export interface ApiUserProfile {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  status?: 'online' | 'idle' | 'dnd';
  role?: 'admin' | 'user';
  provider?: 'google' | 'custom';
  email?: string;
  created_at?: string;
}

// Initial empty directory (only real registered users exist)
const INITIAL_USERS: ApiUserProfile[] = [];

// In-memory cache across server requests
declare global {
  // eslint-disable-next-line no-var
  var __LMC_USERS_CACHE__: ApiUserProfile[] | undefined;
}

function getStoragePath(): string {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'registered_users.json');
  } catch {
    return path.join(os.tmpdir(), 'lmc_registered_users.json');
  }
}

function loadUsers(): ApiUserProfile[] {
  if (globalThis.__LMC_USERS_CACHE__ && globalThis.__LMC_USERS_CACHE__.length > 0) {
    return globalThis.__LMC_USERS_CACHE__;
  }

  const filePath = getStoragePath();
  let users: ApiUserProfile[] = [...INITIAL_USERS];

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, ApiUserProfile>();
        for (const u of parsed) {
          if (u && u.username) {
            map.set(u.username.toLowerCase(), u);
          }
        }
        users = Array.from(map.values());
      }
    } catch (e) {
      console.error('Error loading users file:', e);
    }
  }

  globalThis.__LMC_USERS_CACHE__ = users;
  return users;
}

function saveUsers(users: ApiUserProfile[]): void {
  globalThis.__LMC_USERS_CACHE__ = users;
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving users file:', e);
  }
}

// GET /api/users?q=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase().replace(/^@/, '');

  // If Supabase is configured, fetch users from Supabase
  const sb = getSupabaseServerClient();
  let allUsers: ApiUserProfile[] = [];
  if (sb) {
    try {
      const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        allUsers = data;
      }
    } catch (e) {
      console.error('Supabase users fetch error:', e);
    }
  }

  if (allUsers.length === 0) {
    allUsers = loadUsers();
  }

  // Filter out any mock/test users permanently
  const FAKE_BLOCKLIST = new Set([
    'harshita', 'harshita_dev', 'pryanshu', 'priyanshu', 'alex', 'sam', 'kira',
    'kai', 'aria', 'zayn', 'rin', 'marcus', 'elena', 'koshen'
  ]);
  allUsers = allUsers.filter((u) => {
    if (!u || !u.username) return false;
    const un = u.username.toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
    const nm = (u.name || '').toLowerCase().trim().replace(/^@/, '').replace(/^usr_/, '');
    return !FAKE_BLOCKLIST.has(un) && !FAKE_BLOCKLIST.has(nm) && !FAKE_BLOCKLIST.has(u.id);
  });

  if (!q) {
    return NextResponse.json({
      success: true,
      users: allUsers,
      count: allUsers.length,
    });
  }

  // Instagram-Style Ranked Search
  // 1. Username starts with Q
  // 2. Name starts with Q
  // 3. User ID starts with Q or usr_Q
  // 4. Username contains Q
  // 5. Name contains Q
  const exactPrefixUsers: ApiUserProfile[] = [];
  const namePrefixUsers: ApiUserProfile[] = [];
  const idPrefixUsers: ApiUserProfile[] = [];
  const otherMatches: ApiUserProfile[] = [];

  for (const u of allUsers) {
    const uName = (u.username || '').toLowerCase();
    const dName = (u.name || '').toLowerCase();
    const uId = (u.id || '').toLowerCase();
    const uBio = (u.bio || '').toLowerCase();

    if (uName.startsWith(q)) {
      exactPrefixUsers.push(u);
    } else if (dName.startsWith(q) || dName.split(' ').some((part) => part.startsWith(q))) {
      namePrefixUsers.push(u);
    } else if (uId.startsWith(q) || uId.startsWith(`usr_${q}`)) {
      idPrefixUsers.push(u);
    } else if (uName.includes(q) || dName.includes(q) || uId.includes(q) || uBio.includes(q)) {
      otherMatches.push(u);
    }
  }

  const results = [
    ...exactPrefixUsers,
    ...namePrefixUsers,
    ...idPrefixUsers,
    ...otherMatches,
  ];

  return NextResponse.json({
    success: true,
    query: q,
    users: results,
    count: results.length,
  });
}

// POST /api/users - Rate Limited & Anti-Hijacking Protected
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP Rate Limiting (Anti-Bot flood: max 12 registrations / minute per IP)
    const limit = checkRateLimit(`user_reg:${clientIp}`, 12, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Please wait ${limit.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const rawUsername = (body.username || body.name || '').trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    const cleanName = sanitizeInputText((body.name || rawUsername).trim(), 50);

    if (!rawUsername || rawUsername.length < 3 || rawUsername.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Username must be between 3 and 20 alphanumeric characters' },
        { status: 400 }
      );
    }

    const currentUsers = loadUsers();
    const userId = body.id || `usr_${rawUsername}`;

    // 2. Anti-Hijacking Check: If username already exists under a DIFFERENT user ID, reject update
    const existingIndex = currentUsers.findIndex(
      (u) => u.username.toLowerCase() === rawUsername || u.id === userId
    );

    if (existingIndex >= 0) {
      const existingUser = currentUsers[existingIndex];
      // Only the same user ID is authorized to update their profile
      if (existingUser.id !== userId && existingUser.username.toLowerCase() === rawUsername) {
        return NextResponse.json(
          { success: false, error: `@${rawUsername} is already registered by another account` },
          { status: 409 }
        );
      }
    }

    const newUser: ApiUserProfile = {
      id: userId,
      username: rawUsername,
      name: cleanName,
      avatar:
        body.avatar ||
        `https://api.dicebear.com/7.x/notionists/svg?seed=${rawUsername}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
      bio: body.bio ? sanitizeInputText(body.bio, 160) : 'LMC Chats member ⚡',
      status: body.status || 'online',
      role: body.role || 'user',
      provider: body.provider || 'custom',
      email: body.email,
      created_at: body.created_at || new Date().toISOString(),
    };

    let updatedUsers: ApiUserProfile[];
    if (existingIndex >= 0) {
      updatedUsers = [...currentUsers];
      updatedUsers[existingIndex] = {
        ...updatedUsers[existingIndex],
        ...newUser,
      };
    } else {
      updatedUsers = [newUser, ...currentUsers];
    }

    saveUsers(updatedUsers);

    const sb = getSupabaseServerClient();
    if (sb) {
      Promise.resolve(sb.from('users').upsert([newUser])).catch((err) => {
        console.error('Supabase user upsert error:', err);
      });
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      total: updatedUsers.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users?username=... or ?id=...
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = (searchParams.get('username') || '').trim().toLowerCase().replace(/^@/, '');
    const id = (searchParams.get('id') || '').trim();

    if (!username && !id) {
      return NextResponse.json({ success: false, error: 'username or id required' }, { status: 400 });
    }

    const currentUsers = loadUsers();
    const filtered = currentUsers.filter((u) => {
      if (username && u.username.toLowerCase() === username) return false;
      if (id && u.id === id) return false;
      return true;
    });

    saveUsers(filtered);

    const sb = getSupabaseServerClient();
    if (sb) {
      if (username) {
        Promise.resolve(sb.from('users').delete().eq('username', username)).catch(() => {});
      } else if (id) {
        Promise.resolve(sb.from('users').delete().eq('id', id)).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, remaining: filtered.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}


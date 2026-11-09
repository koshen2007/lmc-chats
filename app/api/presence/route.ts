import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getSupabaseServerClient } from '@/lib/supabase';

interface PresenceEntry {
  username: string;
  name?: string;
  avatar?: string;
  last_seen: number;
}

// In-memory presence store
const globalForPresence = globalThis as unknown as {
  presenceStore?: Map<string, PresenceEntry>;
};

function getStoragePath(): string {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isVercel) {
      return path.join('/tmp', 'lmc_presence.json');
    }
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'presence.json');
  } catch {
    return path.join(os.tmpdir(), 'lmc_presence.json');
  }
}

function loadPersistedPresence(): Map<string, PresenceEntry> {
  const map = new Map<string, PresenceEntry>();
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.username) {
            map.set(item.username.toLowerCase(), item);
          }
        }
      }
    }
  } catch {}
  return map;
}

function savePersistedPresence(store: Map<string, PresenceEntry>): void {
  try {
    const filePath = getStoragePath();
    const arr = Array.from(store.values());
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf-8');
  } catch {}
}

function getPresenceStore(): Map<string, PresenceEntry> {
  if (!globalForPresence.presenceStore) {
    globalForPresence.presenceStore = loadPersistedPresence();
  }
  return globalForPresence.presenceStore;
}

/**
 * Telegram/WhatsApp Style Humanized Last Seen Formatter
 */
function formatLastSeen(lastSeen: number): { isOnline: boolean; text: string } {
  const now = Date.now();
  const diffSec = Math.floor((now - lastSeen) / 1000);

  // Online window: active within past 35 seconds
  if (diffSec < 35) {
    return { isOnline: true, text: 'Online' };
  }

  if (diffSec < 60) {
    return { isOnline: false, text: 'Last seen just now' };
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return { isOnline: false, text: `Last seen ${diffMin}m ago` };
  }

  const dateSeen = new Date(lastSeen);
  const nowDate = new Date(now);

  const isToday =
    dateSeen.getDate() === nowDate.getDate() &&
    dateSeen.getMonth() === nowDate.getMonth() &&
    dateSeen.getFullYear() === nowDate.getFullYear();

  const timeStr = dateSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return { isOnline: false, text: `Last seen today at ${timeStr}` };
  }

  const yesterdayDate = new Date(now - 86400000);
  const isYesterday =
    dateSeen.getDate() === yesterdayDate.getDate() &&
    dateSeen.getMonth() === yesterdayDate.getMonth() &&
    dateSeen.getFullYear() === yesterdayDate.getFullYear();

  if (isYesterday) {
    return { isOnline: false, text: `Last seen yesterday at ${timeStr}` };
  }

  const dateStr = dateSeen.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return { isOnline: false, text: `Last seen ${dateStr} at ${timeStr}` };
}

// GET /api/presence
export async function GET() {
  try {
    const store = getPresenceStore();
    const presence: Record<
      string,
      {
        is_online: boolean;
        last_seen: number;
        last_seen_text: string;
        name?: string;
        avatar?: string;
      }
    > = {};

    let onlineCount = 0;

    store.forEach((entry, username) => {
      const { isOnline, text } = formatLastSeen(entry.last_seen);
      if (isOnline) onlineCount++;
      presence[username.toLowerCase()] = {
        is_online: isOnline,
        last_seen: entry.last_seen,
        last_seen_text: text,
        name: entry.name,
        avatar: entry.avatar,
      };
    });

    return NextResponse.json({
      success: true,
      presence,
      online_count: onlineCount,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/presence (Heartbeat ping)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, name, avatar } = body || {};

    const cleanUsername = (username || '').trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) {
      return NextResponse.json(
        { success: false, error: 'username is required for presence' },
        { status: 400 }
      );
    }

    const store = getPresenceStore();
    const now = Date.now();
    const entry: PresenceEntry = {
      username: cleanUsername,
      name: name || cleanUsername,
      avatar: avatar || '',
      last_seen: now,
    };

    store.set(cleanUsername, entry);
    savePersistedPresence(store);

    // Sync to Supabase in background if configured
    const sb = getSupabaseServerClient();
    if (sb) {
      Promise.resolve(
        sb.from('users').update({ last_seen: new Date(now).toISOString() }).eq('username', cleanUsername)
      ).catch(() => {});
    }

    const { isOnline, text } = formatLastSeen(now);

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      last_seen: now,
      is_online: isOnline,
      last_seen_text: text,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

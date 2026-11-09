import { NextResponse } from 'next/server';

interface PresenceEntry {
  username: string;
  name?: string;
  avatar?: string;
  last_seen: number;
}

// In-memory presence store (persists across warm requests and hot reloads)
const globalForPresence = globalThis as unknown as {
  presenceStore?: Map<string, PresenceEntry>;
};

function getPresenceStore(): Map<string, PresenceEntry> {
  if (!globalForPresence.presenceStore) {
    globalForPresence.presenceStore = new Map();
  }
  return globalForPresence.presenceStore;
}

function formatLastSeen(lastSeen: number): { isOnline: boolean; text: string } {
  const diffSec = Math.floor((Date.now() - lastSeen) / 1000);

  if (diffSec < 45) {
    return { isOnline: true, text: 'Online' };
  }
  if (diffSec < 60) {
    return { isOnline: false, text: 'Last seen just now' };
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return { isOnline: false, text: `Last seen ${diffMin}m ago` };
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return { isOnline: false, text: `Last seen ${diffHr}h ago` };
  }
  const diffDay = Math.floor(diffHr / 24);
  return { isOnline: false, text: `Last seen ${diffDay}d ago` };
}

// GET /api/presence
export async function GET() {
  try {
    const store = getPresenceStore();
    const presence: Record<string, {
      is_online: boolean;
      last_seen: number;
      last_seen_text: string;
      name?: string;
      avatar?: string;
    }> = {};

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

    const cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername) {
      return NextResponse.json(
        { success: false, error: 'username is required for presence' },
        { status: 400 }
      );
    }

    const store = getPresenceStore();
    store.set(cleanUsername, {
      username: cleanUsername,
      name: name || cleanUsername,
      avatar: avatar || '',
      last_seen: Date.now(),
    });

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      last_seen: Date.now(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}


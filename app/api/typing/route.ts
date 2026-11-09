import { NextResponse } from 'next/server';

interface TypingEntry {
  group_id: string;
  username: string;
  name: string;
  expires_at: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __LMC_TYPING_STORE__: Map<string, TypingEntry> | undefined;
}

function getTypingStore(): Map<string, TypingEntry> {
  if (!globalThis.__LMC_TYPING_STORE__) {
    globalThis.__LMC_TYPING_STORE__ = new Map<string, TypingEntry>();
  }
  return globalThis.__LMC_TYPING_STORE__;
}

// GET /api/typing?group_id=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = (searchParams.get('group_id') || '').trim();

    if (!groupId) {
      return NextResponse.json({ success: true, typers: [] });
    }

    const store = getTypingStore();
    const now = Date.now();
    const typers: Array<{ username: string; name: string }> = [];

    store.forEach((entry, key) => {
      if (entry.expires_at < now) {
        store.delete(key);
      } else if (entry.group_id === groupId) {
        typers.push({ username: entry.username, name: entry.name });
      }
    });

    return NextResponse.json({
      success: true,
      group_id: groupId,
      typers,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/typing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { group_id, username, name, is_typing } = body || {};

    if (!group_id || !username) {
      return NextResponse.json(
        { success: false, error: 'group_id and username required' },
        { status: 400 }
      );
    }

    const store = getTypingStore();
    const key = `${group_id}:::${username.toLowerCase()}`;

    if (is_typing) {
      store.set(key, {
        group_id,
        username,
        name: name || username,
        expires_at: Date.now() + 3500, // active for 3.5 seconds
      });
    } else {
      store.delete(key);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

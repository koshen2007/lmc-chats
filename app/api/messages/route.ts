import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getClientIp,
  checkRateLimit,
  checkDuplicateSpam,
  sanitizeInputText,
  validateMediaPayload,
} from '@/lib/security/shield';

export interface ApiMessage {
  id: string;
  group_id: string;
  sender_name: string;
  sender_username?: string;
  sender_avatar: string;
  sender_bio?: string;
  content: string;
  msg_type: 'text' | 'sticker' | 'gif' | 'image' | 'audio' | 'music_bot';
  media_url?: string;
  reactions: Record<string, number>;
  created_at: string;
  burn_after_read?: boolean;
  burn_seconds?: number;
  read_by?: string[];
  reply_to?: {
    id: string;
    sender_name: string;
    sender_username?: string;
    content: string;
    msg_type?: string;
    media_url?: string;
  } | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __LMC_MESSAGES_CACHE__: ApiMessage[] | undefined;
}

function getStoragePath(): string {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isVercel) {
      return path.join('/tmp', 'lmc_messages.json');
    }
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'messages.json');
  } catch {
    return path.join(process.cwd(), 'messages.json');
  }
}

function getMessages(): ApiMessage[] {
  if (globalThis.__LMC_MESSAGES_CACHE__) {
    return globalThis.__LMC_MESSAGES_CACHE__;
  }

  const filePath = getStoragePath();
  let msgs: ApiMessage[] = [];

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        msgs = parsed;
      }
    } catch (e) {
      console.error('Error loading messages file:', e);
    }
  }

  globalThis.__LMC_MESSAGES_CACHE__ = msgs;
  return msgs;
}

function saveMessages(msgs: ApiMessage[]): void {
  globalThis.__LMC_MESSAGES_CACHE__ = msgs;
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(msgs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving messages:', e);
  }
}

// GET /api/messages?group_id=<id>&after=<timestamp>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id');
    const after = searchParams.get('after');

    const all = getMessages();

    let filtered = all;
    if (groupId) {
      filtered = filtered.filter((m) => m.group_id === groupId);
    }
    if (after) {
      const afterTime = new Date(after).getTime();
      if (!isNaN(afterTime)) {
        filtered = filtered.filter((m) => new Date(m.created_at).getTime() > afterTime);
      }
    }

    return NextResponse.json({
      success: true,
      messages: filtered,
      count: filtered.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/messages - Protected against Spam, Flooding & XSS
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP Rate Limiting (Anti-DDoS / Flooding: max 25 msgs / 10s)
    const ipLimit = checkRateLimit(`msg_ip:${clientIp}`, 25, 10_000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${ipLimit.retryAfterSeconds}s before sending more messages.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    const hasContent = Boolean(body.content?.trim() || body.media_url || (body.msg_type && body.msg_type !== 'text'));
    if (!body || !body.group_id || !hasContent) {
      return NextResponse.json(
        { success: false, error: 'Invalid message payload' },
        { status: 400 }
      );
    }

    const senderUsername = (body.sender_username || '').trim().toLowerCase().replace(/^@/, '');

    // 2. User Rate Limiting (max 15 msgs / 10s per user)
    if (senderUsername) {
      const userLimit = checkRateLimit(`msg_user:${senderUsername}`, 15, 10_000);
      if (!userLimit.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `You are sending messages too quickly. Please slow down (${userLimit.retryAfterSeconds}s).`,
          },
          { status: 429 }
        );
      }

      // 3. Repetitive Content Spam Detection (e.g. spamming exact text 3+ times in 15s)
      if (body.content && checkDuplicateSpam(senderUsername, body.content)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate message spam detected. Please avoid sending the exact same message repeatedly.',
          },
          { status: 429 }
        );
      }
    }

    // 4. Sanitize Text & Length Capping (Max 3,000 characters)
    const sanitizedContent = sanitizeInputText(body.content || '', 3000);

    // 5. Media Payload Size Validation (Max 5MB)
    const mediaCheck = validateMediaPayload(body.media_url);
    if (!mediaCheck.valid) {
      return NextResponse.json(
        { success: false, error: mediaCheck.error },
        { status: 413 }
      );
    }

    const newMessage: ApiMessage = {
      id: body.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      group_id: body.group_id,
      sender_name: sanitizeInputText(body.sender_name || 'Anonymous', 50),
      sender_username: senderUsername || undefined,
      sender_avatar: body.sender_avatar || '',
      sender_bio: body.sender_bio ? sanitizeInputText(body.sender_bio, 150) : undefined,
      content: sanitizedContent,
      msg_type: body.msg_type || 'text',
      media_url: body.media_url,
      reactions: body.reactions || {},
      created_at: body.created_at || new Date().toISOString(),
      burn_after_read: Boolean(body.burn_after_read),
      burn_seconds: Math.min(Math.max(body.burn_seconds || 10, 5), 300),
      read_by: Array.isArray(body.read_by) && body.read_by.length > 0
        ? body.read_by
        : [senderUsername || 'Anonymous'],
      reply_to: body.reply_to || null,
    };

    const current = getMessages();
    // Prevent duplicate IDs
    const exists = current.some((m) => m.id === newMessage.id);
    const updated = exists ? current : [...current, newMessage];

    saveMessages(updated);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/messages?id=<id>&requester=<username> - Protected Authorization
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    const requester = (searchParams.get('requester') || '').trim().toLowerCase().replace(/^@/, '');

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const current = getMessages();
    const targetMsg = current.find((m) => m.id === messageId);

    // If message exists, verify authorization (sender or admin)
    if (targetMsg && requester) {
      const msgSender = (targetMsg.sender_username || targetMsg.sender_name || '').toLowerCase().replace(/^@/, '');
      const isSender = msgSender === requester;
      const isAdmin = requester === 'admin' || requester === 'lmc';
      if (!isSender && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: You can only delete your own messages' },
          { status: 403 }
        );
      }
    }

    const updated = current.filter((m) => m.id !== messageId);
    saveMessages(updated);

    return NextResponse.json({
      success: true,
      deletedId: messageId,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// PATCH /api/messages (update reactions, mark as read, etc.)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Action 1: Mark messages as read for a user in a room
    if (body && body.action === 'mark_read') {
      const group_id = (body.group_id || '').trim();
      const username = (body.username || body.reader || '').trim();
      if (!group_id || !username) {
        return NextResponse.json(
          { success: false, error: 'group_id and username required' },
          { status: 400 }
        );
      }
      const current = getMessages();
      let changed = false;
      const updated = current.map((m) => {
        if (m.group_id === group_id) {
          const reads = Array.isArray(m.read_by) ? m.read_by : [];
          if (!reads.includes(username)) {
            changed = true;
            return { ...m, read_by: [...reads, username] };
          }
        }
        return m;
      });
      if (changed) {
        saveMessages(updated);
      }
      return NextResponse.json({ success: true, action: 'mark_read' });
    }

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const current = getMessages();
    let targetMessage: ApiMessage | null = null;
    const updated = current.map((m) => {
      if (m.id === body.id) {
        let newReactions = { ...(m.reactions || {}) };
        if (body.reactions !== undefined) {
          newReactions = body.reactions;
        } else if (body.emoji) {
          const curCount = typeof newReactions[body.emoji] === 'number' ? newReactions[body.emoji] : 0;
          newReactions[body.emoji] = curCount + 1;
        }
        const updatedMsg = {
          ...m,
          reactions: newReactions,
          content: body.content !== undefined ? body.content : m.content,
        };
        targetMessage = updatedMsg;
        return updatedMsg;
      }
      return m;
    });

    saveMessages(updated);
    return NextResponse.json({ success: true, id: body.id, message: targetMessage });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getClientIp,
  checkRateLimit,
  checkDuplicateSpam,
  checkMessageCooldown,
  sanitizeInputText,
  validateMediaPayload,
  isSuperAdmin,
} from '@/lib/security/shield';
import {
  isUserBanned,
  verifyAndConsumeNonce,
  validateReplayWindow,
  evaluateTokenBucket,
  computeMerkleHash,
  isUserShadowbanned,
} from '@/lib/security/serverShield';
import { verifyMessageSignature } from '@/lib/cryptoIdentity';
import { getSupabaseServerClient } from '@/lib/supabase';

export interface ApiMessage {
  id: string;
  group_id: string;
  sender_id?: string;
  sender_name: string;
  sender_username?: string;
  sender_avatar: string;
  sender_bio?: string;
  content: string;
  msg_type:
    | 'text'
    | 'sticker'
    | 'gif'
    | 'image'
    | 'audio'
    | 'music_bot'
    | 'poll'
    | 'bunk_meter'
    | 'confession'
    | 'whisper'
    | 'roast'
    | 'decision';
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
  // Interactive Bot Metadata (Poll votes, bunk counters, whisper targets)
  metadata?: Record<string, any>;
  // Zero-Trust Cryptographic & Integrity Fields
  nonce?: string;
  signature?: string;
  public_key?: string;
  prev_hash?: string;
  msg_hash?: string;
  is_shadow?: boolean;
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
    const requester = searchParams.get('requester') || request.headers.get('x-lmc-user') || '';

    // If Supabase is configured, fetch live from Supabase
    const sb = getSupabaseServerClient();
    if (sb) {
      try {
        let query = sb.from('messages').select('*').order('created_at', { ascending: true });
        if (groupId) {
          query = query.eq('group_id', groupId);
        }
        if (after) {
          query = query.gt('created_at', after);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          // Zero-Trust Shadowban Filter on remote data
          const visibleData = data.filter((m) => {
            if (!m.is_shadow) return true;
            if (!requester) return false;
            const cleanReq = requester.trim().toLowerCase().replace(/^@/, '');
            const cleanSender = (m.sender_username || '').trim().toLowerCase().replace(/^@/, '');
            return cleanReq === cleanSender || requester === m.sender_id || isSuperAdmin(cleanReq);
          });

          return NextResponse.json({
            success: true,
            messages: visibleData,
            count: visibleData.length,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error('Supabase fetch error, falling back to local store:', e);
      }
    }

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

    // Zero-Trust Shadowban Filter:
    // If a message is flagged as is_shadow, only the original sender sees it.
    // To other college students, it is completely invisible!
    filtered = filtered.filter((m) => {
      if (!m.is_shadow) return true;
      if (!requester) return false;
      const cleanReq = requester.trim().toLowerCase().replace(/^@/, '');
      const cleanSender = (m.sender_username || '').trim().toLowerCase().replace(/^@/, '');
      return cleanReq === cleanSender || requester === m.sender_id || isSuperAdmin(cleanReq);
    });

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
    const senderId = (body.sender_id || '').trim();

    // 2. Banned User Check (Row Level Security Enforcement)
    if (isUserBanned(senderUsername, senderId)) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Your account has been banned from sending messages.' },
        { status: 403 }
      );
    }

    // 2a. 15-Second Replay Window Lock
    const replayCheck = validateReplayWindow(body.created_at, 15);
    if (!replayCheck.valid) {
      return NextResponse.json(
        { success: false, error: replayCheck.error },
        { status: 400 }
      );
    }

    // 2b. Nonce Deduplication & Replay Attack Protection
    if (body.nonce) {
      const nonceCheck = verifyAndConsumeNonce(body.nonce);
      if (!nonceCheck.allowed) {
        return NextResponse.json(
          { success: false, error: nonceCheck.error },
          { status: 409 }
        );
      }
    }

    // 2c. Cryptographic Signature Verification (Hardware-Bound WebCrypto ECDSA P-256)
    if (body.signature && body.public_key) {
      const isSigValid = await verifyMessageSignature(
        body.content || '',
        body.group_id,
        body.created_at || '',
        body.nonce || '',
        senderUsername || senderId,
        body.signature,
        body.public_key
      );
      if (!isSigValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'CRYPTOGRAPHIC_SIGNATURE_INVALID: ECDSA P-256 signature verification failed. Message may have been tampered with.',
          },
          { status: 401 }
        );
      }
    }

    // 2d. Token Bucket Burst & Shadowban Engine (Max 4 burst per 5s)
    const senderIdent = senderUsername || senderId || body.sender_name || clientIp;
    const bucketEval = evaluateTokenBucket(senderIdent, senderId);
    if (!bucketEval.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded: Token bucket burst limit reached (Max 4 messages per 5s).',
        },
        { status: 429 }
      );
    }
    const isShadowMessage = bucketEval.isShadow || isUserShadowbanned(senderUsername, senderId);

    // 3. Payload Bombing Protection (Max 1000 characters)
    if (body.content && body.content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Payload too large: Message content exceeds 1000 character limit.' },
        { status: 400 }
      );
    }

    // 4. 2-Second Cooldown Engine (Anti-Console-Spam Loop)
    const cooldownCheck = checkMessageCooldown(senderIdent, 2000);
    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded: You cannot send messages faster than once every 2 seconds.',
          retryAfterSeconds: cooldownCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 5. User Rate Limiting (max 15 msgs / 10s per user)
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

      // 6. Repetitive Content Spam Detection (e.g. spamming exact text 3+ times in 15s)
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

    // 7. Sanitize Text & Length Capping (Max 1,000 characters)
    const sanitizedContent = sanitizeInputText(body.content || '', 1000);

    // 8. Strict Media Whitelist, SVG Prohibiton & EXIF Stripping
    const mediaCheck = validateMediaPayload(body.media_url);
    if (!mediaCheck.valid) {
      return NextResponse.json(
        { success: false, error: mediaCheck.error },
        { status: 400 }
      );
    }

    // 9. Merkle Hash Chain Computation (SHA-256)
    const current = getMessages();
    const groupMsgs = current.filter((m) => m.group_id === body.group_id);
    const lastMsg = groupMsgs[groupMsgs.length - 1];
    const prevHash = lastMsg?.msg_hash || 'GENESIS';
    const msgHash = computeMerkleHash(prevHash, sanitizedContent, body.signature || '');

    const newMessage: ApiMessage = {
      id: body.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      group_id: body.group_id,
      sender_id: senderId || undefined,
      sender_name: sanitizeInputText(body.sender_name || 'Anonymous', 50),
      sender_username: senderUsername || undefined,
      sender_avatar: body.sender_avatar || '',
      sender_bio: body.sender_bio ? sanitizeInputText(body.sender_bio, 150) : undefined,
      content: sanitizedContent,
      msg_type: body.msg_type || 'text',
      media_url: mediaCheck.cleanedUrl || body.media_url,
      reactions: body.reactions || {},
      created_at: body.created_at || new Date().toISOString(),
      burn_after_read: Boolean(body.burn_after_read),
      burn_seconds: Math.min(Math.max(body.burn_seconds || 10, 5), 300),
      read_by: Array.isArray(body.read_by) && body.read_by.length > 0
        ? body.read_by
        : [senderUsername || 'Anonymous'],
      reply_to: body.reply_to || null,
      metadata: body.metadata || {},

      // Zero-Trust Cryptographic & Integrity Fields
      nonce: body.nonce || undefined,
      signature: body.signature || 'LEGACY_UNSIGNED',
      public_key: body.public_key || undefined,
      prev_hash: prevHash,
      msg_hash: msgHash,
      is_shadow: isShadowMessage,
    };

    // Prevent duplicate IDs
    const exists = current.some((m) => m.id === newMessage.id);
    const updated = exists ? current : [...current, newMessage];

    saveMessages(updated);

    // Sync to Supabase in background if configured
    const sb = getSupabaseServerClient();
    if (sb) {
      Promise.resolve(
        sb.from('messages').upsert([
          {
            id: newMessage.id,
            group_id: newMessage.group_id,
            sender_name: newMessage.sender_name,
            sender_username: newMessage.sender_username || '',
            sender_avatar: newMessage.sender_avatar || '',
            sender_bio: newMessage.sender_bio || '',
            content: newMessage.content,
            msg_type: newMessage.msg_type,
            media_url: newMessage.media_url || '',
            reactions: newMessage.reactions,
            created_at: newMessage.created_at,
            burn_after_read: newMessage.burn_after_read,
            burn_seconds: newMessage.burn_seconds,
            read_by: newMessage.read_by,
            reply_to: newMessage.reply_to,
            metadata: newMessage.metadata || {},
            nonce: newMessage.nonce,
            signature: newMessage.signature,
            public_key: newMessage.public_key,
            prev_hash: newMessage.prev_hash,
            msg_hash: newMessage.msg_hash,
            is_shadow: newMessage.is_shadow,
          },
        ])
      ).catch((err) => console.error('Supabase async upsert failed:', err));
    }

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

    // Strict Authorization check: Anonymous or unauthorized delete attempts blocked
    if (!requester) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing requester credentials' },
        { status: 403 }
      );
    }

    // If message exists, verify authorization (sender or super admin)
    if (targetMsg) {
      const msgSender = (targetMsg.sender_username || targetMsg.sender_name || '').toLowerCase().replace(/^@/, '');
      const isSender = msgSender === requester;
      const isAdmin = isSuperAdmin(requester);
      if (!isSender && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: You cannot delete another user's message" },
          { status: 403 }
        );
      }
    }

    const updated = current.filter((m) => m.id !== messageId);
    saveMessages(updated);

    const sb = getSupabaseServerClient();
    if (sb) {
      Promise.resolve(sb.from('messages').delete().eq('id', messageId)).catch(() => {});
    }

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
          metadata:
            body.metadata !== undefined
              ? { ...(m.metadata || {}), ...body.metadata }
              : m.metadata,
        };
        targetMessage = updatedMsg;
        return updatedMsg;
      }
      return m;
    });

    saveMessages(updated);

    if (targetMessage) {
      const sb = getSupabaseServerClient();
      if (sb) {
        Promise.resolve(
          sb
            .from('messages')
            .update({
              reactions: (targetMessage as ApiMessage).reactions,
              metadata: (targetMessage as ApiMessage).metadata || {},
            })
            .eq('id', body.id)
        ).catch(() => {});
      }
    }
    return NextResponse.json({ success: true, id: body.id, message: targetMessage });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}


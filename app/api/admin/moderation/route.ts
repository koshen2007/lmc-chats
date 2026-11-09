import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isSuperAdmin } from '@/lib/security/shield';
import { addBannedUser, getBannedUsersList } from '@/lib/security/serverShield';
import { getSupabaseServerClient } from '@/lib/supabase';

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

// GET /api/admin/moderation?requester=<email>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requester = searchParams.get('requester') || '';

    if (!isSuperAdmin(requester)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Access restricted to Super Admin.' },
        { status: 403 }
      );
    }

    const banned = getBannedUsersList();
    return NextResponse.json({
      success: true,
      bannedUsers: banned,
      isAdmin: true,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/admin/moderation - Ban user or Purge messages
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, target_username, target_user_id, requester, reason } = body || {};

    if (!isSuperAdmin(requester)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin privileges required.' },
        { status: 403 }
      );
    }

    if (!target_username && !target_user_id) {
      return NextResponse.json(
        { success: false, error: 'Target username or user ID required.' },
        { status: 400 }
      );
    }

    const cleanTarget = (target_username || '').trim().toLowerCase().replace(/^@/, '');

    // Action 1: Ban User
    if (action === 'ban') {
      addBannedUser(cleanTarget, target_user_id, reason || 'Banned by Super Admin');

      // Sync to Supabase banned_users table if available
      const sb = getSupabaseServerClient();
      if (sb) {
        Promise.resolve(
          sb.from('banned_users').upsert([
            {
              username: cleanTarget,
              user_id: target_user_id || '',
              banned_by: requester,
              reason: reason || 'Banned by Super Admin',
            },
          ])
        ).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        action: 'ban',
        bannedUsername: cleanTarget,
        message: `User @${cleanTarget} has been permanently banned.`,
      });
    }

    // Action 2: Purge All Messages by User
    if (action === 'purge') {
      const filePath = getStoragePath();
      let purgedCount = 0;

      if (fs.existsSync(filePath)) {
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          const msgs = JSON.parse(data);
          if (Array.isArray(msgs)) {
            const beforeLen = msgs.length;
            const filtered = msgs.filter((m) => {
              const u = (m.sender_username || m.sender_name || '').toLowerCase().replace(/^@/, '');
              const uid = (m.sender_id || '').toLowerCase();
              const match =
                (cleanTarget && u === cleanTarget) ||
                (target_user_id && uid === target_user_id.toLowerCase());
              return !match;
            });
            purgedCount = beforeLen - filtered.length;
            fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
            globalThis.__LMC_MESSAGES_CACHE__ = filtered;
          }
        } catch {}
      }

      // Sync delete to Supabase if available
      const sb = getSupabaseServerClient();
      if (sb) {
        if (cleanTarget) {
          Promise.resolve(sb.from('messages').delete().eq('sender_username', cleanTarget)).catch(() => {});
        }
      }

      return NextResponse.json({
        success: true,
        action: 'purge',
        purgedCount,
        message: `Purged ${purgedCount} messages sent by @${cleanTarget}.`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid moderation action.' },
      { status: 400 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

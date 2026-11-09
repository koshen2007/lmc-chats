import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getClientIp,
  checkRateLimit,
  sanitizeInputText,
  canDeleteChannel,
} from '@/lib/security/shield';

export interface ApiGroup {
  id: string;
  name: string;
  description: string;
  avatar: string;
  created_by?: string;
  admins?: string[];
  is_private?: boolean;
  members?: string[];
  join_requests?: string[];
  created_at: string;
  unreadCount?: number;
  is_read_only?: boolean;
  slow_mode?: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __LMC_GROUPS_CACHE__: ApiGroup[] | undefined;
}

function getStoragePath(): string {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isVercel) {
      return path.join('/tmp', 'lmc_groups.json');
    }
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'groups.json');
  } catch {
    return path.join(process.cwd(), 'groups.json');
  }
}

function getGroups(): ApiGroup[] {
  if (globalThis.__LMC_GROUPS_CACHE__) {
    return globalThis.__LMC_GROUPS_CACHE__;
  }

  const filePath = getStoragePath();
  let groups: ApiGroup[] = [];

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Filter out legacy fake squad groups
        groups = parsed.filter(
          (g) =>
            g &&
            g.id !== 'lmc-squad' &&
            g.id !== 'lmc-main-lounge' &&
            g.name !== 'LMC Squad' &&
            g.name !== 'LMC Main Lounge'
        );
      }
    } catch (e) {
      console.error('Error loading groups file:', e);
    }
  }

  globalThis.__LMC_GROUPS_CACHE__ = groups;
  return groups;
}

function saveGroups(groups: ApiGroup[]): void {
  globalThis.__LMC_GROUPS_CACHE__ = groups;
  try {
    const filePath = getStoragePath();
    fs.writeFileSync(filePath, JSON.stringify(groups, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving groups:', e);
  }
}

// GET /api/groups
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    const allGroups = getGroups().filter((g) => g && !g.id.startsWith('dm_'));

    if (!q) {
      return NextResponse.json({
        success: true,
        groups: allGroups,
      });
    }

    const filtered = allGroups.filter((g) => {
      const name = (g.name || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || name.startsWith(q);
    });

    return NextResponse.json({
      success: true,
      groups: filtered,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/groups
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'create';

    const currentGroups = getGroups();

    if (action === 'sync' && Array.isArray(body.groups)) {
      const map = new Map<string, ApiGroup>();
      for (const g of currentGroups) {
        if (g && g.id && !g.id.startsWith('dm_')) map.set(g.id, g);
      }
      for (const g of body.groups) {
        if (g && g.id && !g.id.startsWith('dm_')) {
          const existing = map.get(g.id);
          map.set(g.id, existing ? { ...existing, ...g } : g);
        }
      }
      const updated = Array.from(map.values());
      saveGroups(updated);
      return NextResponse.json({
        success: true,
        groups: updated,
      });
    }

    if (action === 'create') {
      const clientIp = getClientIp(request);
      // Rate Limit Channel Creation (max 6 channels / minute per IP)
      const limit = checkRateLimit(`grp_create:${clientIp}`, 6, 60_000);
      if (!limit.allowed) {
        return NextResponse.json(
          { success: false, error: `Too many channels created. Please wait ${limit.retryAfterSeconds}s.` },
          { status: 429 }
        );
      }

      const rawName = (body.name || 'New Group').trim().replace(/^#/, '');
      const sanitizedName = sanitizeInputText(rawName, 60);
      const sanitizedDesc = sanitizeInputText(body.description || '', 300);
      const creator = (body.created_by || 'User').trim();

      const newGroup: ApiGroup = {
        id: body.id || `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: sanitizedName,
        description: sanitizedDesc,
        avatar: body.avatar || '/logo.png',
        created_by: creator,
        admins: body.admins || [creator],
        is_private: Boolean(body.is_private),
        members: body.members || [creator],
        join_requests: [],
        created_at: body.created_at || new Date().toISOString(),
        unreadCount: 0,
        is_read_only: Boolean(body.is_read_only),
        slow_mode: Boolean(body.slow_mode),
      };

      // Check if group with same ID already exists
      const existingIdx = currentGroups.findIndex((g) => g.id === newGroup.id);
      let updated: ApiGroup[];
      if (existingIdx >= 0) {
        updated = currentGroups.map((g) => (g.id === newGroup.id ? newGroup : g));
      } else {
        updated = [newGroup, ...currentGroups];
      }

      saveGroups(updated);
      return NextResponse.json({
        success: true,
        group: newGroup,
        groups: updated,
      });
    }

    if (action === 'join' || action === 'add_member') {
      const { groupId, memberName } = body;
      if (!groupId || !memberName) {
        return NextResponse.json(
          { success: false, error: 'groupId and memberName required' },
          { status: 400 }
        );
      }

      const updated = currentGroups.map((g) => {
        if (g.id === groupId) {
          const members = g.members || [];
          const cleanName = memberName.trim();
          if (!members.some((m) => m.toLowerCase() === cleanName.toLowerCase())) {
            return { ...g, members: [...members, cleanName] };
          }
        }
        return g;
      });

      saveGroups(updated);
      const updatedGroup = updated.find((g) => g.id === groupId);

      return NextResponse.json({
        success: true,
        group: updatedGroup,
        groups: updated,
      });
    }

    if (action === 'delete') {
      const groupId = body.groupId || body.id;
      const requester = (body.requester || body.username || '').trim();
      const targetGroup = currentGroups.find((g) => g.id === groupId);

      if (targetGroup && requester) {
        if (!canDeleteChannel(targetGroup, requester)) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized: Only the channel creator or admins can delete this channel.' },
            { status: 403 }
          );
        }
      }

      const updated = currentGroups.filter((g) => g.id !== groupId);
      saveGroups(updated);
      return NextResponse.json({
        success: true,
        deletedId: groupId,
        groups: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/groups?id=<groupId>&requester=<username> - Protected Authorization
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');
    const requester = (searchParams.get('requester') || '').trim();

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const currentGroups = getGroups();
    const targetGroup = currentGroups.find((g) => g.id === groupId);

    // Verify creator or admin authorization
    if (targetGroup && requester) {
      if (!canDeleteChannel(targetGroup, requester)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Only the channel creator or admins can delete this channel.' },
          { status: 403 }
        );
      }
    }

    const updated = currentGroups.filter((g) => g.id !== groupId);
    saveGroups(updated);

    return NextResponse.json({
      success: true,
      deletedId: groupId,
      groups: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}


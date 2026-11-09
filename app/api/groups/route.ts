import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
export async function GET() {
  try {
    const groups = getGroups();
    return NextResponse.json({
      success: true,
      groups,
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

    if (action === 'create') {
      const newGroup: ApiGroup = {
        id: body.id || `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: (body.name || 'New Group').trim().replace(/^#/, ''),
        description: body.description || '',
        avatar: body.avatar || '/logo.png',
        created_by: body.created_by || 'User',
        admins: body.admins || [body.created_by || 'User'],
        is_private: Boolean(body.is_private),
        members: body.members || [body.created_by || 'User'],
        join_requests: [],
        created_at: body.created_at || new Date().toISOString(),
        unreadCount: 0,
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
      const { groupId } = body;
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


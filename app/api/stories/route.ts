import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { UserStory } from '@/types/story';

// In-memory stories cache
const globalForStories = globalThis as unknown as {
  storiesStore?: UserStory[];
};

function getStoragePath(): string {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isVercel) {
      return path.join('/tmp', 'lmc_stories.json');
    }
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'stories.json');
  } catch {
    return path.join(os.tmpdir(), 'lmc_stories.json');
  }
}

function loadPersistedStories(): UserStory[] {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const now = Date.now();
        // Filter out stories older than 24 hours
        return parsed.filter((s) => s && s.expiresAt && s.expiresAt > now);
      }
    }
  } catch {}
  return [];
}

function savePersistedStories(stories: UserStory[]): void {
  try {
    const filePath = getStoragePath();
    const now = Date.now();
    const active = stories.filter((s) => s && s.expiresAt && s.expiresAt > now);
    fs.writeFileSync(filePath, JSON.stringify(active, null, 2), 'utf-8');
  } catch {}
}

function getStories(): UserStory[] {
  if (!globalForStories.storiesStore) {
    globalForStories.storiesStore = loadPersistedStories();
  }
  const now = Date.now();
  globalForStories.storiesStore = globalForStories.storiesStore.filter(
    (s) => s && s.expiresAt && s.expiresAt > now
  );
  return globalForStories.storiesStore;
}

export async function GET() {
  const stories = getStories();
  return NextResponse.json({ success: true, stories });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { story } = body;
    if (!story || !story.userId || !story.content) {
      return NextResponse.json({ error: 'Invalid story payload' }, { status: 400 });
    }

    const current = getStories();
    const newStory: UserStory = {
      id: story.id || `story_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: story.userId,
      username: story.username || 'user',
      name: story.name || 'User',
      avatar: story.avatar || '',
      content: story.content,
      mediaUrl: story.mediaUrl || '',
      bgGradient: story.bgGradient || 'from-indigo-600 via-purple-600 to-pink-600',
      createdAt: story.createdAt || Date.now(),
      expiresAt: story.expiresAt || Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      views: Array.isArray(story.views) ? story.views : [],
    };

    const updated = [newStory, ...current.filter((s) => s.id !== newStory.id)];
    globalForStories.storiesStore = updated;
    savePersistedStories(updated);

    return NextResponse.json({ success: true, story: newStory, stories: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save story' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { storyId, viewerUsername } = body;
    if (!storyId || !viewerUsername) {
      return NextResponse.json({ error: 'Missing storyId or viewerUsername' }, { status: 400 });
    }

    const stories = getStories();
    const target = stories.find((s) => s.id === storyId);
    if (target) {
      if (!target.views.includes(viewerUsername.toLowerCase())) {
        target.views.push(viewerUsername.toLowerCase());
        savePersistedStories(stories);
      }
    }
    return NextResponse.json({ success: true, stories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get('id');
    const username = searchParams.get('username');

    if (!storyId) {
      return NextResponse.json({ error: 'Missing story id' }, { status: 400 });
    }

    const current = getStories();
    const filtered = current.filter(
      (s) => s.id !== storyId || (username && s.username.toLowerCase() !== username.toLowerCase())
    );
    globalForStories.storiesStore = filtered;
    savePersistedStories(filtered);

    return NextResponse.json({ success: true, stories: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


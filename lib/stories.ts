import { UserStory } from '@/types/story';

const LOCAL_STORAGE_KEY = 'lmc_user_stories';

export function getLocalStories(): UserStory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const now = Date.now();
      return parsed.filter((s) => s && s.expiresAt && s.expiresAt > now);
    }
  } catch {}
  return [];
}

export function saveLocalStories(stories: UserStory[]): void {
  if (typeof window === 'undefined') return;
  try {
    const now = Date.now();
    const active = stories.filter((s) => s && s.expiresAt && s.expiresAt > now);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(active));
    try {
      const bc = new BroadcastChannel('lmc_stories_channel');
      bc.postMessage({ type: 'STORIES_UPDATED', stories: active });
      bc.close();
    } catch {}
  } catch {}
}

export async function fetchServerStories(): Promise<UserStory[]> {
  try {
    const res = await fetch('/api/stories', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.stories)) {
        saveLocalStories(data.stories);
        return data.stories;
      }
    }
  } catch {}
  return getLocalStories();
}

export async function postNewStory(story: Partial<UserStory>): Promise<UserStory | null> {
  try {
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.story && Array.isArray(data.stories)) {
        saveLocalStories(data.stories);
        return data.story;
      }
    }
  } catch {}

  // Fallback to local storage if offline
  const local = getLocalStories();
  const created: UserStory = {
    id: story.id || `story_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: story.userId || 'usr_local',
    username: story.username || 'user',
    name: story.name || 'User',
    avatar: story.avatar || '',
    content: story.content || '',
    mediaUrl: story.mediaUrl || '',
    bgGradient: story.bgGradient || 'from-indigo-600 via-purple-600 to-pink-600',
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    views: [],
  };
  const updated = [created, ...local];
  saveLocalStories(updated);
  return created;
}

export async function markStoryAsViewed(storyId: string, viewerUsername: string): Promise<void> {
  try {
    fetch('/api/stories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId, viewerUsername }),
    }).catch(() => null);
  } catch {}

  // Update local
  const stories = getLocalStories();
  const target = stories.find((s) => s.id === storyId);
  if (target && !target.views.includes(viewerUsername.toLowerCase())) {
    target.views.push(viewerUsername.toLowerCase());
    saveLocalStories(stories);
  }
}

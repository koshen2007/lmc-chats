export interface UserStory {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar: string;
  content: string; // text message or image caption
  mediaUrl?: string; // photo/image dataUrl or URL
  bgGradient?: string; // CSS gradient class for text status
  createdAt: number;
  expiresAt: number; // 24 hours from creation
  views: string[]; // usernames who viewed this story
}

export const STORY_GRADIENTS = [
  { name: 'Indigo Dream', value: 'from-indigo-600 via-purple-600 to-pink-600' },
  { name: 'Sunset Glow', value: 'from-amber-500 via-rose-500 to-purple-600' },
  { name: 'Emerald Forest', value: 'from-emerald-600 via-teal-600 to-cyan-600' },
  { name: 'Midnight Cyber', value: 'from-slate-900 via-indigo-950 to-slate-900' },
  { name: 'Neon Flame', value: 'from-orange-600 via-red-600 to-pink-600' },
  { name: 'Electric Violet', value: 'from-purple-800 via-violet-600 to-indigo-900' },
];


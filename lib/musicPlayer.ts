export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string;
  audioUrl: string;
  durationSec: number;
}

export interface RoomPlaybackState {
  groupId: string;
  track: MusicTrack;
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number; // Date.now() timestamp
  requestedBy: string;
}

export const CURATED_TRACKS: MusicTrack[] = [
  {
    id: 'lofi-chill',
    title: 'Rainy Night Lofi Study',
    artist: 'LMC Beats Collective',
    genre: 'Lofi Chill Hop',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300&auto=format&fit=crop&q=80',
    audioUrl: '/audio/lofi_chill_beats.wav',
    durationSec: 30,
  },
  {
    id: 'synthwave-neon',
    title: 'Neon Highway 1986',
    artist: 'CyberSquad',
    genre: 'Retro Synthwave',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
    audioUrl: '/audio/synthwave_neon.wav',
    durationSec: 25,
  },
  {
    id: 'cyber-drive',
    title: 'Future Abyss Club',
    artist: 'Neon Vibe Protocol',
    genre: 'Cyberpunk Bass',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
    audioUrl: '/audio/cyber_night_drive.wav',
    durationSec: 24,
  },
  {
    id: 'acoustic-peace',
    title: 'Golden Sunset Acoustic',
    artist: 'MellowStrings',
    genre: 'Coffeehouse Acoustic',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    audioUrl: '/audio/acoustic_peace.wav',
    durationSec: 26,
  },
];

/**
 * Format seconds into mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

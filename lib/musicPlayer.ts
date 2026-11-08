export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string;
  audioUrl: string;
  durationSec: number;
  isLiveStream?: boolean;
}

export interface RoomPlaybackState {
  groupId: string;
  track: MusicTrack;
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number; // Date.now() timestamp
  requestedBy: string;
}

// REAL High-Definition 24/7 Live Radio Stations & Real Music Streams
export const FEATURED_STATIONS: MusicTrack[] = [
  {
    id: 'ilove-hits',
    title: 'Top 40 & Global Pop Hits',
    artist: 'I Love Radio (Live Broadcast)',
    genre: 'Live Pop Radio',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://streams.ilovemusic.de/iloveradio1.mp3',
    durationSec: 0,
    isLiveStream: true,
  },
  {
    id: 'dancewave-club',
    title: 'Dance Wave 24/7 EDM & Club',
    artist: 'DanceWave Online',
    genre: 'Dance & EDM Radio',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://stream.dancewave.online/dance.mp3',
    durationSec: 0,
    isLiveStream: true,
  },
  {
    id: 'acoustic-serenade',
    title: 'Acoustic Melody & Strings',
    artist: 'Symphony Flow Collective',
    genre: 'Acoustic Flow',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    durationSec: 372,
    isLiveStream: false,
  },
  {
    id: 'piano-night-chill',
    title: 'Night Horizon & Smooth Grooves',
    artist: 'Velvet Horizon',
    genre: 'Chillhop Beats',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    durationSec: 423,
    isLiveStream: false,
  },
];

// Backwards-compatibility alias
export const CURATED_TRACKS = FEATURED_STATIONS;

/**
 * Format seconds into mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

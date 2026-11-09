// Chat Wallpaper & Bubble Theme Definitions for LMC Chats

export type WallpaperPresetId =
  | 'doodle'
  | 'midnight'
  | 'emerald'
  | 'sunset'
  | 'cyber'
  | 'matrix'
  | 'custom';

export type BubbleThemeId =
  | 'emerald'
  | 'indigo'
  | 'sunset'
  | 'cyber'
  | 'violet'
  | 'graphite';

export interface WallpaperPreset {
  id: WallpaperPresetId;
  name: string;
  previewBg: string; // CSS background style for thumbnail
  bgStyle: React.CSSProperties; // Applied to chat scroll container
}

export interface BubbleTheme {
  id: BubbleThemeId;
  name: string;
  colorHex: string;
  className: string; // Tailwind class applied to outgoing bubble
}

// Subtle repeating WhatsApp Dark Doodle SVG encoded as data URL
export const WHATSAPP_DOODLE_SVG = `data:image/svg+xml,%3Csvg width='360' height='360' viewBox='0 0 360 360' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.055'%3E%3Cpath d='M40 50C40 44.4772 44.4772 40 50 40H80C85.5228 40 90 44.4772 90 50V70C90 75.5228 85.5228 80 80 80H55L45 90V80C42.2386 80 40 77.7614 40 75V50Z' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='65' cy='60' r='3' fill='%23FFFFFF'/%3E%3Cpath d='M180 30L190 45H170L180 30Z' stroke='%23FFFFFF' stroke-width='2' stroke-linejoin='round'/%3E%3Ccircle cx='280' cy='60' r='18' stroke='%23FFFFFF' stroke-width='2'/%3E%3Cpath d='M275 58C275 58 277 62 280 62C283 62 285 58 285 58' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='274' cy='52' r='2' fill='%23FFFFFF'/%3E%3Ccircle cx='286' cy='52' r='2' fill='%23FFFFFF'/%3E%3Cpath d='M70 180C70 174.477 74.4772 170 80 170H110C115.523 170 120 174.477 120 180V195C120 200.523 115.523 205 110 205H95L85 215V205H80C74.4772 205 70 200.523 70 195V180Z' stroke='%23FFFFFF' stroke-width='2'/%3E%3Cpath d='M200 160L215 175M215 160L200 175' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round'/%3E%3Crect x='280' y='180' width='30' height='30' rx='8' stroke='%23FFFFFF' stroke-width='2'/%3E%3Cpath d='M290 195H300' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M295 190V200' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M50 300C55 290 70 290 75 300C80 310 95 310 100 300' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M180 280C170 280 165 290 165 300C165 310 175 320 185 320C195 320 205 310 205 300C205 290 195 280 180 280Z' stroke='%23FFFFFF' stroke-width='2'/%3E%3Cpath d='M270 290L290 310M290 290L270 310' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E`;

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'doodle',
    name: 'Dark Doodle',
    previewBg: 'linear-gradient(135deg, #0e131d 0%, #151c2a 100%)',
    bgStyle: {
      backgroundColor: '#0A0E17',
      backgroundImage: `url("${WHATSAPP_DOODLE_SVG}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '280px 280px',
    },
  },
  {
    id: 'midnight',
    name: 'OLED Obsidian',
    previewBg: 'radial-gradient(circle, #151c2a 0%, #06080d 100%)',
    bgStyle: {
      backgroundColor: '#06080D',
      backgroundImage: 'radial-gradient(circle at 50% 25%, #131A27 0%, #06080D 80%)',
    },
  },
  {
    id: 'emerald',
    name: 'WhatsApp Emerald',
    previewBg: 'linear-gradient(135deg, #091a14 0%, #050f0c 100%)',
    bgStyle: {
      backgroundColor: '#06100D',
      backgroundImage: `url("${WHATSAPP_DOODLE_SVG}"), radial-gradient(circle at 50% 30%, #0B251D 0%, #06100D 85%)`,
      backgroundRepeat: 'repeat, no-repeat',
      backgroundSize: '280px 280px, auto',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Velvet',
    previewBg: 'linear-gradient(135deg, #2b1029 0%, #100b1d 100%)',
    bgStyle: {
      backgroundColor: '#0D0817',
      backgroundImage: 'linear-gradient(145deg, #260C2E 0%, #130B24 45%, #080712 100%)',
    },
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    previewBg: 'linear-gradient(135deg, #042533 0%, #040e1b 100%)',
    bgStyle: {
      backgroundColor: '#020B14',
      backgroundImage: 'linear-gradient(145deg, #042533 0%, #061220 50%, #020710 100%)',
    },
  },
  {
    id: 'matrix',
    name: 'Matrix Dark',
    previewBg: 'linear-gradient(135deg, #062419 0%, #03100a 100%)',
    bgStyle: {
      backgroundColor: '#020C08',
      backgroundImage: 'linear-gradient(145deg, #07261C 0%, #03140E 50%, #010604 100%)',
    },
  },
];

export const BUBBLE_THEMES: BubbleTheme[] = [
  {
    id: 'emerald',
    name: 'WhatsApp Emerald',
    colorHex: '#005C4B',
    className: 'bg-gradient-to-r from-[#005C4B] to-[#007A64] text-[#E9F5EE]',
  },
  {
    id: 'indigo',
    name: 'Modern Indigo',
    colorHex: '#4F46E5',
    className: 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white',
  },
  {
    id: 'sunset',
    name: 'Velvet Rose',
    colorHex: '#E11D48',
    className: 'bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white',
  },
  {
    id: 'cyber',
    name: 'Cyber Cyan',
    colorHex: '#0284C7',
    className: 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white',
  },
  {
    id: 'violet',
    name: 'Electric Violet',
    colorHex: '#8B5CF6',
    className: 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white',
  },
  {
    id: 'graphite',
    name: 'Obsidian Slate',
    colorHex: '#334155',
    className: 'bg-gradient-to-r from-[#334155] to-[#1E293B] text-[#F1F5F9]',
  },
];

export function getWallpaperStyle(
  presetId: WallpaperPresetId,
  customImageUrl?: string | null
): React.CSSProperties {
  if (presetId === 'custom' && customImageUrl) {
    return {
      backgroundColor: '#06080D',
      backgroundImage: `linear-gradient(rgba(10, 14, 23, 0.65), rgba(10, 14, 23, 0.75)), url("${customImageUrl}")`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    };
  }

  const found = WALLPAPER_PRESETS.find((p) => p.id === presetId);
  return found ? found.bgStyle : WALLPAPER_PRESETS[0].bgStyle;
}

export function getBubbleClass(bubbleThemeId: BubbleThemeId): string {
  const found = BUBBLE_THEMES.find((b) => b.id === bubbleThemeId);
  return found ? found.className : BUBBLE_THEMES[0].className;
}


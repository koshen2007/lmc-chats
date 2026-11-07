export interface Sticker {
  id: string;
  name: string;
  url: string;
}

export const STICKERS: Sticker[] = [
  { id: 's1', name: 'Thumbs Up Cat', url: 'https://media.giphy.com/media/BzyTuYCmvSORqs1ABM/giphy.gif' },
  { id: 's2', name: 'Pop Cat', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { id: 's3', name: 'Party Parrot', url: 'https://media.giphy.com/media/l3q2zbskZp2j8wniE/giphy.gif' },
  { id: 's4', name: 'Doge Wow', url: 'https://media.giphy.com/media/oBQZIgNobc7EWQDNgam/giphy.gif' },
  { id: 's5', name: 'Bongo Cat', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },
  { id: 's6', name: 'Dancing Duck', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1NHN4dmsxNHU5aWV5OGtzdnNkaGVxdndnb29pZ2VucDZ3Z3E1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/uB0p3H91VjX1ZzP9yL/giphy.gif' },
  { id: 's7', name: 'Happy Seal', url: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif' },
  { id: 's8', name: 'Cool Glasses', url: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif' },
  { id: 's9', name: 'Fire Flame', url: 'https://media.giphy.com/media/QMHoU66sBXCAHonwvC/giphy.gif' },
  { id: 's10', name: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 's11', name: 'Pepe Cry', url: 'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif' },
  { id: 's12', name: 'Confetti Party', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: 's13', name: 'Cat Vibing', url: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif' },
  { id: 's14', name: 'Thinking Face', url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif' },
  { id: 's15', name: 'Hackerman', url: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif' },
  { id: 's16', name: 'Ship It Rocket', url: 'https://media.giphy.com/media/3ohnEqJ1XOfvWaSk7e/giphy.gif' },
];

export const AVATAR_OPTIONS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
  '/avatars/avatar-7.png',
  '/avatars/avatar-8.png',
  '/avatars/avatar-9.svg',
  '/avatars/avatar-10.svg',
  '/avatars/avatar-11.svg',
  '/avatars/avatar-12.svg',
  '/avatars/avatar-13.svg',
  '/avatars/avatar-14.svg',
  '/avatars/avatar-15.svg',
  '/avatars/avatar-16.svg',
];

export const FALLBACK_GIFS = [
  { id: 'g1', title: 'Celebration Confetti', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: 'g2', title: 'Typing Cat Fast', url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif' },
  { id: 'g3', title: 'Party Dance', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'g4', title: 'Code Deploy Green', url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif' },
  { id: 'g5', title: 'Coffee Late Night', url: 'https://media.giphy.com/media/oZEBLugoTNRxS/giphy.gif' },
  { id: 'g6', title: 'Fireworks Neon', url: 'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif' },
  { id: 'g7', title: 'Vibing Cat', url: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif' },
  { id: 'g8', title: 'Rocket Launch Ship It', url: 'https://media.giphy.com/media/3ohnEqJ1XOfvWaSk7e/giphy.gif' },
];

export const EMOJI_CATEGORIES = [
  {
    icon: '😀',
    label: 'Smileys & emotion',
    items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '🤫', '🤔', '😎', '🥳', '🥺', '😭', '😱', '🤯', '🔥', '💯', '✨'],
  },
  {
    icon: '👋',
    label: 'Hands & gestures',
    items: ['👋', '👌', '🤌', '✌️', '🤞', '🫰', '🤙', '👍', '👎', '👏', '🙌', '🫶', '🙏', '💪', '🫡', '👀', '❤️', '💔', '💖', '⭐'],
  },
  {
    icon: '🚀',
    label: 'Objects & symbols',
    items: ['🚀', '💻', '⚡', '🎉', '🎊', '🎯', '🎮', '💡', '📌', '✅', '❌', '🍕', '☕', '🍻', '🌮', '🌙', '🐱', '🐶', '🐸', '🤖'],
  },
];


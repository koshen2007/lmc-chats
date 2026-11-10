export interface AvatarConfig {
  skinColor: string;
  headShape: 'oval' | 'round' | 'square' | 'chiseled';
  hairStyle:
    | 'afro'
    | 'buzz'
    | 'messy'
    | 'fade'
    | 'wavy_long'
    | 'bun'
    | 'ponytail'
    | 'bob'
    | 'anime'
    | 'dreads'
    | 'flow'
    | 'bald';
  hairColor: string;
  eyeStyle: 'normal' | 'happy' | 'winking' | 'sparkle' | 'cool' | 'sleepy';
  eyeColor: string;
  eyebrows: 'natural' | 'arched' | 'bushy' | 'slit' | 'fierce';
  nose: 'button' | 'straight' | 'wide';
  mouth: 'smile_teeth' | 'smirk' | 'laugh' | 'grin' | 'calm' | 'fangs' | 'tongue';
  lipColor: string;
  beard: 'none' | 'stubble' | 'goatee' | 'full' | 'mustache';
  clothing: 'hoodie' | 'crewneck' | 'jacket' | 'tee' | 'bomber' | 'formal' | 'cyber';
  clothingColor: string;
  glasses: 'none' | 'round' | 'square' | 'shades' | 'visor' | 'cateye';
  glassesColor: string;
  accessory: 'none' | 'headphones' | 'earrings' | 'blush' | 'freckles';
  backdrop: string;
}

export const SKIN_TONES = [
  { id: 'pale', name: 'Alabaster', color: '#FCE7DF', shadow: '#E8BDB1' },
  { id: 'fair', name: 'Fair Warm', color: '#F8D3C5', shadow: '#E0A896' },
  { id: 'peach', name: 'Golden Peach', color: '#F0BD9D', shadow: '#D6946E' },
  { id: 'olive', name: 'Warm Olive', color: '#DE9E78', shadow: '#BE7850' },
  { id: 'tan', name: 'Honey Tan', color: '#C68359', shadow: '#A46036' },
  { id: 'chestnut', name: 'Rich Chestnut', color: '#9E5D38', shadow: '#7A3F20' },
  { id: 'deep', name: 'Deep Mocha', color: '#683B24', shadow: '#4B2513' },
  { id: 'espresso', name: 'Espresso', color: '#452618', shadow: '#2D160C' },
];

export const HAIR_COLORS = [
  { name: 'Jet Black', color: '#18181B' },
  { name: 'Dark Mocha', color: '#3E2723' },
  { name: 'Warm Auburn', color: '#78350F' },
  { name: 'Golden Blonde', color: '#FBBF24' },
  { name: 'Copper Ginger', color: '#EA580C' },
  { name: 'Pastel Rose', color: '#F472B6' },
  { name: 'Cyber Neon', color: '#06B6D4' },
  { name: 'Lavender Mist', color: '#A855F7' },
  { name: 'Emerald Sage', color: '#10B981' },
  { name: 'Platinum Silver', color: '#E2E8F0' },
];

export const EYE_COLORS = [
  { name: 'Deep Espresso', color: '#3B2314' },
  { name: 'Hazel Honey', color: '#784E18' },
  { name: 'Sapphire Blue', color: '#2563EB' },
  { name: 'Emerald Green', color: '#059669' },
  { name: 'Amethyst Purple', color: '#7C3AED' },
  { name: 'Storm Grey', color: '#64748B' },
  { name: 'Ruby Glow', color: '#E11D48' },
  { name: 'Golden Amber', color: '#D97706' },
];

export const CLOTHING_COLORS = [
  { name: 'Indigo Night', color: '#4F46E5', accent: '#3730A3' },
  { name: 'Crimson Red', color: '#E11D48', accent: '#9F1239' },
  { name: 'Cyber Cyan', color: '#0891B2', accent: '#155E75' },
  { name: 'Emerald Forest', color: '#059669', accent: '#065F46' },
  { name: 'Midnight Charcoal', color: '#1E293B', accent: '#0F172A' },
  { name: 'Mustard Gold', color: '#D97706', accent: '#92400E' },
  { name: 'Pastel Lilac', color: '#9333EA', accent: '#6B21A8' },
  { name: 'Clean Bone', color: '#F1F5F9', accent: '#CBD5E1' },
];

export const BACKDROP_OPTIONS = [
  { id: 'grad_indigo', name: 'Indigo Glow', bg: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', color: '#312E81' },
  { id: 'grad_sunset', name: 'Cyber Sunset', bg: 'linear-gradient(135deg, #4C0519 0%, #881337 100%)', color: '#881337' },
  { id: 'grad_emerald', name: 'Mint Emerald', bg: 'linear-gradient(135deg, #022C22 0%, #064E3B 100%)', color: '#064E3B' },
  { id: 'grad_cyber', name: 'Neon Abyss', bg: 'linear-gradient(135deg, #082F49 0%, #0C4A6E 100%)', color: '#0C4A6E' },
  { id: 'grad_violet', name: 'Mystic Purple', bg: 'linear-gradient(135deg, #3B0764 0%, #581C87 100%)', color: '#581C87' },
  { id: 'grad_amber', name: 'Golden Hour', bg: 'linear-gradient(135deg, #451A03 0%, #78350F 100%)', color: '#78350F' },
  { id: 'grad_dark', name: 'Onyx Slate', bg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#1E293B' },
  { id: 'transparent', name: 'Transparent', bg: 'transparent', color: 'none' },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: '#F8D3C5',
  headShape: 'oval',
  hairStyle: 'messy',
  hairColor: '#18181B',
  eyeStyle: 'normal',
  eyeColor: '#3B2314',
  eyebrows: 'natural',
  nose: 'button',
  mouth: 'smile_teeth',
  lipColor: '#E0A896',
  beard: 'none',
  clothing: 'hoodie',
  clothingColor: '#4F46E5',
  glasses: 'none',
  glassesColor: '#18181B',
  accessory: 'none',
  backdrop: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
};

export const PRESET_AVATARS: { name: string; tag: string; config: AvatarConfig }[] = [
  {
    name: 'Kai',
    tag: 'Streetwear Cool',
    config: {
      ...DEFAULT_AVATAR,
      skinColor: '#DE9E78',
      hairStyle: 'fade',
      hairColor: '#18181B',
      eyeStyle: 'normal',
      eyeColor: '#784E18',
      eyebrows: 'slit',
      mouth: 'smirk',
      beard: 'stubble',
      clothing: 'jacket',
      clothingColor: '#1E293B',
      glasses: 'shades',
      glassesColor: '#18181B',
      accessory: 'earrings',
      backdrop: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    },
  },
  {
    name: 'Aria',
    tag: 'Cyberpunk Neon',
    config: {
      ...DEFAULT_AVATAR,
      skinColor: '#FCE7DF',
      hairStyle: 'bob',
      hairColor: '#F472B6',
      eyeStyle: 'sparkle',
      eyeColor: '#7C3AED',
      eyebrows: 'arched',
      mouth: 'grin',
      lipColor: '#E11D48',
      clothing: 'cyber',
      clothingColor: '#0891B2',
      glasses: 'visor',
      glassesColor: '#06B6D4',
      accessory: 'headphones',
      backdrop: 'linear-gradient(135deg, #3B0764 0%, #581C87 100%)',
    },
  },
  {
    name: 'Zayn',
    tag: 'Chill Afrobeat',
    config: {
      ...DEFAULT_AVATAR,
      skinColor: '#9E5D38',
      hairStyle: 'afro',
      hairColor: '#18181B',
      eyeStyle: 'happy',
      eyeColor: '#3B2314',
      eyebrows: 'bushy',
      mouth: 'smile_teeth',
      beard: 'goatee',
      clothing: 'hoodie',
      clothingColor: '#D97706',
      glasses: 'round',
      glassesColor: '#D97706',
      accessory: 'none',
      backdrop: 'linear-gradient(135deg, #451A03 0%, #78350F 100%)',
    },
  },
  {
    name: 'Rin',
    tag: 'Anime Gamer',
    config: {
      ...DEFAULT_AVATAR,
      skinColor: '#F8D3C5',
      hairStyle: 'anime',
      hairColor: '#06B6D4',
      eyeStyle: 'winking',
      eyeColor: '#2563EB',
      eyebrows: 'arched',
      mouth: 'fangs',
      lipColor: '#F472B6',
      clothing: 'bomber',
      clothingColor: '#E11D48',
      glasses: 'none',
      glassesColor: '#18181B',
      accessory: 'blush',
      backdrop: 'linear-gradient(135deg, #4C0519 0%, #881337 100%)',
    },
  },
  {
    name: 'Marcus',
    tag: 'Executive Tech',
    config: {
      ...DEFAULT_AVATAR,
      skinColor: '#683B24',
      headShape: 'chiseled',
      hairStyle: 'buzz',
      hairColor: '#18181B',
      eyeStyle: 'cool',
      eyeColor: '#3B2314',
      eyebrows: 'natural',
      mouth: 'calm',
      beard: 'full',
      clothing: 'formal',
      clothingColor: '#1E293B',
      glasses: 'square',
      glassesColor: '#18181B',
      accessory: 'none',
      backdrop: 'linear-gradient(135deg, #022C22 0%, #064E3B 100%)',
    },
  },
  {
    name: 'Elena',
    tag: 'Pastel Dreamer',
    config: {
      ...DEFAULT_AVATAR,
      skinColor: '#F0BD9D',
      hairStyle: 'wavy_long',
      hairColor: '#FBBF24',
      eyeStyle: 'normal',
      eyeColor: '#059669',
      eyebrows: 'natural',
      mouth: 'smile_teeth',
      lipColor: '#EA580C',
      clothing: 'crewneck',
      clothingColor: '#9333EA',
      glasses: 'round',
      glassesColor: '#D97706',
      accessory: 'freckles',
      backdrop: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
    },
  },
];

export function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomAvatar(): AvatarConfig {
  const skin = getRandomElement(SKIN_TONES);
  const hair = getRandomElement(HAIR_COLORS);
  const eyes = getRandomElement(EYE_COLORS);
  const clothes = getRandomElement(CLOTHING_COLORS);
  const backdrop = getRandomElement(BACKDROP_OPTIONS);

  const hairStyles: AvatarConfig['hairStyle'][] = [
    'afro',
    'buzz',
    'messy',
    'fade',
    'wavy_long',
    'bun',
    'ponytail',
    'bob',
    'anime',
    'dreads',
    'flow',
  ];
  const headShapes: AvatarConfig['headShape'][] = ['oval', 'round', 'square', 'chiseled'];
  const eyeStyles: AvatarConfig['eyeStyle'][] = ['normal', 'happy', 'winking', 'sparkle', 'cool', 'sleepy'];
  const eyebrowsList: AvatarConfig['eyebrows'][] = ['natural', 'arched', 'bushy', 'slit', 'fierce'];
  const mouthList: AvatarConfig['mouth'][] = ['smile_teeth', 'smirk', 'laugh', 'grin', 'calm', 'fangs', 'tongue'];
  const beardList: AvatarConfig['beard'][] = ['none', 'none', 'none', 'stubble', 'goatee', 'full', 'mustache'];
  const clothesList: AvatarConfig['clothing'][] = ['hoodie', 'crewneck', 'jacket', 'tee', 'bomber', 'formal', 'cyber'];
  const glassesList: AvatarConfig['glasses'][] = ['none', 'none', 'round', 'square', 'shades', 'visor', 'cateye'];
  const accessories: AvatarConfig['accessory'][] = ['none', 'none', 'headphones', 'earrings', 'blush', 'freckles'];

  return {
    skinColor: skin.color,
    headShape: getRandomElement(headShapes),
    hairStyle: getRandomElement(hairStyles),
    hairColor: hair.color,
    eyeStyle: getRandomElement(eyeStyles),
    eyeColor: eyes.color,
    eyebrows: getRandomElement(eyebrowsList),
    nose: getRandomElement(['button', 'straight', 'wide']),
    mouth: getRandomElement(mouthList),
    lipColor: skin.shadow,
    beard: getRandomElement(beardList),
    clothing: getRandomElement(clothesList),
    clothingColor: clothes.color,
    glasses: getRandomElement(glassesList),
    glassesColor: '#18181B',
    accessory: getRandomElement(accessories),
    backdrop: backdrop.bg,
  };
}

/**
 * Builds pure standalone SVG markup for an AvatarConfig
 * ViewBox: 0 0 240 240
 */
export function renderAvatarSvgString(rawConfig?: Partial<AvatarConfig> | null): string {
  const config: AvatarConfig = {
    ...DEFAULT_AVATAR,
    ...(rawConfig || {}),
  };

  const skinColor = config.skinColor || DEFAULT_AVATAR.skinColor;
  const headShape = config.headShape || DEFAULT_AVATAR.headShape;
  const hairStyle = config.hairStyle || DEFAULT_AVATAR.hairStyle;
  const hairColor = config.hairColor || DEFAULT_AVATAR.hairColor;
  const eyeStyle = config.eyeStyle || DEFAULT_AVATAR.eyeStyle;
  const eyeColor = config.eyeColor || DEFAULT_AVATAR.eyeColor;
  const eyebrows = config.eyebrows || DEFAULT_AVATAR.eyebrows;
  const nose = config.nose || DEFAULT_AVATAR.nose;
  const mouth = config.mouth || DEFAULT_AVATAR.mouth;
  const lipColor = config.lipColor || DEFAULT_AVATAR.lipColor;
  const beard = config.beard || DEFAULT_AVATAR.beard;
  const clothing = config.clothing || DEFAULT_AVATAR.clothing;
  const clothingColor = config.clothingColor || DEFAULT_AVATAR.clothingColor;
  const glasses = config.glasses || DEFAULT_AVATAR.glasses;
  const glassesColor = config.glassesColor || DEFAULT_AVATAR.glassesColor;
  const accessory = config.accessory || DEFAULT_AVATAR.accessory;
  const backdrop = config.backdrop || DEFAULT_AVATAR.backdrop;

  // Skin tone shadow
  const matchedSkin = SKIN_TONES.find((s) => s.color.toLowerCase() === (skinColor || '').toLowerCase());
  const skinShadow = matchedSkin ? matchedSkin.shadow : '#C68359';

  // Hair Back (for long hairstyles)
  let hairBackSvg = '';
  if (hairStyle === 'wavy_long') {
    hairBackSvg = `
      <path d="M52 110 C45 150 48 200 68 230 C74 235 90 235 94 220 C100 185 96 140 96 115 Z" fill="${hairColor}" />
      <path d="M188 110 C195 150 192 200 172 230 C166 235 150 235 146 220 C140 185 144 140 144 115 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'ponytail') {
    hairBackSvg = `
      <path d="M150 78 C175 78 198 100 195 140 C193 160 180 185 174 195 C170 190 172 165 174 145 C176 115 160 90 148 84 Z" fill="${hairColor}" />
      <circle cx="150" cy="80" r="7" fill="#6366F1" />
    `;
  } else if (hairStyle === 'dreads') {
    hairBackSvg = `
      <path d="M55 110 C50 150 52 195 62 230 C66 230 76 225 76 210 C74 175 74 140 76 115 Z" fill="${hairColor}" />
      <path d="M185 110 C190 150 188 195 178 230 C174 230 164 225 164 210 C166 175 166 140 164 115 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'afro') {
    hairBackSvg = `
      <circle cx="120" cy="115" r="66" fill="${hairColor}" />
    `;
  }

  // Chest & Shoulders (Outfit)
  let outfitSvg = '';
  if (clothing === 'hoodie') {
    outfitSvg = `
      <!-- Hoodie shoulders -->
      <path d="M42 240 C42 195 72 178 120 178 C168 178 198 195 198 240 Z" fill="${clothingColor}" />
      <!-- Hood cowl around neck -->
      <path d="M85 174 C95 194 145 194 155 174 C162 188 152 205 120 205 C88 205 78 188 85 174 Z" fill="#18181B" opacity="0.3" />
      <path d="M90 175 C100 190 140 190 150 175 C142 198 98 198 90 175 Z" fill="${clothingColor}" />
      <!-- Drawstrings -->
      <line x1="110" y1="190" x2="108" y2="216" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
      <line x1="130" y1="190" x2="132" y2="216" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="108" cy="217" r="2" fill="#E2E8F0" />
      <circle cx="132" cy="217" r="2" fill="#E2E8F0" />
    `;
  } else if (clothing === 'jacket') {
    outfitSvg = `
      <!-- Inner shirt -->
      <path d="M42 240 C42 195 72 178 120 178 C168 178 198 195 198 240 Z" fill="#FFFFFF" />
      <!-- Jacket outer -->
      <path d="M42 240 C42 195 72 178 100 178 L95 240 Z" fill="${clothingColor}" />
      <path d="M198 240 C198 195 168 178 140 178 L145 240 Z" fill="${clothingColor}" />
      <!-- Lapels -->
      <path d="M100 178 L114 205 L96 220 Z" fill="${clothingColor}" filter="brightness(0.85)" />
      <path d="M140 178 L126 205 L144 220 Z" fill="${clothingColor}" filter="brightness(0.85)" />
    `;
  } else if (clothing === 'cyber') {
    outfitSvg = `
      <path d="M42 240 C42 195 72 178 120 178 C168 178 198 195 198 240 Z" fill="#0F172A" />
      <!-- Cyber high collar -->
      <path d="M86 172 L96 202 L144 202 L154 172 Z" fill="#1E293B" stroke="${clothingColor}" stroke-width="2" />
      <!-- Neon seams -->
      <line x1="72" y1="210" x2="102" y2="240" stroke="${clothingColor}" stroke-width="3" />
      <line x1="168" y1="210" x2="138" y2="240" stroke="${clothingColor}" stroke-width="3" />
      <circle cx="120" cy="220" r="5" fill="${clothingColor}" />
    `;
  } else if (clothing === 'formal') {
    outfitSvg = `
      <path d="M42 240 C42 195 72 178 120 178 C168 178 198 195 198 240 Z" fill="${clothingColor}" />
      <!-- White collar shirt -->
      <polygon points="120,205 102,175 138,175" fill="#FFFFFF" />
      <!-- Tie -->
      <polygon points="116,188 124,188 126,240 120,246 114,240" fill="#E11D48" />
    `;
  } else if (clothing === 'bomber') {
    outfitSvg = `
      <path d="M42 240 C42 195 72 178 120 178 C168 178 198 195 198 240 Z" fill="${clothingColor}" />
      <!-- Ribbed collar -->
      <path d="M92 178 C102 188 138 188 148 178" fill="none" stroke="#0F172A" stroke-width="6" stroke-linecap="round" />
      <!-- Center zipper -->
      <line x1="120" y1="186" x2="120" y2="240" stroke="#E2E8F0" stroke-width="2.5" />
    `;
  } else {
    // Crewneck or Tee
    outfitSvg = `
      <path d="M42 240 C42 195 72 178 120 178 C168 178 198 195 198 240 Z" fill="${clothingColor}" />
      <!-- Collar band -->
      <path d="M94 176 C104 190 136 190 146 176" fill="none" stroke="${clothingColor}" stroke-width="5" filter="brightness(0.85)" />
    `;
  }

  // Neck
  const neckSvg = `
    <rect x="106" y="148" width="28" height="34" rx="4" fill="${skinColor}" />
    <path d="M106 148 C114 160 126 160 134 148 C134 158 106 158 106 148 Z" fill="${skinShadow}" opacity="0.6" />
  `;

  // Head Shapes
  let headPath = '';
  if (headShape === 'round') {
    headPath = `M120 54 C74 54 70 96 70 124 C70 156 90 174 120 174 C150 174 170 156 170 124 C170 96 166 54 120 54 Z`;
  } else if (headShape === 'square') {
    headPath = `M120 55 C78 55 74 92 74 120 C74 150 86 172 120 172 C154 172 166 150 166 120 C166 92 162 55 120 55 Z`;
  } else if (headShape === 'chiseled') {
    headPath = `M120 55 C78 55 75 92 75 118 C75 146 96 174 120 174 C144 174 165 146 165 118 C165 92 162 55 120 55 Z`;
  } else {
    // Oval
    headPath = `M120 54 C78 54 74 95 74 122 C74 154 94 173 120 173 C146 173 166 154 166 122 C166 95 162 54 120 54 Z`;
  }

  // Ears
  const earsSvg = `
    <circle cx="72" cy="120" r="10" fill="${skinColor}" />
    <path d="M72 116 C70 119 70 123 73 125" fill="none" stroke="${skinShadow}" stroke-width="1.5" stroke-linecap="round" />
    <circle cx="168" cy="120" r="10" fill="${skinColor}" />
    <path d="M168 116 C170 119 170 123 167 125" fill="none" stroke="${skinShadow}" stroke-width="1.5" stroke-linecap="round" />
    ${
      accessory === 'earrings'
        ? `
      <circle cx="68" cy="127" r="3.5" fill="none" stroke="#F59E0B" stroke-width="2" />
      <circle cx="172" cy="127" r="3.5" fill="none" stroke="#F59E0B" stroke-width="2" />
    `
        : ''
    }
  `;

  // Eyebrows
  let eyebrowsSvg = '';
  if (eyebrows === 'bushy') {
    eyebrowsSvg = `
      <path d="M90 106 C96 102 112 102 116 106" fill="none" stroke="${hairColor}" stroke-width="4.5" stroke-linecap="round" />
      <path d="M124 106 C128 102 144 102 150 106" fill="none" stroke="${hairColor}" stroke-width="4.5" stroke-linecap="round" />
    `;
  } else if (eyebrows === 'arched') {
    eyebrowsSvg = `
      <path d="M90 108 C98 99 110 100 115 106" fill="none" stroke="${hairColor}" stroke-width="2.8" stroke-linecap="round" />
      <path d="M125 106 C130 100 142 99 150 108" fill="none" stroke="${hairColor}" stroke-width="2.8" stroke-linecap="round" />
    `;
  } else if (eyebrows === 'slit') {
    eyebrowsSvg = `
      <path d="M90 105 L103 103 M107 103 L115 105" fill="none" stroke="${hairColor}" stroke-width="3" stroke-linecap="round" />
      <path d="M125 105 C132 103 143 103 150 105" fill="none" stroke="${hairColor}" stroke-width="3" stroke-linecap="round" />
    `;
  } else if (eyebrows === 'fierce') {
    eyebrowsSvg = `
      <path d="M90 103 L115 107" fill="none" stroke="${hairColor}" stroke-width="3.5" stroke-linecap="round" />
      <path d="M125 107 L150 103" fill="none" stroke="${hairColor}" stroke-width="3.5" stroke-linecap="round" />
    `;
  } else {
    // Natural
    eyebrowsSvg = `
      <path d="M91 106 C98 103 110 103 115 106" fill="none" stroke="${hairColor}" stroke-width="3" stroke-linecap="round" />
      <path d="M125 106 C130 103 142 103 149 106" fill="none" stroke="${hairColor}" stroke-width="3" stroke-linecap="round" />
    `;
  }

  // Eyes
  let eyesSvg = '';
  if (eyeStyle === 'happy') {
    eyesSvg = `
      <path d="M94 122 C98 114 110 114 114 122" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round" />
      <path d="M126 122 C130 114 142 114 146 122" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round" />
    `;
  } else if (eyeStyle === 'winking') {
    eyesSvg = `
      <!-- Left winking arc -->
      <path d="M94 122 C98 116 110 116 114 122" fill="none" stroke="#18181B" stroke-width="3.5" stroke-linecap="round" />
      <!-- Right open eye -->
      <ellipse cx="136" cy="120" rx="9" ry="8" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
      <circle cx="136" cy="120" r="5.5" fill="${eyeColor}" />
      <circle cx="136" cy="120" r="2.8" fill="#09090B" />
      <circle cx="134" cy="118" r="1.8" fill="#FFFFFF" />
    `;
  } else if (eyeStyle === 'sparkle') {
    eyesSvg = `
      <!-- Left Eye -->
      <ellipse cx="104" cy="120" rx="9.5" ry="9" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
      <circle cx="104" cy="120" r="6" fill="${eyeColor}" />
      <circle cx="104" cy="120" r="3" fill="#09090B" />
      <polygon points="102,116 104,119 107,119 105,121 106,124 104,122 102,124 103,121" fill="#FFFFFF" />
      <!-- Right Eye -->
      <ellipse cx="136" cy="120" rx="9.5" ry="9" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
      <circle cx="136" cy="120" r="6" fill="${eyeColor}" />
      <circle cx="136" cy="120" r="3" fill="#09090B" />
      <polygon points="134,116 136,119 139,119 137,121 138,124 136,122 134,124 135,121" fill="#FFFFFF" />
    `;
  } else if (eyeStyle === 'cool') {
    eyesSvg = `
      <!-- Left Cool Narrow -->
      <ellipse cx="104" cy="120" rx="9" ry="6" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
      <circle cx="104" cy="120" r="4.5" fill="${eyeColor}" />
      <circle cx="104" cy="120" r="2" fill="#09090B" />
      <circle cx="102" cy="119" r="1.2" fill="#FFFFFF" />
      <!-- Right Cool Narrow -->
      <ellipse cx="136" cy="120" rx="9" ry="6" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
      <circle cx="136" cy="120" r="4.5" fill="${eyeColor}" />
      <circle cx="136" cy="120" r="2" fill="#09090B" />
      <circle cx="134" cy="119" r="1.2" fill="#FFFFFF" />
    `;
  } else {
    // Normal Confident Eye
    eyesSvg = `
      <!-- Left Eye -->
      <ellipse cx="104" cy="120" rx="9" ry="8" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
      <circle cx="104" cy="120" r="5.5" fill="${eyeColor}" />
      <circle cx="104" cy="120" r="2.8" fill="#09090B" />
      <circle cx="102" cy="118" r="1.6" fill="#FFFFFF" />
      <!-- Right Eye -->
      <ellipse cx="136" cy="120" rx="9" ry="8" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
      <circle cx="136" cy="120" r="5.5" fill="${eyeColor}" />
      <circle cx="136" cy="120" r="2.8" fill="#09090B" />
      <circle cx="134" cy="118" r="1.6" fill="#FFFFFF" />
    `;
  }

  // Nose
  let noseSvg = '';
  if (nose === 'straight') {
    noseSvg = `
      <path d="M120 118 L119 133 L124 133" fill="none" stroke="${skinShadow}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    `;
  } else if (nose === 'wide') {
    noseSvg = `
      <path d="M115 133 C118 135 122 135 125 133" fill="none" stroke="${skinShadow}" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="114" cy="133" r="1.5" fill="${skinShadow}" />
      <circle cx="126" cy="133" r="1.5" fill="${skinShadow}" />
    `;
  } else {
    // Button
    noseSvg = `
      <path d="M117 132 C119 135 121 135 123 132" fill="none" stroke="${skinShadow}" stroke-width="2.5" stroke-linecap="round" />
    `;
  }

  // Cheek details (Blush or Freckles)
  let cheekSvg = '';
  if (accessory === 'blush') {
    cheekSvg = `
      <ellipse cx="90" cy="132" rx="7" ry="4" fill="#FB7185" opacity="0.5" />
      <ellipse cx="150" cy="132" rx="7" ry="4" fill="#FB7185" opacity="0.5" />
    `;
  } else if (accessory === 'freckles') {
    cheekSvg = `
      <circle cx="89" cy="130" r="1.2" fill="${skinShadow}" />
      <circle cx="93" cy="132" r="1.2" fill="${skinShadow}" />
      <circle cx="96" cy="129" r="1.2" fill="${skinShadow}" />
      <circle cx="144" cy="129" r="1.2" fill="${skinShadow}" />
      <circle cx="147" cy="132" r="1.2" fill="${skinShadow}" />
      <circle cx="151" cy="130" r="1.2" fill="${skinShadow}" />
    `;
  }

  // Mouth & Smile (Snapchat/Bitmoji style)
  let mouthSvg = '';
  if (mouth === 'smile_teeth') {
    mouthSvg = `
      <!-- Mouth cavity -->
      <path d="M106 145 C106 160 134 160 134 145 Z" fill="#881337" stroke="#18181B" stroke-width="1.5" />
      <!-- Teeth row -->
      <path d="M107 145 C113 149 127 149 133 145 L133 148 C127 151 113 151 107 148 Z" fill="#FFFFFF" />
      <!-- Tongue bottom -->
      <path d="M112 156 C116 153 124 153 128 156 C125 159 115 159 112 156 Z" fill="#F43F5E" />
      <!-- Upper lip line -->
      <path d="M104 145 C112 147 128 147 136 145" fill="none" stroke="${lipColor}" stroke-width="2" stroke-linecap="round" />
    `;
  } else if (mouth === 'smirk') {
    mouthSvg = `
      <path d="M108 149 C118 149 132 144 136 142" fill="none" stroke="#18181B" stroke-width="3" stroke-linecap="round" />
      <path d="M136 140 C138 142 138 144 135 145" fill="none" stroke="#18181B" stroke-width="2" stroke-linecap="round" />
    `;
  } else if (mouth === 'laugh') {
    mouthSvg = `
      <path d="M105 144 C105 164 135 164 135 144 Z" fill="#991B1B" stroke="#18181B" stroke-width="1.5" />
      <path d="M107 144 H133 V148 H107 Z" fill="#FFFFFF" />
      <ellipse cx="120" cy="159" rx="8" ry="4" fill="#FB7185" />
    `;
  } else if (mouth === 'fangs') {
    mouthSvg = `
      <path d="M107 146 C107 158 133 158 133 146 Z" fill="#7F1D1D" stroke="#18181B" stroke-width="1.5" />
      <path d="M108 146 H132 V148 H108 Z" fill="#FFFFFF" />
      <!-- Left fang -->
      <polygon points="112,148 115,148 113.5,153" fill="#FFFFFF" />
      <!-- Right fang -->
      <polygon points="125,148 128,148 126.5,153" fill="#FFFFFF" />
    `;
  } else if (mouth === 'tongue') {
    mouthSvg = `
      <path d="M108 145 C108 156 132 156 132 145 Z" fill="#881337" stroke="#18181B" stroke-width="1.5" />
      <!-- Tongue sticking out -->
      <path d="M114 150 C114 162 126 162 126 150 Z" fill="#F43F5E" stroke="#18181B" stroke-width="1.5" />
      <line x1="120" y1="150" x2="120" y2="157" stroke="#BE123C" stroke-width="1" />
    `;
  } else if (mouth === 'grin') {
    mouthSvg = `
      <path d="M106 146 C112 154 128 154 134 146" fill="none" stroke="#18181B" stroke-width="3" stroke-linecap="round" />
    `;
  } else {
    // Calm / Neutral
    mouthSvg = `
      <path d="M110 148 C116 149 124 149 130 148" fill="none" stroke="#18181B" stroke-width="2.5" stroke-linecap="round" />
    `;
  }

  // Facial Hair (Beard / Mustache)
  let beardSvg = '';
  if (beard === 'stubble') {
    beardSvg = `
      <path d="M84 142 C92 166 148 166 156 142 C150 168 90 168 84 142 Z" fill="${hairColor}" opacity="0.25" />
    `;
  } else if (beard === 'goatee') {
    beardSvg = `
      <path d="M110 156 C114 160 126 160 130 156 C132 168 108 168 110 156 Z" fill="${hairColor}" />
      <path d="M112 141 C116 143 124 143 128 141" fill="none" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" />
    `;
  } else if (beard === 'full') {
    beardSvg = `
      <path d="M74 122 C74 158 92 178 120 178 C148 178 166 158 166 122 C164 152 144 168 120 168 C96 168 76 152 74 122 Z" fill="${hairColor}" />
      <path d="M108 141 C114 143 126 143 132 141 C126 145 114 145 108 141 Z" fill="${hairColor}" />
    `;
  } else if (beard === 'mustache') {
    beardSvg = `
      <path d="M107 141 C114 144 120 142 120 142 C120 142 126 144 133 141 C130 145 122 145 120 143 C118 145 110 145 107 141 Z" fill="${hairColor}" />
    `;
  }

  // Glasses / Eyewear
  let glassesSvg = '';
  if (glasses === 'round') {
    glassesSvg = `
      <circle cx="104" cy="120" r="14" fill="none" stroke="${glassesColor}" stroke-width="2.5" />
      <circle cx="136" cy="120" r="14" fill="none" stroke="${glassesColor}" stroke-width="2.5" />
      <line x1="118" y1="120" x2="122" y2="120" stroke="${glassesColor}" stroke-width="2.5" />
      <line x1="90" y1="118" x2="72" y2="116" stroke="${glassesColor}" stroke-width="2" />
      <line x1="150" y1="118" x2="168" y2="116" stroke="${glassesColor}" stroke-width="2" />
    `;
  } else if (glasses === 'square') {
    glassesSvg = `
      <rect x="91" y="108" width="25" height="22" rx="4" fill="none" stroke="${glassesColor}" stroke-width="2.5" />
      <rect x="124" y="108" width="25" height="22" rx="4" fill="none" stroke="${glassesColor}" stroke-width="2.5" />
      <line x1="116" y1="118" x2="124" y2="118" stroke="${glassesColor}" stroke-width="2.5" />
      <line x1="91" y1="116" x2="72" y2="116" stroke="${glassesColor}" stroke-width="2" />
      <line x1="149" y1="116" x2="168" y2="116" stroke="${glassesColor}" stroke-width="2" />
    `;
  } else if (glasses === 'shades') {
    glassesSvg = `
      <path d="M88 110 L118 110 C118 126 92 128 88 110 Z" fill="#09090B" opacity="0.9" stroke="${glassesColor}" stroke-width="2" />
      <path d="M122 110 L152 110 C148 128 122 126 122 110 Z" fill="#09090B" opacity="0.9" stroke="${glassesColor}" stroke-width="2" />
      <line x1="118" y1="112" x2="122" y2="112" stroke="${glassesColor}" stroke-width="3" />
      <!-- Lens reflection streak -->
      <line x1="94" y1="113" x2="102" y2="123" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4" stroke-linecap="round" />
      <line x1="128" y1="113" x2="136" y2="123" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4" stroke-linecap="round" />
    `;
  } else if (glasses === 'visor') {
    glassesSvg = `
      <path d="M84 112 C104 108 136 108 156 112 L154 125 C136 128 104 128 86 125 Z" fill="#06B6D4" opacity="0.85" stroke="#FFFFFF" stroke-width="1.5" />
      <line x1="88" y1="115" x2="152" y2="115" stroke="#EC4899" stroke-width="1.5" opacity="0.9" />
    `;
  }

  // Hair Front
  let hairFrontSvg = '';
  if (hairStyle === 'buzz') {
    hairFrontSvg = `
      <path d="M74 100 C74 60 90 52 120 52 C150 52 166 60 166 100 C154 92 142 90 120 90 C98 90 86 92 74 100 Z" fill="${hairColor}" opacity="0.85" />
    `;
  } else if (hairStyle === 'messy') {
    hairFrontSvg = `
      <path d="M68 96 C64 68 84 48 120 48 C156 48 176 68 172 96 C164 88 152 82 142 86 C134 82 126 78 118 84 C108 80 96 82 88 88 C80 84 72 88 68 96 Z" fill="${hairColor}" />
      <!-- Spiky strands -->
      <path d="M80 60 L74 46 L90 54 L104 42 L116 52 L132 40 L142 50 L156 44 L154 58" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'fade') {
    hairFrontSvg = `
      <path d="M74 106 C72 64 88 50 120 50 C152 50 168 64 166 106 C158 90 148 84 120 84 C92 84 82 90 74 106 Z" fill="${hairColor}" />
      <path d="M88 84 C102 78 138 78 152 84" fill="none" stroke="${hairColor}" stroke-width="4" stroke-linecap="round" />
    `;
  } else if (hairStyle === 'bob') {
    hairFrontSvg = `
      <path d="M68 100 C66 60 84 48 120 48 C156 48 174 60 172 100 C170 120 166 138 160 146 C154 110 152 90 134 90 C120 90 114 96 106 90 C88 90 86 110 80 146 C74 138 70 120 68 100 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'bun') {
    hairFrontSvg = `
      <!-- Top bun knot -->
      <circle cx="120" cy="38" r="18" fill="${hairColor}" />
      <circle cx="120" cy="38" r="8" fill="none" stroke="#6366F1" stroke-width="3" />
      <path d="M72 100 C72 64 88 54 120 54 C152 54 168 64 168 100 C154 88 138 86 120 86 C102 86 86 88 72 100 Z" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'anime') {
    hairFrontSvg = `
      <path d="M66 96 C62 58 84 42 120 42 C156 42 178 58 174 96 C166 90 156 86 148 94 C140 84 130 84 120 94 C110 84 100 84 92 94 C84 86 74 90 66 96 Z" fill="${hairColor}" />
      <!-- Sharp anime bangs hanging down -->
      <polygon points="90,75 96,104 102,78" fill="${hairColor}" />
      <polygon points="106,78 116,108 122,80" fill="${hairColor}" />
      <polygon points="124,80 132,102 138,76" fill="${hairColor}" />
      <polygon points="68,54 58,40 76,46" fill="${hairColor}" />
      <polygon points="164,48 178,38 168,56" fill="${hairColor}" />
    `;
  } else if (hairStyle === 'flow') {
    hairFrontSvg = `
      <path d="M70 100 C68 62 86 50 120 50 C154 50 172 62 170 100 C160 88 140 84 120 92 C100 84 80 88 70 100 Z" fill="${hairColor}" />
      <!-- Flow strands -->
      <path d="M120 54 C100 70 82 86 76 110" fill="none" stroke="${hairColor}" stroke-width="8" stroke-linecap="round" />
      <path d="M120 54 C140 70 158 86 164 110" fill="none" stroke="${hairColor}" stroke-width="8" stroke-linecap="round" />
    `;
  } else if (hairStyle === 'bald') {
    hairFrontSvg = '';
  } else {
    // Default / side part
    hairFrontSvg = `
      <path d="M72 100 C70 60 86 48 120 48 C154 48 170 60 168 100 C156 88 144 84 120 86 C96 84 84 88 72 100 Z" fill="${hairColor}" />
    `;
  }

  // Headphones accessory
  let headphonesSvg = '';
  if (accessory === 'headphones') {
    headphonesSvg = `
      <!-- Headband -->
      <path d="M60 114 C56 46 184 46 180 114" fill="none" stroke="#18181B" stroke-width="7" stroke-linecap="round" />
      <path d="M66 114 C62 54 178 54 174 114" fill="none" stroke="#6366F1" stroke-width="3" stroke-linecap="round" />
      <!-- Earcups -->
      <rect x="56" y="104" width="14" height="28" rx="6" fill="#18181B" stroke="#6366F1" stroke-width="2" />
      <rect x="170" y="104" width="14" height="28" rx="6" fill="#18181B" stroke="#6366F1" stroke-width="2" />
    `;
  }

  // Assemble the SVG
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%" shape-rendering="geometricPrecision">
  <defs>
    <clipPath id="circleClip">
      <circle cx="120" cy="120" r="116" />
    </clipPath>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${backdrop && backdrop.includes('#') ? backdrop.split('#')[1]?.split(' ')[0] ? '#' + backdrop.split('#')[1].split(' ')[0] : '#1E1B4B' : '#1E1B4B'}" />
      <stop offset="100%" stop-color="${backdrop && backdrop.includes('#') ? backdrop.split('#')[2]?.split(' ')[0] ? '#' + backdrop.split('#')[2].split(' ')[0] : '#312E81' : '#312E81'}" />
    </linearGradient>
  </defs>

  <g clip-path="url(#circleClip)">
    <!-- Backdrop Background -->
    <rect width="240" height="240" fill="url(#bgGrad)" />

    <!-- 1. Hair Back -->
    ${hairBackSvg}

    <!-- 2. Torso / Outfit -->
    ${outfitSvg}

    <!-- 3. Neck -->
    ${neckSvg}

    <!-- 4. Head Base -->
    <path d="${headPath}" fill="${skinColor}" />

    <!-- 5. Ears & Piercings -->
    ${earsSvg}

    <!-- 6. Cheeks (Blush/Freckles) -->
    ${cheekSvg}

    <!-- 7. Nose -->
    ${noseSvg}

    <!-- 8. Mouth -->
    ${mouthSvg}

    <!-- 9. Beard / Mustache -->
    ${beardSvg}

    <!-- 10. Eyes -->
    ${eyesSvg}

    <!-- 11. Eyebrows -->
    ${eyebrowsSvg}

    <!-- 12. Glasses / Eyewear -->
    ${glassesSvg}

    <!-- 13. Hair Front -->
    ${hairFrontSvg}

    <!-- 14. Accessories (Headphones) -->
    ${headphonesSvg}
  </g>
  
  <!-- Outer subtle boundary ring -->
  <circle cx="120" cy="120" r="116" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
</svg>
  `.trim();
}

/**
 * Converts raw SVG markup string into a browser data URL (Base64)
 */
export function svgToDataUrl(svgString: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return `data:image/svg+xml;base64,${Buffer.from(svgString, 'utf-8').toString('base64')}`;
    }
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      const base64 = window.btoa(
        encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        )
      );
      return `data:image/svg+xml;base64,${base64}`;
    }
  } catch (err) {
    console.error('Base64 encoding fallback:', err);
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const DEFAULT_AVATAR_DATA_URL = svgToDataUrl(renderAvatarSvgString(DEFAULT_AVATAR));


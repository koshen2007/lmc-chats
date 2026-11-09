/**
 * LMC Chats Interactive Bot & Slash Command Engine ("LMC Bot 🤖")
 * Telegram/Discord-style slash commands:
 * /roast, /poll, /bunk, /confess, /whisper, /decide, /play, /music, /help
 */

export interface SlashCommandDefinition {
  command: string; // e.g. '/roast'
  syntax: string; // e.g. '/roast [name]'
  title: string;
  description: string;
  badge: string;
  category: 'fun' | 'utility' | 'privacy' | 'media';
  icon: string; // Lucide icon identifier or emoji
}

export const SLASH_COMMANDS: SlashCommandDefinition[] = [
  {
    command: '/roast',
    syntax: '/roast [name]',
    title: 'Savage Roast',
    description: 'Brutally roast a friend in college Hinglish 🔥',
    badge: 'Fun',
    category: 'fun',
    icon: 'Flame',
  },
  {
    command: '/poll',
    syntax: '/poll Question | Option 1 | Option 2',
    title: 'Interactive Poll',
    description: 'Create a live voting poll with real-time percentages 📊',
    badge: 'Utility',
    category: 'utility',
    icon: 'BarChart2',
  },
  {
    command: '/bunk',
    syntax: '/bunk [Subject/Lecture]',
    title: 'Bunk Meter',
    description: "Launch a live 'Who's Bunking?' counter card 🏃‍♂️💨",
    badge: 'College',
    category: 'fun',
    icon: 'Footprints',
  },
  {
    command: '/confess',
    syntax: '/confess [secret message]',
    title: 'Anonymous Confession',
    description: 'Post a 100% anonymous confession card in the channel 🕵️',
    badge: 'Secret',
    category: 'privacy',
    icon: 'Mask',
  },
  {
    command: '/whisper',
    syntax: '/whisper @username [secret text]',
    title: 'Private Whisper',
    description: 'Send a locked message visible ONLY to tagged recipient 🔒',
    badge: 'Encrypted',
    category: 'privacy',
    icon: 'Lock',
  },
  {
    command: '/decide',
    syntax: '/decide Option A | Option B',
    title: 'Canteen Decision / Coin Flip',
    description: 'Flip a coin or settle canteen bets with a bot verdict 🪙',
    badge: 'Decide',
    category: 'fun',
    icon: 'Dices',
  },
  {
    command: '/play',
    syntax: '/play [song title or query]',
    title: 'Play Music',
    description: 'Stream synced audio in the room via Telegram Music Bot 🎵',
    badge: 'Music',
    category: 'media',
    icon: 'Music',
  },
  {
    command: '/music',
    syntax: '/music',
    title: 'Open Music Bot',
    description: 'Browse curated study & party playlist tracks 🎧',
    badge: 'Music',
    category: 'media',
    icon: 'Disc',
  },
  {
    command: '/help',
    syntax: '/help',
    title: 'LMC Bot Help',
    description: 'List all available bot commands and shortcuts 🤖',
    badge: 'Help',
    category: 'utility',
    icon: 'HelpCircle',
  },
];

/**
 * 25+ Savage College Hinglish Roasts
 */
export const COLLEGE_ROASTS = [
  '{name} bhai ki attendance itni kam hai ki professor ko lagta hai yeh ghost enrollment hai 👻',
  '{name} exam se ek raat pehle syllabus dekh ke kehta hai "Bhai passing marks kitne hote hain?" 🤡',
  '{name} viva mein aise blank khada rehta hai jaise 404 Error Not Found chal raha ho dimag mein 🧠❌',
  '{name} canteen mein dost ka samosa todne sabse aage, bill split karne mein sabse peeche 🥟📉',
  '{name} coding assignment mein semicolon miss karke kehta hai "Server hack ho gaya bhai" 💻🤦‍♂️',
  '{name} ka confidence level: 0% prep ke sath "Bhai 9 CGPA pakki hai" bolna 💀',
  '{name} 9 baje ke lecture ke liye 11 baje uth ke group pe poochhta hai "Attendance lagi kya?" 🛏️😴',
  '{name} group project mein contribution: Sirf PPT ka font size change karna 📊🥱',
  '{name} crush ko hi bolne mein 3 semester nikal diye, tab tak uski shaadi ka card aa gaya 💌💔',
  '{name} library sirf AC ki hawa khane aur phone charge karne jata hai 🔌❄️',
  '{name} placement drive mein resume dekh ke HR ne kaha "Bhai hobbies mein sleeping mat likha kar" 📄🛌',
  '{name} jab bhi bolta hai "Bhai kal se pakka padhai shuru", syllabus bhi hans deta hai 📚🤣',
  '{name} backbench par baith ke aisi acting karta hai jaise NASA ka satellite launch observe kar raha ho 🚀🔭',
  '{name} canteen wale bhaiya se udhari maangne mein gold medalist hai 🥇☕',
  '{name} ka phone 24 ghante silent rehta hai fir bhi kehta hai "Yaar call bohot aate hain" 📱📳',
  '{name} internal exam mein dost ki sheet aise taakta hai jaise Kohinoor heera chori karna ho 💎👀',
  '{name} assignment submission deadline se 1 minute pehle font color change karke "Submitted" bolta hai ⏰🔥',
  '{name} Gym ka 1 saal ka subscription leke sirf 2 din gaya aur protein shake ka status lagaya 🏋️‍♂️🥤',
  '{name} Wi-Fi connect hote hi 4K reels chalane lagta hai, lecture gayab 📶🎬',
  '{name} bolta hai "Mera startup idea unicorn banega", par idea abhi tak chai ki tapri se aage nahi badha 🦄☕',
  '{name} practical exam mein multimeter dekh ke poochhta hai "Yeh FM radio hai kya?" 📻⚡',
  '{name} college fest mein VIP pass maangne sabke aage haath jodta hai 🎟️🕺',
  '{name} semester start hote hi bolta hai "Is baar first rank meri", fir midsem mein passing ke lale padte hain 📉🥴',
  '{name} jab lecture bunk karta hai toh canteen mein direct HOD ke bagal wali table pe baith jata hai 🏃‍♂️🚨',
  '{name} group chat mein 500 audio bhejega par ek baar viva mein vivaad hone par aawaz nahi niklegi 🎙️🤐',
  '{name} ke paas notes maangne mat jana, uske paas khud pichle saal ke calendar par scribble kiya hua milega 🗓️✏️',
];

export interface SlashExecutionResult {
  isCommand: boolean;
  handledInternally?: boolean; // For /play, /music, etc.
  newMsg?: {
    sender_name: string;
    sender_username?: string;
    sender_avatar?: string;
    sender_bio?: string;
    content: string;
    msg_type:
      | 'text'
      | 'poll'
      | 'bunk_meter'
      | 'confession'
      | 'whisper'
      | 'roast'
      | 'decision';
    metadata?: Record<string, any>;
  };
  feedbackToast?: string;
}

/**
 * Filter matching commands for autocomplete as the user types
 */
export function getMatchingCommands(query: string): SlashCommandDefinition[] {
  if (!query || !query.startsWith('/')) return [];
  const clean = query.trim().toLowerCase();
  if (clean === '/') return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((cmd) => cmd.command.toLowerCase().startsWith(clean));
}

/**
 * Execute or parse outgoing Slash Command
 */
export function executeSlashCommand(
  rawInput: string,
  user: { name: string; username: string; avatar?: string }
): SlashExecutionResult {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('/')) {
    return { isCommand: false };
  }

  const parts = trimmed.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = trimmed.slice(cmd.length).trim();

  // 1. /roast [name]
  if (cmd === '/roast') {
    const target = args || 'Bhai';
    const randomRoast = COLLEGE_ROASTS[Math.floor(Math.random() * COLLEGE_ROASTS.length)];
    const roastText = randomRoast.replace(/\{name\}/g, target);

    return {
      isCommand: true,
      newMsg: {
        sender_name: 'LMC Bot 🤖',
        sender_username: 'lmc_bot',
        sender_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=lmc_bot_roaster',
        sender_bio: 'Official LMC College Roaster & Meme Master',
        content: `🔥 **SAVAGE ROAST FOR ${target.toUpperCase()}:**\n\n"${roastText}"`,
        msg_type: 'roast',
        metadata: {
          target_name: target,
          roast: roastText,
          author_username: user.username,
        },
      },
      feedbackToast: `Savage roast delivered for ${target}! 🔥`,
    };
  }

  // 2. /poll Question | Option 1 | Option 2 | Option 3
  if (cmd === '/poll') {
    if (!args) {
      return {
        isCommand: true,
        feedbackToast: '⚠️ Usage: /poll Question | Option 1 | Option 2',
      };
    }

    const segments = args.split('|').map((s) => s.trim()).filter(Boolean);
    const question = segments[0] || 'College Poll';
    let options = segments.slice(1);

    if (options.length < 2) {
      options = ['Haan Bhai! 👍', 'Nahi Yaar! 👎'];
    }

    const pollMetadata = {
      question,
      options: options.map((opt, idx) => ({
        id: `opt_${idx}`,
        text: opt,
        votes: [] as string[], // usernames of voters
      })),
      total_votes: 0,
      created_by: user.username || user.name,
    };

    return {
      isCommand: true,
      newMsg: {
        sender_name: user.name,
        sender_username: user.username,
        sender_avatar: user.avatar,
        content: `📊 **POLL:** ${question}`,
        msg_type: 'poll',
        metadata: pollMetadata,
      },
      feedbackToast: 'Interactive Poll created! 📊',
    };
  }

  // 3. /bunk [Subject/Lecture]
  if (cmd === '/bunk') {
    const lecture = args || 'Next Lecture';
    const bunkMetadata = {
      lecture,
      created_by: user.username || user.name,
      created_by_avatar: user.avatar,
      bunkers: [
        {
          username: user.username || user.name,
          name: user.name,
          avatar: user.avatar || '',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return {
      isCommand: true,
      newMsg: {
        sender_name: user.name,
        sender_username: user.username,
        sender_avatar: user.avatar,
        content: `🏃‍♂️💨 **BUNK ALERT:** Who is bunking **${lecture}**?`,
        msg_type: 'bunk_meter',
        metadata: bunkMetadata,
      },
      feedbackToast: `Bunk Meter launched for ${lecture}! 🏃‍♂️💨`,
    };
  }

  // 4. /confess [secret message]
  if (cmd === '/confess') {
    if (!args) {
      return {
        isCommand: true,
        feedbackToast: '⚠️ Usage: /confess [your secret message]',
      };
    }

    return {
      isCommand: true,
      newMsg: {
        sender_name: 'Anonymous 🕵️',
        sender_username: 'anonymous',
        sender_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=anonymous_confession',
        sender_bio: '100% Identity-Shielded LMC Confession',
        content: args,
        msg_type: 'confession',
        metadata: {
          is_confession: true,
          timestamp: new Date().toISOString(),
        },
      },
      feedbackToast: 'Anonymous confession posted safely! 🕵️',
    };
  }

  // 5. /whisper @username [secret text]
  if (cmd === '/whisper') {
    if (!args) {
      return {
        isCommand: true,
        feedbackToast: '⚠️ Usage: /whisper @username [secret text]',
      };
    }

    const whisperParts = args.split(' ');
    const targetTag = whisperParts[0] || '';
    const secretContent = whisperParts.slice(1).join(' ').trim();
    const cleanTarget = targetTag.replace(/^@/, '').trim().toLowerCase();

    if (!cleanTarget || !secretContent) {
      return {
        isCommand: true,
        feedbackToast: '⚠️ Usage: /whisper @username [secret text]',
      };
    }

    return {
      isCommand: true,
      newMsg: {
        sender_name: user.name,
        sender_username: user.username,
        sender_avatar: user.avatar,
        content: secretContent,
        msg_type: 'whisper',
        metadata: {
          target_username: cleanTarget,
          sender_username: (user.username || user.name).toLowerCase(),
        },
      },
      feedbackToast: `Whisper locked for @${cleanTarget}! 🔒`,
    };
  }

  // 6. /decide Option A | Option B
  if (cmd === '/decide') {
    let options: string[] = [];
    if (args.includes('|')) {
      options = args.split('|').map((s) => s.trim()).filter(Boolean);
    } else if (args.toLowerCase().includes(' vs ')) {
      options = args.split(/ vs /i).map((s) => s.trim()).filter(Boolean);
    } else if (args.toLowerCase().includes(' or ')) {
      options = args.split(/ or /i).map((s) => s.trim()).filter(Boolean);
    }

    if (options.length < 2) {
      // Coin flip
      options = ['Heads (Chai Piyein) 🪙☕', 'Tails (Class Jayein) 🪙📚'];
    }

    const winner = options[Math.floor(Math.random() * options.length)];
    const commentaries = [
      'LMC Bot ka antim faisla: Koi behas nahi chalegi! ⚖️',
      'Kismat ne bol diya hai, ab chup chaap sunlo! 🎲',
      'Canteen wale bhaiya ne bhi yahi vote diya tha! 🥟',
      '100% AI Quantum Calculation ke baad yeh nateeja nikla! 🤖✨',
    ];
    const commentary = commentaries[Math.floor(Math.random() * commentaries.length)];

    return {
      isCommand: true,
      newMsg: {
        sender_name: 'LMC Bot 🤖',
        sender_username: 'lmc_bot',
        sender_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=lmc_bot_decider',
        content: `🪙 **CANTEEN VERDICT:**\n\nWinner: **${winner}**\n\n*${commentary}*`,
        msg_type: 'decision',
        metadata: {
          options,
          winner,
          commentary,
          decided_for: user.name,
        },
      },
      feedbackToast: `Verdict: ${winner}! 🪙`,
    };
  }

  // 7. /help
  if (cmd === '/help') {
    const helpLines = SLASH_COMMANDS.map(
      (c) => `• **${c.command}** — ${c.description}`
    ).join('\n');

    return {
      isCommand: true,
      newMsg: {
        sender_name: 'LMC Bot 🤖',
        sender_username: 'lmc_bot',
        sender_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=lmc_bot',
        content: `🤖 **LMC CHATS BOT COMMANDS & SHORTCUTS:**\n\n${helpLines}\n\n*Type \`/\` in chat to open interactive autocomplete menu anytime!*`,
        msg_type: 'text',
      },
    };
  }

  // Unhandled / other slash command
  return { isCommand: false };
}


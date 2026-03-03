// SloppyFilter - Keyword Expansion Engine
// Takes a user topic and expands it to related terms for better matching

const TOPIC_EXPANSIONS = {
  // Tech & AI
  'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'llm', 'gpt', 'claude', 'chatgpt', 'openai', 'anthropic', 'generative ai', 'large language model', 'transformer', 'diffusion model', 'stable diffusion', 'midjourney'],
  'programming': ['coding', 'software', 'developer', 'javascript', 'python', 'react', 'typescript', 'web dev', 'backend', 'frontend', 'api', 'github', 'open source'],
  'crypto': ['bitcoin', 'ethereum', 'blockchain', 'web3', 'defi', 'nft', 'solana', 'cryptocurrency', 'btc', 'eth'],

  // Health & Fitness
  'fitness': ['workout', 'exercise', 'gym', 'strength training', 'weightlifting', 'cardio', 'running', 'nutrition', 'muscle', 'bodybuilding', 'calisthenics', 'hiit', 'abs', 'core', 'pull up', 'push up', 'squat', 'deadlift', 'bench press', 'fat loss', 'weight loss', 'cut', 'bulk', 'protein', 'gains', 'physique', 'form', 'sets', 'reps', 'lifting', 'shred', 'lean', 'mass', 'powerlifting', 'crossfit', 'training', 'fit', 'body'],
  'health': ['wellness', 'mental health', 'nutrition', 'diet', 'sleep', 'meditation', 'mindfulness', 'longevity', 'biohacking', 'recovery', 'injury', 'mobility', 'flexibility', 'stretching'],
  'habits': ['routine', 'discipline', 'productivity', 'morning routine', 'self improvement', 'behavior', 'consistency', 'atomic habits', 'habit stacking'],

  // Business & Finance
  'business': ['startup', 'entrepreneur', 'marketing', 'saas', 'revenue', 'growth', 'strategy', 'founder', 'venture capital', 'bootstrapping'],
  'finance': ['investing', 'stocks', 'personal finance', 'money', 'budgeting', 'wealth', 'passive income', 'dividends', 'index funds', 'retirement'],
  'marketing': ['seo', 'social media', 'content marketing', 'email marketing', 'ads', 'branding', 'copywriting', 'funnel', 'conversion'],

  // Science & Learning
  'science': ['physics', 'biology', 'chemistry', 'neuroscience', 'psychology', 'research', 'study', 'experiment', 'discovery'],
  'history': ['historical', 'ancient', 'war', 'civilization', 'documentary', 'archival'],
  'philosophy': ['stoicism', 'ethics', 'epistemology', 'logic', 'wisdom', 'meaning', 'consciousness'],

  // Creative
  'music': ['guitar', 'piano', 'production', 'mixing', 'songwriting', 'music theory', 'beats', 'recording'],
  'design': ['ui', 'ux', 'graphic design', 'typography', 'branding', 'figma', 'illustration', 'art'],
  'photography': ['camera', 'lightroom', 'editing', 'portrait', 'landscape', 'cinematography', 'videography'],

  // Gaming
  'gaming': ['game', 'playthrough', 'review', 'esports', 'strategy', 'rpg', 'fps', 'indie game'],

  // Nature & Outdoors
  'nature': ['wildlife', 'animals', 'environment', 'hiking', 'camping', 'outdoor', 'national park', 'conservation'],
  'cooking': ['recipe', 'food', 'chef', 'kitchen', 'meal prep', 'nutrition', 'baking', 'cuisine'],
};

// Block list presets — content users commonly want gone
const BLOCK_PRESETS = {
  ai_slop: {
    label: 'AI Slop',
    description: 'Mass-produced AI-generated content with no real human behind it',
    title_patterns: [
      // Classic AI slop formulas
      'you won\'t believe', 'shocking truth', 'they don\'t want you to know',
      'secret revealed', 'watch before deleted', 'banned video',
      'the truth about', 'what they\'re hiding', 'nobody is talking about',
      'this changes everything', 'will shock you', 'you need to see this',
      // Faceless channel patterns
      'compilation #', '(full video)', 'in 60 seconds', 'explained in',
      'top 10 facts', 'top 5 facts', 'amazing facts', 'mind blowing facts',
      'did you know', 'fun facts about',
      // Lo-fi / ambient AI spam
      'lofi hip hop', 'study music', 'relaxing music', 'sleep music',
      'calm music', 'meditation music', 'rain sounds', 'white noise',
      // AI motivation spam
      'motivational speech', 'powerful speech', 'must watch', 'life changing speech',
      // AI news summary spam
      'daily news', 'morning news', 'news update', 'breaking:', 'just happened',
    ],
    channel_patterns: [],
    flags: {
      excessive_caps: true,
      excessive_punctuation: true,
      emoji_stuffed: true,
    }
  },
  clickbait: {
    label: 'Clickbait',
    description: 'Misleading titles and thumbnails designed to trick you into clicking',
    title_patterns: [
      'you won\'t believe', 'this changes everything', 'gone wrong',
      'emotional', 'insane reaction', 'unbelievable', 'jaw dropping',
      'mind blowing', 'life changing', 'everyone is talking about',
      'not clickbait', 'gone sexual', 'i quit', 'i\'m done',
      'goodbye', 'we need to talk', 'announcement', 'important',
      'i can\'t believe', 'they actually did it', 'this is crazy',
      'i was wrong', '24 hours', 'challenge gone wrong',
    ],
    flags: {
      excessive_caps: true,
      excessive_punctuation: true,
    }
  },
  politics: {
    label: 'Politics & News Drama',
    description: 'Political commentary, outrage news, partisan content',
    title_patterns: [
      'democrat', 'republican', 'liberal', 'conservative', 'trump', 'biden',
      'maga', 'woke', 'left wing', 'right wing', 'mainstream media', 'fake news',
      'breaking news', 'just in', 'political', 'congress', 'senate', 'election',
    ],
  },
  sports: {
    label: 'Sports',
    description: 'Sports highlights, commentary, and news',
    title_patterns: [
      'nfl', 'nba', 'mlb', 'nhl', 'soccer', 'football', 'basketball', 'baseball',
      'highlights', 'game recap', 'traded', 'draft', 'championship', 'super bowl',
      'world cup', 'match', 'tournament', 'playoffs',
    ],
  },
  rage_bait: {
    label: 'Rage Bait',
    description: 'Content engineered to make you angry — manufactured outrage',
    title_patterns: [
      'destroyed', 'owns', 'rekt', 'triggered', 'melts down', 'can\'t handle',
      'loses it', 'freaks out', 'goes off', 'gets destroyed', 'shuts down',
      'debunked', 'fact checked', 'called out', 'ratio\'d',
      'this is what they want', 'wake up', 'they\'re lying', 'mainstream media',
      'do we really need', 'this is america', 'this is why',
    ],
  },
  celebrity_drama: {
    label: 'Celebrity Drama',
    description: 'Celebrity gossip, feuds, and entertainment news',
    title_patterns: [
      'beef', 'drama', 'cancelled', 'exposed', 'clout', 'shade', 'response to',
      'reacts to', 'calls out', 'dissed', 'feud', 'break up', 'cheating',
      'lawsuit', 'arrested', 'controversy', 'diss track', 'claps back',
    ],
  },
  brain_rot: {
    label: 'Brain Rot / Shorts',
    description: 'Mindless short-form content — YouTube Shorts, Reels-style videos',
    flags: {
      is_short: true,
    },
    title_patterns: [
      'pov:', '#shorts', '#short', 'sigma', 'ohio', 'rizz', 'skibidi',
      'gyatt', 'fanum tax', 'mewing', 'npc', 'slay', 'no cap', 'bussin',
    ],
  },
  spam_channels: {
    label: 'Content Farms',
    description: 'Mass-production channels with no real human creator',
    flags: {
      excessive_caps: true,
      excessive_punctuation: true,
      emoji_stuffed: true,
    }
  }
};

// Expand a user topic string into related search terms
function expandTopic(topic) {
  const normalized = topic.toLowerCase().trim();
  const terms = new Set([normalized]);

  // Check direct match in expansion table
  if (TOPIC_EXPANSIONS[normalized]) {
    TOPIC_EXPANSIONS[normalized].forEach(t => terms.add(t));
  }

  // Check if user topic matches any expansion key partially
  Object.entries(TOPIC_EXPANSIONS).forEach(([key, expansions]) => {
    if (key.includes(normalized) || normalized.includes(key)) {
      terms.add(key);
      expansions.forEach(t => terms.add(t));
    }
    // Check if topic matches any expansion term
    if (expansions.some(e => e.includes(normalized) || normalized.includes(e))) {
      terms.add(key);
      expansions.forEach(t => terms.add(t));
    }
  });

  return Array.from(terms);
}

// Check if text matches a topic (returns true if relevant)
function matchesTopic(text, expandedTerms) {
  const normalized = text.toLowerCase();
  return expandedTerms.some(term => normalized.includes(term));
}

// Check if content should be blocked by a preset
function matchesBlockPreset(text, presetKey) {
  const preset = BLOCK_PRESETS[presetKey];
  if (!preset || !preset.title_patterns) return false;
  const normalized = text.toLowerCase();
  return preset.title_patterns.some(pattern => normalized.includes(pattern));
}

// Detect AI slop / spam flags in title
function detectSpamFlags(text) {
  const flags = {};

  // Count uppercase letters vs total letters
  const letters = text.replace(/[^a-zA-Z]/g, '');
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  flags.excessive_caps = letters.length > 10 && (upperCount / letters.length) > 0.5;

  // Count punctuation
  const punctCount = (text.match(/[!?]/g) || []).length;
  flags.excessive_punctuation = punctCount >= 3;

  // Count emojis
  const emojiCount = (text.match(/\p{Emoji}/gu) || []).length;
  flags.emoji_stuffed = emojiCount >= 4;

  return flags;
}

// Export for use by filter engine
if (typeof module !== 'undefined') {
  module.exports = { expandTopic, matchesTopic, matchesBlockPreset, detectSpamFlags, BLOCK_PRESETS, TOPIC_EXPANSIONS };
}

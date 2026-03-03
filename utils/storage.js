// SloppyFilter - Storage utilities
// Handles saving/loading user settings via Chrome's sync storage

const DEFAULT_SETTINGS = {
  enabled: true,
  topics: [],           // What user wants to SEE e.g. ['AI', 'fitness']
  allowedChannels: [],  // Channels always shown regardless of presets e.g. ['Kurzgesagt', 'Veritasium']
  customBlocks: [],     // Custom words/phrases user wants to block
  blockPresets: {       // Which block presets are enabled
    ai_slop: true,      // Faceless channels, AI voice-overs, content farms
    brain_rot: false,   // YouTube Shorts, mindless viral content
    clickbait: false,   // Misleading titles and thumbnails
    rage_bait: false,   // Manufactured outrage content
    politics: false,    // Political commentary and news drama
    sports: false,      // Sports highlights and commentary
    celebrity_drama: false, // Gossip, feuds, entertainment news
    spam_channels: true,    // Mass-production low-effort channels
  },
  strictMode: false,    // If true: hide anything NOT matching topics
};

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      // Migrate old 'shorts' key to 'brain_rot' if needed
      if (result.blockPresets && 'shorts' in result.blockPresets) {
        result.blockPresets.brain_rot = result.blockPresets.shorts;
        delete result.blockPresets.shorts;
      }
      // Ensure all preset keys exist
      result.blockPresets = { ...DEFAULT_SETTINGS.blockPresets, ...result.blockPresets };
      // Ensure allowedChannels exists (migration for existing installs)
      if (!result.allowedChannels) result.allowedChannels = [];
      resolve(result);
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, resolve);
  });
}

function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') callback(changes);
  });
}

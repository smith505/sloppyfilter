// SloppyFilter - Storage utilities
// Handles saving/loading user settings via Chrome's sync storage

const DEFAULT_SETTINGS = {
  enabled: true,
  topics: [],
  allowedChannels: [],
  customBlocks: [],
  blockPresets: {
    ai_slop:         true,   // core product
    spam_channels:   true,   // core product
    clickbait:       true,   // on by default
    rage_bait:       true,   // on by default
    brain_rot:       false,  // user choice: Shorts
    politics:        false,  // user choice
    sports:          false,  // user choice
    celebrity_drama: false,  // user choice
  },
  strictMode: false,
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

// SloppyFilter - Background Service Worker
// Handles extension lifecycle and future AI scoring layer

// Set default settings on first install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const defaults = {
      enabled: true,
      topics: [],
      customBlocks: [],
      blockPresets: {
        ai_slop: true,
        brain_rot: false,
        clickbait: false,
        rage_bait: false,
        politics: false,
        sports: false,
        celebrity_drama: false,
        spam_channels: true,
      },
      strictMode: false,
    };
    await chrome.storage.sync.set(defaults);
    console.log('[SloppyFilter] Installed with default settings.');
  }
});

// Keep service worker alive for message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ status: 'alive' });
  }
  return true;
});

// SloppyFilter - Background Service Worker

// Set default settings on first install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const defaults = {
      enabled: true,
      topics: [],
      allowedChannels: [],
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

// Update the badge count shown on the extension icon
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'badgeUpdate' && sender.tab?.id) {
    const count = message.count;
    chrome.action.setBadgeText({
      text: count > 0 ? String(count) : '',
      tabId: sender.tab.id,
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#7c3aed',
      tabId: sender.tab.id,
    });
    return false; // no async response needed
  }

  if (message.type === 'ping') {
    sendResponse({ status: 'alive' });
    return false; // sendResponse called synchronously
  }
});

// Clear badge when tab navigates to a new page
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

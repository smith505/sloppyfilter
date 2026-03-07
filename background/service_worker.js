// SloppyFilter - Background Service Worker

// ── Per-tab filter counts (session memory) ──
const tabCounts = new Map(); // tabId → filteredCount

// ── Install defaults ──
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set({
      enabled: true,
      topics: [],
      allowedChannels: [],
      customBlocks: [],
      blockPresets: {
        ai_slop:         true,   // core product
        spam_channels:   true,   // core product
        clickbait:       true,   // on by default — this IS the slop
        rage_bait:       true,   // on by default
        brain_rot:       false,  // user choice: Shorts
        politics:        false,  // user choice
        sports:          false,  // user choice
        celebrity_drama: false,  // user choice
      },
      strictMode: false,
    });
    console.log('[SloppyFilter] Installed.');
  }
});

// ── Messages from content scripts and popup ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Content script → update badge + track count
  if (message.type === 'badgeUpdate' && sender.tab?.id) {
    const { count } = message;
    tabCounts.set(sender.tab.id, count);
    chrome.action.setBadgeText({
      text: count > 0 ? String(count) : '',
      tabId: sender.tab.id,
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#7c3aed',
      tabId: sender.tab.id,
    });
    return false;
  }

  // Popup → get total filtered across all open tabs
  if (message.type === 'getStats') {
    const total = Array.from(tabCounts.values()).reduce((a, b) => a + b, 0);
    sendResponse({ total });
    return false;
  }

  // Health check
  if (message.type === 'ping') {
    sendResponse({ status: 'alive' });
    return false;
  }
});

// ── Clean up counts when a tab closes or navigates away ──
chrome.tabs.onRemoved.addListener((tabId) => {
  tabCounts.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabCounts.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

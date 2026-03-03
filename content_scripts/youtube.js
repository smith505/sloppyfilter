// SloppyFilter - YouTube Content Script (v3)

(async function () {
  'use strict';

  const filterEngine = await initFilterEngine();

  // ── Extract title + channel + isShort ──
  function extractVideoData(element) {
    let title = '';
    let channel = '';
    let isShort = false;

    // 1. Detect Shorts
    if (
      element.querySelector('ytm-shorts-lockup-view-model') ||
      element.querySelector('ytm-shorts-lockup-view-model-v2')
    ) {
      isShort = true;
      const shortsEl =
        element.querySelector('ytm-shorts-lockup-view-model') ||
        element.querySelector('ytm-shorts-lockup-view-model-v2');
      title = shortsEl?.querySelector('h3 a, h3 span, h3')?.textContent?.trim() || '';
    }

    // 2. New-style video (yt-lockup-view-model)
    else if (element.querySelector('yt-lockup-view-model:not([class*="ad"])')) {
      const lockup = element.querySelector('yt-lockup-view-model');
      title =
        lockup?.querySelector('yt-lockup-metadata-view-model h3 a')?.textContent?.trim() ||
        lockup?.querySelector('yt-lockup-metadata-view-model h3')?.textContent?.trim() ||
        lockup?.querySelector('h3 a')?.textContent?.trim() ||
        '';
      channel =
        lockup?.querySelector('yt-content-metadata-view-model a[href*="/@"]')?.textContent?.trim() ||
        lockup?.querySelector('yt-decorated-avatar-view-model a')?.getAttribute('href')?.replace(/^\//, '') ||
        '';
    }

    // 3. Old-style video (ytd-rich-grid-media)
    else if (element.querySelector('ytd-rich-grid-media')) {
      const media = element.querySelector('ytd-rich-grid-media');
      title =
        media?.querySelector('#video-title')?.textContent?.trim() ||
        media?.querySelector('yt-formatted-string#video-title')?.textContent?.trim() ||
        '';
      channel =
        media?.querySelector('ytd-channel-name yt-formatted-string')?.textContent?.trim() ||
        media?.querySelector('#channel-name')?.textContent?.trim() ||
        '';
      if (element.querySelector('a[href*="/shorts/"]')) isShort = true;
    }

    // 4. Fallback
    if (!title) {
      title =
        element.querySelector('#video-title')?.textContent?.trim() ||
        element.querySelector('h3 a')?.textContent?.trim() ||
        element.querySelector('[title]')?.getAttribute('title') ||
        '';
    }

    return { title, channel, description: '', isShort };
  }

  // ── Throttled badge counter (max one message per 200ms) ──
  let filteredCount = 0;
  let badgePending = false;
  function sendBadgeUpdate() {
    if (badgePending) return;
    badgePending = true;
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: 'badgeUpdate', count: filteredCount }).catch(() => {});
      badgePending = false;
    }, 200);
  }

  // ── Hide/show helpers ──
  function hideEl(el, reason) {
    if (el.dataset.ffHidden) return;
    el.dataset.ffHidden = reason;
    el.style.setProperty('display', 'none', 'important');
    filteredCount++;
    sendBadgeUpdate();
  }

  function showEl(el) {
    el.style.removeProperty('display');
    delete el.dataset.ffHidden;
  }

  // ── Process one video card ──
  function processItem(item) {
    if (!item?.isConnected) return;
    if (item.querySelector('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')) return;

    const data = extractVideoData(item);
    const result = filterEngine.evaluate(data);

    if (!result.show) {
      hideEl(item, result.reason);
    } else if (item.dataset.ffHidden) {
      showEl(item);
    }
  }

  // ── Hide Shorts shelves ──
  function processShortsShelves() {
    if (!filterEngine.settings.enabled) return;
    const enabled = filterEngine.settings.blockPresets?.brain_rot;

    document.querySelectorAll('ytd-rich-section-renderer').forEach(section => {
      const hasShorts =
        section.querySelector('ytm-shorts-lockup-view-model') ||
        section.querySelector('ytm-shorts-lockup-view-model-v2') ||
        section.querySelector('ytd-reel-item-renderer') ||
        (section.querySelector('#title, #title-text')?.textContent?.trim() === 'Shorts');

      if (hasShorts) {
        if (enabled) hideEl(section, 'shorts shelf');
        else if (section.dataset.ffHidden === 'shorts shelf') showEl(section);
      }
    });

    document.querySelectorAll('ytd-rich-shelf-renderer').forEach(shelf => {
      const hasShorts =
        shelf.querySelector('ytm-shorts-lockup-view-model') ||
        shelf.querySelector('ytm-shorts-lockup-view-model-v2') ||
        shelf.querySelector('ytd-reel-item-renderer');

      if (hasShorts) {
        const container = shelf.closest('ytd-rich-section-renderer') || shelf;
        if (enabled) hideEl(container, 'shorts shelf');
        else if (container.dataset.ffHidden === 'shorts shelf') showEl(container);
      }
    });

    document.querySelectorAll('ytd-rich-item-renderer').forEach(item => {
      const isShort =
        item.querySelector('ytm-shorts-lockup-view-model') ||
        item.querySelector('ytm-shorts-lockup-view-model-v2');
      if (!isShort) return;
      if (enabled) hideEl(item, 'short');
      else if (item.dataset.ffHidden === 'short') showEl(item);
    });
  }

  const ITEM_SELECTOR = 'ytd-rich-item-renderer';

  function processAll() {
    document.querySelectorAll(ITEM_SELECTOR).forEach(processItem);
    processShortsShelves();
  }

  // ── MutationObserver with rAF batching — catches every scroll-loaded item ──
  let rafPending = false;
  const pendingNodes = new Set();

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        pendingNodes.add(node);
      }
    }
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        for (const node of pendingNodes) {
          if (node.matches?.(ITEM_SELECTOR)) {
            processItem(node);
          } else {
            node.querySelectorAll?.(ITEM_SELECTOR).forEach(processItem);
          }
        }
        pendingNodes.clear();
        processShortsShelves();
      });
    }
  });

  function startObserving() {
    // Re-query target each time — handles SPA navigation
    const target =
      document.querySelector('ytd-rich-grid-renderer') ||
      document.getElementById('content') ||
      document.body;
    observer.disconnect();
    observer.observe(target, { childList: true, subtree: true });
  }

  // ── SPA navigation ──
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => { startObserving(); processAll(); }, 800);
      setTimeout(processAll, 2000);
    }
  }).observe(document.body, { childList: true, subtree: true });

  // ── Settings change: reset counter and re-evaluate everything ──
  onSettingsChanged(async () => {
    await new Promise(r => setTimeout(r, 150));
    filteredCount = 0;
    sendBadgeUpdate();
    document.querySelectorAll('[data-ff-hidden]').forEach(showEl);
    processAll();
  });

  // ── Init ──
  function init() {
    startObserving();
    processAll();
    setTimeout(processAll, 1000);
    setTimeout(processAll, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

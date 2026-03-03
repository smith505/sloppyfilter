// FocusFeed - Twitter/X Content Script (v2)

(async function () {
  'use strict';

  const filterEngine = await initFilterEngine();

  // ── Extract data from a tweet element ──
  function extractTweetData(element) {
    const textEl = element.querySelector('[data-testid="tweetText"]');
    const nameEl = element.querySelector('[data-testid="User-Name"]');

    const isAd =
      !!element.querySelector('[data-testid="promotedIndicator"]') ||
      !!element.querySelector('[aria-label*="Promoted"]') ||
      element.textContent.includes('Promoted');

    return {
      title: textEl?.textContent?.trim() || '',
      channel: nameEl?.textContent?.trim() || '',
      description: '',
      isShort: false,
      isAd,
    };
  }

  // ── Hide/show helpers ──
  function hideEl(el, reason) {
    if (el.dataset.ffHidden) return;
    el.dataset.ffHidden = reason;
    el.style.setProperty('display', 'none', 'important');
  }

  function showEl(el) {
    el.style.removeProperty('display');
    delete el.dataset.ffHidden;
  }

  // ── Process one tweet ──
  function processElement(element) {
    if (!element?.isConnected) return;

    const data = extractTweetData(element);

    if (data.isAd) {
      hideEl(element, 'ad');
      return;
    }

    if (!data.title && !data.channel) return;

    const result = filterEngine.evaluate(data);

    if (!result.show) {
      hideEl(element, result.reason);
    } else if (element.dataset.ffHidden) {
      showEl(element);
    }
  }

  const TWEET_SELECTOR = 'article[data-testid="tweet"]';

  function processAll() {
    document.querySelectorAll(TWEET_SELECTOR).forEach(processElement);
  }

  // ── MutationObserver for infinite scroll ──
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.(TWEET_SELECTOR)) { processElement(node); continue; }
        node.querySelectorAll?.(TWEET_SELECTOR).forEach(processElement);
      }
    }
  });

  function startObserving() {
    const target =
      document.querySelector('main') ||
      document.querySelector('[data-testid="primaryColumn"]') ||
      document.body;
    observer.observe(target, { childList: true, subtree: true });
  }

  // ── SPA navigation ──
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(processAll, 800);
    }
  }).observe(document.body, { childList: true, subtree: true });

  // ── Settings change ──
  onSettingsChanged(async () => {
    await new Promise(r => setTimeout(r, 150));
    document.querySelectorAll('[data-ff-hidden]').forEach(showEl);
    processAll();
  });

  // ── Init ──
  function init() {
    startObserving();
    processAll();
    setTimeout(processAll, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

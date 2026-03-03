// SloppyFilter - Core Filter Engine
// Decides whether a piece of content should be shown or hidden

class FilterEngine {
  constructor(settings) {
    this.settings = settings;
    this.expandedTopics = this._buildExpandedTopics(settings.topics);
    this.customBlockTerms = settings.customBlocks.map(t => t.toLowerCase().trim());
  }

  // Build expanded topic list from user's topic strings
  _buildExpandedTopics(topics) {
    const allTerms = new Set();
    topics.forEach(topic => {
      const expanded = expandTopic(topic);
      expanded.forEach(t => allTerms.add(t));
    });
    return Array.from(allTerms);
  }

  // Main decision: should we show this content item?
  // Returns: { show: bool, reason: string }
  evaluate(item) {
    if (!this.settings.enabled) return { show: true, reason: 'extension disabled' };

    const text = this._getItemText(item);

    // 1. Custom user block terms — always win, even over topics
    if (this._matchesCustomBlock(text)) {
      return { show: false, reason: 'custom block term' };
    }

    // 2. Shorts — always blocked if brain_rot is on, topics can't override
    if (this.settings.blockPresets?.brain_rot && item.isShort) {
      return { show: false, reason: 'shorts blocked' };
    }

    // 3. Topic whitelist — if user has topics and this matches, show it
    //    Topics override block presets: "I want fitness" saves a fitness video
    //    from being caught by AI Slop even if the title looks spammy
    if (this.expandedTopics.length > 0 && matchesTopic(text, this.expandedTopics)) {
      return { show: true, reason: 'topic match' };
    }

    // 4. Block presets — run against everything not saved by topic whitelist
    for (const [presetKey, enabled] of Object.entries(this.settings.blockPresets)) {
      if (!enabled) continue;
      if (presetKey === 'brain_rot') continue; // already handled above

      if (matchesBlockPreset(text, presetKey)) {
        return { show: false, reason: `blocked: ${presetKey}` };
      }

      const preset = BLOCK_PRESETS[presetKey];
      if (preset && preset.flags) {
        const flags = detectSpamFlags(text);
        const flaggedByPreset = Object.entries(preset.flags).some(
          ([flag, required]) => required && flags[flag]
        );
        if (flaggedByPreset) {
          return { show: false, reason: `spam flags: ${presetKey}` };
        }
      }
    }

    // 5. Strict mode — hide anything that didn't match topics
    if (this.settings.strictMode && this.expandedTopics.length > 0) {
      return { show: false, reason: 'off-topic (strict mode)' };
    }

    return { show: true, reason: 'passed' };
  }

  // Extract searchable text from an item
  _getItemText(item) {
    return [
      item.title || '',
      item.channel || '',
      item.description || '',
    ].join(' ').toLowerCase();
  }

  // Check against user's custom block terms
  _matchesCustomBlock(text) {
    return this.customBlockTerms.some(term => text.includes(term));
  }

  // Update settings without creating a new engine
  updateSettings(newSettings) {
    this.settings = newSettings;
    this.expandedTopics = this._buildExpandedTopics(newSettings.topics);
    this.customBlockTerms = newSettings.customBlocks.map(t => t.toLowerCase().trim());
  }
}

// Global engine instance — initialized once per page
let engine = null;

async function initFilterEngine() {
  const settings = await loadSettings();
  engine = new FilterEngine(settings);

  // Re-init when settings change
  onSettingsChanged(async () => {
    const updated = await loadSettings();
    if (engine) {
      engine.updateSettings(updated);
    }
  });

  return engine;
}

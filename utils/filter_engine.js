// SloppyFilter - Core Filter Engine
// Decides whether a piece of content should be shown or hidden

class FilterEngine {
  constructor(settings) {
    this.settings = settings;
    this.expandedTopics = this._buildExpandedTopics(settings.topics);
    this.customBlockTerms = settings.customBlocks.map(t => t.toLowerCase().trim());
    this.allowedChannels = (settings.allowedChannels || []).map(c => c.toLowerCase().trim());
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

    // 1. Custom user block terms — always win, even over whitelists
    if (this._matchesCustomBlock(text)) {
      return { show: false, reason: 'custom block term' };
    }

    // 2. Channel whitelist — "I always want to see this creator"
    //    Overrides all presets. If you said "show Kurzgesagt", they show.
    if (this._matchesAllowedChannel(item.channel)) {
      return { show: true, reason: 'allowed channel' };
    }

    // 3. Shorts — blocked if brain_rot is on (even whitelisted channels' Shorts)
    if (this.settings.blockPresets?.brain_rot && item.isShort) {
      return { show: false, reason: 'shorts blocked' };
    }

    // 4. Topic whitelist — if user has topics and this matches, show it
    //    Topics override block presets so fitness content isn't caught by AI Slop
    if (this.expandedTopics.length > 0 && matchesTopic(text, this.expandedTopics)) {
      return { show: true, reason: 'topic match' };
    }

    // 5. Block presets — run against everything not saved by a whitelist
    for (const [presetKey, enabled] of Object.entries(this.settings.blockPresets)) {
      if (!enabled) continue;
      if (presetKey === 'brain_rot') continue; // handled above

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

    // 6. Strict mode — hide anything that didn't match topics
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

  // Check if channel is in the user's always-show list
  // Partial match so "Kurzgesagt" matches "Kurzgesagt – In a Nutshell"
  _matchesAllowedChannel(channel) {
    if (!channel || this.allowedChannels.length === 0) return false;
    const ch = channel.toLowerCase().trim();
    return this.allowedChannels.some(allowed => ch.includes(allowed) || allowed.includes(ch));
  }

  // Update settings without creating a new engine
  updateSettings(newSettings) {
    this.settings = newSettings;
    this.expandedTopics = this._buildExpandedTopics(newSettings.topics);
    this.customBlockTerms = newSettings.customBlocks.map(t => t.toLowerCase().trim());
    this.allowedChannels = (newSettings.allowedChannels || []).map(c => c.toLowerCase().trim());
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

// SloppyFilter - Popup Controller

const PRESET_ORDER = [
  'ai_slop',
  'brain_rot',
  'clickbait',
  'rage_bait',
  'politics',
  'sports',
  'celebrity_drama',
  'spam_channels',
];

const PRESET_LABELS = {
  ai_slop:         { label: 'AI Slop',      desc: 'Faceless channels, AI voice-overs, content farms' },
  brain_rot:       { label: 'Shorts',        desc: 'YouTube Shorts and mindless viral content' },
  clickbait:       { label: 'Clickbait',     desc: 'Misleading titles designed to get clicks' },
  rage_bait:       { label: 'Rage Bait',     desc: 'Manufactured outrage designed to make you angry' },
  politics:        { label: 'Politics',      desc: 'Political commentary and partisan content' },
  sports:          { label: 'Sports',        desc: 'Highlights, scores, sports commentary' },
  celebrity_drama: { label: 'Celebrity',     desc: 'Gossip, feuds, and entertainment news' },
  spam_channels:   { label: 'Content Farms', desc: 'Mass-production low-effort channels' },
};

let currentSettings = null;

// ── Init ──
async function init() {
  currentSettings = await loadSettings();
  renderAll();
  await refreshCount();
  attachListeners();
}

function renderAll() {
  const enabled = currentSettings.enabled;
  document.getElementById('masterToggle').checked = enabled;
  setHeroState(enabled);
  document.getElementById('strictMode').checked = currentSettings.strictMode;
  renderTags('topicTags',   currentSettings.topics,               'topic');
  renderTags('channelTags', currentSettings.allowedChannels || [], 'channel');
  renderTags('blockTags',   currentSettings.customBlocks,          'block');
  renderChips();
}

function setHeroState(enabled) {
  const hero = document.getElementById('hero');
  const status = document.getElementById('heroStatus');
  hero.classList.toggle('paused', !enabled);
  status.textContent = enabled ? 'Blocking AI slop' : 'Paused';
}

// ── Stats: ask service worker for total across all tabs ──
async function refreshCount() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'getStats' }, (response) => {
      if (chrome.runtime.lastError) { resolve(); return; }
      const total = response?.total ?? 0;
      document.getElementById('blockedCount').textContent =
        total > 0 ? total.toLocaleString() : '0';
      resolve();
    });
  });
}

// ── Render ──
function renderTags(containerId, items, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach((item, index) => {
    const tag = document.createElement('span');
    tag.className = `tag ${type}`;
    tag.appendChild(document.createTextNode(item));
    const rm = document.createElement('span');
    rm.className = 'tag-remove';
    rm.dataset.index = index;
    rm.dataset.type = type;
    rm.textContent = '×';
    tag.appendChild(rm);
    container.appendChild(tag);
  });
}

function renderChips() {
  const container = document.getElementById('presetChips');
  container.innerHTML = '';
  PRESET_ORDER.forEach(key => {
    const meta = PRESET_LABELS[key];
    const active = currentSettings.blockPresets[key] || false;
    const chip = document.createElement('button');
    chip.className = `chip${active ? ' active' : ''}`;
    chip.dataset.preset = key;
    chip.title = meta.desc;
    chip.textContent = meta.label;
    container.appendChild(chip);
  });
}

// ── Listeners ──
function attachListeners() {
  document.getElementById('masterToggle').addEventListener('change', async (e) => {
    currentSettings.enabled = e.target.checked;
    setHeroState(currentSettings.enabled);
    await save();
  });

  document.getElementById('strictMode').addEventListener('change', async (e) => {
    currentSettings.strictMode = e.target.checked;
    await save();
  });

  document.getElementById('presetChips').addEventListener('click', async (e) => {
    const chip = e.target.closest('.chip[data-preset]');
    if (!chip) return;
    const key = chip.dataset.preset;
    currentSettings.blockPresets[key] = !currentSettings.blockPresets[key];
    chip.classList.toggle('active', currentSettings.blockPresets[key]);
    await save();
  });

  document.getElementById('addTopic').addEventListener('click', addTopic);
  document.getElementById('topicInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTopic(); });

  document.getElementById('addChannel').addEventListener('click', addChannel);
  document.getElementById('channelInput').addEventListener('keydown', e => { if (e.key === 'Enter') addChannel(); });

  document.getElementById('addBlock').addEventListener('click', addBlock);
  document.getElementById('blockInput').addEventListener('keydown', e => { if (e.key === 'Enter') addBlock(); });

  // Tag removal — delegated
  document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('tag-remove')) return;
    const index = parseInt(e.target.dataset.index, 10);
    const type = e.target.dataset.type;
    if (type === 'topic') {
      currentSettings.topics.splice(index, 1);
      renderTags('topicTags', currentSettings.topics, 'topic');
    } else if (type === 'channel') {
      currentSettings.allowedChannels.splice(index, 1);
      renderTags('channelTags', currentSettings.allowedChannels, 'channel');
    } else if (type === 'block') {
      currentSettings.customBlocks.splice(index, 1);
      renderTags('blockTags', currentSettings.customBlocks, 'block');
    }
    await save();
  });

  // Refresh count whenever popup regains focus
  window.addEventListener('focus', refreshCount);
}

async function addTopic() {
  const input = document.getElementById('topicInput');
  const value = input.value.trim();
  if (!value || currentSettings.topics.some(t => t.toLowerCase() === value.toLowerCase())) { input.value = ''; return; }
  currentSettings.topics.push(value);
  renderTags('topicTags', currentSettings.topics, 'topic');
  input.value = '';
  await save();
}

async function addChannel() {
  const input = document.getElementById('channelInput');
  const value = input.value.trim();
  if (!currentSettings.allowedChannels) currentSettings.allowedChannels = [];
  if (!value || currentSettings.allowedChannels.some(c => c.toLowerCase() === value.toLowerCase())) { input.value = ''; return; }
  currentSettings.allowedChannels.push(value);
  renderTags('channelTags', currentSettings.allowedChannels, 'channel');
  input.value = '';
  await save();
}

async function addBlock() {
  const input = document.getElementById('blockInput');
  const value = input.value.trim();
  if (!value || currentSettings.customBlocks.some(b => b.toLowerCase() === value.toLowerCase())) { input.value = ''; return; }
  currentSettings.customBlocks.push(value);
  renderTags('blockTags', currentSettings.customBlocks, 'block');
  input.value = '';
  await save();
}

async function save() {
  await saveSettings(currentSettings);
}

document.addEventListener('DOMContentLoaded', init);

// FocusFeed - Popup Controller

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
  ai_slop:         { label: 'AI Slop',           desc: 'Faceless channels, AI voice-overs, content farms' },
  brain_rot:       { label: 'Brain Rot / Shorts', desc: 'YouTube Shorts, mindless viral content' },
  clickbait:       { label: 'Clickbait',           desc: 'Misleading titles and thumbnails' },
  rage_bait:       { label: 'Rage Bait',           desc: 'Manufactured outrage designed to make you angry' },
  politics:        { label: 'Politics & News',     desc: 'Political commentary and partisan content' },
  sports:          { label: 'Sports',              desc: 'Highlights, scores, sports commentary' },
  celebrity_drama: { label: 'Celebrity Drama',     desc: 'Gossip, feuds, and entertainment news' },
  spam_channels:   { label: 'Content Farms',       desc: 'Mass-production low-effort channels' },
};

let currentSettings = null;

// ---- Init ----
async function init() {
  currentSettings = await loadSettings();
  renderAll();
  attachListeners();
}

function renderAll() {
  // Master toggle
  document.getElementById('masterToggle').checked = currentSettings.enabled;
  document.body.classList.toggle('disabled', !currentSettings.enabled);

  // Strict mode
  document.getElementById('strictMode').checked = currentSettings.strictMode;

  // Topic tags
  renderTags('topicTags', currentSettings.topics, 'topic');

  // Block tags
  renderTags('blockTags', currentSettings.customBlocks, 'block');

  // Preset toggles
  renderPresets();
}

function renderTags(containerId, items, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach((item, index) => {
    const tag = document.createElement('span');
    tag.className = `tag ${type}`;
    tag.innerHTML = `${item}<span class="tag-remove" data-index="${index}" data-type="${type}">×</span>`;
    container.appendChild(tag);
  });
}

function renderPresets() {
  const container = document.getElementById('presetList');
  container.innerHTML = '';

  PRESET_ORDER.forEach(key => {
    const meta = PRESET_LABELS[key];
    const enabled = currentSettings.blockPresets[key] || false;

    const item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <div class="preset-info">
        <div class="preset-name">${meta.label}</div>
        <div class="preset-desc">${meta.desc}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" data-preset="${key}" ${enabled ? 'checked' : ''} />
        <span class="slider"></span>
      </label>
    `;
    container.appendChild(item);
  });
}

// ---- Listeners ----
function attachListeners() {
  // Master on/off
  document.getElementById('masterToggle').addEventListener('change', async (e) => {
    currentSettings.enabled = e.target.checked;
    document.body.classList.toggle('disabled', !currentSettings.enabled);
    await save();
  });

  // Strict mode
  document.getElementById('strictMode').addEventListener('change', async (e) => {
    currentSettings.strictMode = e.target.checked;
    await save();
  });

  // Add topic
  document.getElementById('addTopic').addEventListener('click', addTopic);
  document.getElementById('topicInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTopic();
  });

  // Add block term
  document.getElementById('addBlock').addEventListener('click', addBlock);
  document.getElementById('blockInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBlock();
  });

  // Remove tags (delegated)
  document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('tag-remove')) return;
    const index = parseInt(e.target.dataset.index);
    const type = e.target.dataset.type;

    if (type === 'topic') {
      currentSettings.topics.splice(index, 1);
      renderTags('topicTags', currentSettings.topics, 'topic');
    } else if (type === 'block') {
      currentSettings.customBlocks.splice(index, 1);
      renderTags('blockTags', currentSettings.customBlocks, 'block');
    }
    await save();
  });

  // Preset toggles (delegated)
  document.getElementById('presetList').addEventListener('change', async (e) => {
    if (!e.target.dataset.preset) return;
    const key = e.target.dataset.preset;
    currentSettings.blockPresets[key] = e.target.checked;
    await save();
  });
}

async function addTopic() {
  const input = document.getElementById('topicInput');
  const value = input.value.trim();
  if (!value) return;
  if (currentSettings.topics.includes(value)) {
    input.value = '';
    return;
  }
  currentSettings.topics.push(value);
  renderTags('topicTags', currentSettings.topics, 'topic');
  input.value = '';
  await save();
}

async function addBlock() {
  const input = document.getElementById('blockInput');
  const value = input.value.trim();
  if (!value) return;
  if (currentSettings.customBlocks.includes(value)) {
    input.value = '';
    return;
  }
  currentSettings.customBlocks.push(value);
  renderTags('blockTags', currentSettings.customBlocks, 'block');
  input.value = '';
  await save();
}

async function save() {
  await saveSettings(currentSettings);
}

// ---- Bootstrap ----
document.addEventListener('DOMContentLoaded', init);

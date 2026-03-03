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
  ai_slop:         { label: 'AI Slop',       desc: 'Faceless channels, AI voice-overs, content farms' },
  brain_rot:       { label: 'Shorts',         desc: 'YouTube Shorts and mindless viral content' },
  clickbait:       { label: 'Clickbait',      desc: 'Misleading titles designed to get clicks' },
  rage_bait:       { label: 'Rage Bait',      desc: 'Manufactured outrage designed to make you angry' },
  politics:        { label: 'Politics',       desc: 'Political commentary and partisan content' },
  sports:          { label: 'Sports',         desc: 'Highlights, scores, sports commentary' },
  celebrity_drama: { label: 'Celebrity',      desc: 'Gossip, feuds, and entertainment news' },
  spam_channels:   { label: 'Content Farms',  desc: 'Mass-production low-effort channels' },
};

let currentSettings = null;

// ---- Init ----
async function init() {
  currentSettings = await loadSettings();
  renderAll();
  attachListeners();
}

function renderAll() {
  document.getElementById('masterToggle').checked = currentSettings.enabled;
  document.body.classList.toggle('disabled', !currentSettings.enabled);
  document.getElementById('strictMode').checked = currentSettings.strictMode;
  renderTags('topicTags', currentSettings.topics, 'topic');
  renderTags('channelTags', currentSettings.allowedChannels || [], 'channel');
  renderTags('blockTags', currentSettings.customBlocks, 'block');
  renderChips();
}

function renderTags(containerId, items, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach((item, index) => {
    const tag = document.createElement('span');
    tag.className = `tag ${type}`;
    // Use textContent for user data — never innerHTML with untrusted strings
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
    const enabled = currentSettings.blockPresets[key] || false;
    const chip = document.createElement('button');
    chip.className = `chip${enabled ? ' active' : ''}`;
    chip.dataset.preset = key;
    chip.title = meta.desc;
    chip.textContent = meta.label;
    container.appendChild(chip);
  });
}

// ---- Listeners ----
function attachListeners() {
  document.getElementById('masterToggle').addEventListener('change', async (e) => {
    currentSettings.enabled = e.target.checked;
    document.body.classList.toggle('disabled', !currentSettings.enabled);
    await save();
  });

  document.getElementById('strictMode').addEventListener('change', async (e) => {
    currentSettings.strictMode = e.target.checked;
    await save();
  });

  // Preset chips — toggle on click
  document.getElementById('presetChips').addEventListener('click', async (e) => {
    const chip = e.target.closest('.chip[data-preset]');
    if (!chip) return;
    const key = chip.dataset.preset;
    currentSettings.blockPresets[key] = !currentSettings.blockPresets[key];
    chip.classList.toggle('active', currentSettings.blockPresets[key]);
    await save();
  });

  // Topic input
  document.getElementById('addTopic').addEventListener('click', addTopic);
  document.getElementById('topicInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTopic();
  });

  // Channel input
  document.getElementById('addChannel').addEventListener('click', addChannel);
  document.getElementById('channelInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addChannel();
  });

  // Custom block input
  document.getElementById('addBlock').addEventListener('click', addBlock);
  document.getElementById('blockInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBlock();
  });

  // Remove tags — delegated
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

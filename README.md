# SloppyFilter

**Block the garbage. Keep what you actually care about.**

SloppyFilter is a Chrome extension that surgically filters your YouTube and Twitter/X feeds — removing AI slop, Shorts, clickbait, and political rage bait while keeping the creators and topics you actually want to see.

Unlike extensions that nuke your entire feed, SloppyFilter makes smart decisions based on what the content *is*, not just where it appears.

---

## What it does

**Always hidden (defaults on):**
- AI-generated faceless channels and content farms
- Mass-production low-effort spam channels

**Toggle on/off:**
- YouTube Shorts / Brain Rot content
- Clickbait titles and thumbnails
- Rage bait and manufactured outrage
- Political commentary and news drama
- Sports highlights and commentary
- Celebrity gossip and drama

**You control:**
- Topics you want to see (e.g. "fitness", "coding", "AI") — these protect matching content from being over-filtered
- Channels you always want to see (whitelist specific creators)
- Custom words/phrases to always block

---

## Install

> Chrome Web Store link coming soon.

**Install from source (developer mode):**

1. Download or clone this repo
2. Open Chrome → go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → select the `focusfeed` folder
5. Open YouTube or Twitter/X and watch the garbage disappear

---

## How it works

SloppyFilter runs entirely in your browser. No accounts, no data collection, no servers. Your settings sync across your Chrome devices via Chrome's built-in storage sync.

**Filter priority order:**
1. Custom block terms you typed → always hidden
2. Your topic/channel whitelist → always shown (overrides presets)
3. Block presets → hidden if matched
4. Strict mode (optional) → hide anything not matching your topics

---

## Roadmap

- [x] YouTube feed filtering
- [x] Twitter/X feed filtering
- [x] 8 block presets (AI slop, Shorts, clickbait, etc.)
- [x] Custom word/phrase blocking
- [x] Topic-based whitelist
- [ ] Channel whitelist ("always show AthleanX")
- [ ] Filter count badge (see how much got removed)
- [ ] Onboarding for new users
- [ ] Chrome Web Store launch
- [ ] Firefox support
- [ ] Instagram Reels filtering

---

## Built with

Plain JavaScript, no frameworks, no build step. Manifest V3. Works with Chrome and Chromium-based browsers (Edge, Brave, Arc).

---

## Contributing

Issues and PRs welcome. If you notice a type of content slipping through that should be caught, open an issue with an example title and we'll add it to the patterns.

---

## License

MIT

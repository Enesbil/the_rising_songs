# the rising songs

A small music playlist explorer. Browse a shelf of curated playlists, open one to see its tracks, like the ones you want, shuffle the songs, play tracks in the browser, and get an AI-written description of the vibe.

Built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step.

## Features

Required:
- Featured page that loads one random playlist on every visit.
- All Playlists page with a 4-column grid of every playlist, showing cover, name, author, and like count.
- Click a card to open a modal with the playlist's full track list.
- Like a playlist by clicking the heart icon. Click again to unlike. Visual state changes both ways. Likes stay in sync across the card and the modal.
- Shuffle button inside the modal that randomizes the song order. Clicking again shuffles to a different order.
- AI "Get description" button in the modal that calls an LLM to write a short note about the playlist.

Extras:
- Real audio playback for the CC-licensed tracks via a single shared `<audio>` element.
- Search bar (live filter on the shelf, Enter-to-go on Featured).
- URL-driven sort and mood filters (`?sort=likes`, `?mood=focus`, etc.) so chips and sidebar shortcuts are deep-linkable.
- Mobile responsive down to ~380px with an off-canvas sidebar at narrow widths.

Visual:
- Dark warm theme with an amber accent.
- Pure-CSS vinyl record peeking out from behind every cover, slowly spinning while audio plays.
- Eight hand-drawn SVG album covers, one per playlist.

## Run it locally

You need to serve the files over HTTP (not open them with `file://`) because `script.js` uses `fetch` to load `data/data.json`.

The simplest way:

```
cd /path/to/project_2
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Project structure

```
.
├── index.html         Featured page (homepage)
├── playlists.html     All playlists grid + modal
├── style.css          All styles, organized by section
├── script.js          All JS: data loading, render, modal, like, shuffle, audio, AI
├── data/data.json     Source of truth, 8 playlists
├── scripts/           One-shot dev script that builds data.json
├── assets/            Favicon and icons
├── config.example.js  Template for the OpenRouter key (real one is gitignored)
├── render.yaml        Render static-site blueprint
└── planning.md        Full spec, function specs, decisions log
```

## Wiring up the AI feature

The "Get description" button calls OpenRouter from the browser.

1. Copy `config.example.js` to `config.js` and paste in your OpenRouter API key. `config.js` is gitignored, so the key never leaves your machine.
2. The fallback chain of free models is already in `config.js`. Edit it if you want different ones.
3. The prompt itself lives in `buildAIPrompt(playlist)` in `script.js` and matches the AI Feature Spec in `planning.md`. Failure behavior (empty response, 429, missing key) all fall through to the fallback string.

## Decisions

See `planning.md` for the full design spec, function specs, and the per-milestone decisions log.

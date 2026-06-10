# the rising songs, planning spec

A small music playlist explorer. Two pages plus a modal that opens over the All Playlists page (and over Featured too, since the same modal markup is duplicated there).

## Pages

1. `index.html`, the Featured page. Picks one random playlist on every load and shows it as a hero card up top with a Quick Picks tracklist underneath. This is the homepage.
2. `playlists.html`, the All Playlists page. 4-column grid of every playlist. Clicking a card opens the modal. Mood chips at the top filter the grid via URL params.

The modal is not a separate page. It lives inside both pages and toggles open when a card (or the hero cover on Featured) is clicked.

## Visual Direction

- App name: `the rising songs`. Brand mark is a small inline-SVG vinyl with the word "rising" arcing over it.
- Warm dark theme. Backdrop near-black with amber accent.
- Geist Sans for everything; Geist Mono only on hard data (durations, plays, IDs).
- Identity move: every cover gets a CSS-only vinyl record peeking out from behind it. The vinyl spins while audio plays, paused otherwise. The center label color comes from the cover's palette so each record matches its art.

### Tokens (decided)

Colors:
- bg `#131110`
- surface `#1B1916`
- surface-hi `#23201C`
- text `#F0EAD8`
- text-soft `#C9C2B0`
- muted `#8A8275`
- accent `#D9A441` (warm amber)
- line `rgba(255, 240, 220, 0.08)`

Type:
- Geist Sans for everything
- Geist Mono only on durations, play counts, IDs
- No serif, no italic display headlines

## Data Shape

Source of truth is `data/data.json`, a hand-curated array of 8 playlist objects. No external API at runtime. The JSON is generated once by `scripts/build_data.py` (a one-shot dev-time script that pulls metadata from a list of CC-licensed albums into the JSON file). The browser does not run the Python.

```
playlist:
  - id (string)         unique slug, used as DOM key and click handler target
  - name (string)       display name on the card and modal
  - author (string)     curator credit
  - coverKey (string)   references one of the inline SVG covers in script.js (e.g. "midnight")
  - likes (number)      starting like count
  - liked (boolean)     false at load, toggled by the user (in memory only)
  - mood (string)       used by the chip filter ("focus", "night drive", etc.)
  - addedAt (string)    ISO date, used by ?sort=recent
  - songs (array of song objects)
  - source (object)     facts about the underlying album, used by the AI prompt

song:
  - title (string)
  - artist (string)
  - duration (string)   formatted "M:SS"
  - file (string)       audio filename for streaming
```

Cover art: 8 hand-authored inline SVG covers live in `script.js` under the `COVERS` map, indexed by `coverKey`. We don't ship image files for covers.

`liked` lives in memory only. Reloading the page resets every playlist back to its starting `likes` value with `liked: false`. That's fine for this assignment, no localStorage.

## UI and Interaction Rules

### Featured page (index.html)

- On page load, pick one random playlist from the data and render it as the hero. Reloading picks a new one (the spec says repeating the same playlist twice in a row is allowed).
- Hero shows: cover with vinyl peeking out, playlist name, author, "EP · 2026 · N songs · MM minutes", a primary "Play all" button, and a "Shuffle" button.
- Underneath the hero, render the playlist's songs as a Quick Picks tracklist. Each row is title, artist, duration, with a play/pause icon that swaps based on the currently playing track.
- Sidebar nav has Featured (active), the shelf, and a "shelves" group with sort shortcuts (recently added, most liked, by mood).
- Clicking "the shelf" or any shelf shortcut takes the user to playlists.html with the matching `?sort=...` URL params.

### All Playlists page (playlists.html)

- Renders all playlists from the data as a 4-column grid (3 on tablet, 2 on small tablet, 1 on phone).
- Each card has: cover with vinyl peek, playlist name, author, like count with a heart icon.
- The heart icon on a card is interactive. Clicking it toggles the like state for that playlist. No need to open the modal first.
  - Unliked to liked: like count goes up by 1, heart fills with the accent color, scale-bumps once.
  - Liked to unliked: like count goes down by 1, heart goes back to outline, no animation.
- Clicking anywhere else on the card opens the modal for that playlist.
- The chip row at the top is wired to `?mood=` URL params and filters the grid.

### Modal

- Opens centered on the screen with a dark scrim covering the rest of the page.
- Modal content is in a card with rounded corners and a deep shadow, max-width about 1080px, max-height 90vh.
- Modal head shows "Playlist", the playlist name, and a close X on the right.
- Left column: cover with spinning vinyl, playlist name, author, meta line, action row (big play FAB, Next, Shuffle), then the AI description card.
- Right column: a tab strip (Tracklist active by default, About second), then the tracklist.
- Each tracklist row shows track number, title, artist with play count, duration. Hovering swaps the number for a play icon.
- Modal closes when:
  - The close X is clicked
  - The scrim outside the modal is clicked
  - Escape is pressed
- Clicking inside the modal panel does not close it.
- The Shuffle button shuffles the song order in the tracklist in place and starts playing the first song of the new order. Pressing it again shuffles to a different order. Original order is not preserved, the array is overwritten in memory while the modal is open.
- The "Get description" button calls the AI, replaces the placeholder with the model's response, and shows a loading state while the request is in flight.

## Function Specs

### Milestone 3, render the grid

`createPlaylistCard(playlist)`
- input: a playlist object
- output: an HTMLElement (the card)
- side effects: none, the caller appends it to the DOM
- uses these fields from the playlist: name, author, coverKey, likes, liked

`renderAllPlaylists(playlists, container)`
- input: array of playlist objects, the DOM element to render into
- output: none
- side effects: replaces the contents of `container` with one card per playlist
- if `playlists` is empty, renders a "No playlists yet" message instead

### Milestone 4, modal population

`openModal(playlist)`
- input: a playlist object
- side effects: populates the modal's name, author, meta, AI placeholder, and tracklist with that playlist's data, then shows the modal and dims the page
- the modal's structure is the same regardless of which playlist opened it, only the content changes

`closeModal()`
- side effects: hides the modal, clears the populated content, restores page scroll
- safe to call when the modal is already closed (no-op)

### Milestone 5, like toggle

`toggleLike(playlist, cardEl)`
- input: the playlist object, the card DOM element it lives in
- side effects:
  - if currently unliked: increments `playlist.likes`, sets `playlist.liked = true`, swaps the heart icon to filled, animates a one-time scale bump
  - if currently liked: decrements `playlist.likes`, sets `playlist.liked = false`, swaps the heart back to outline (no animation)
  - updates the displayed like count on every card and modal instance of that playlist (matched by `data-playlist-id`)
- constraint: a single click flips one branch only; the second click flips back. The user can never go from unliked straight to a like count of +2.

### Milestone 6, shuffle

`shuffleSongs(songs)`
- input: an array of song objects
- output: a new array containing the same songs in a randomized order (the input array is not mutated)
- uses Fisher-Yates so every permutation is equally likely
- if `songs.length <= 1`, returns a copy unchanged

`onShuffleClick()`
- side effects: replaces the open playlist's `songs` with `shuffleSongs(playlist.songs)`, re-renders the modal's tracklist, then plays the first song of the new order
- the original order is not preserved (deliberate, keeps the data model simple). Multiple clicks keep producing different orders.

### Milestone 7, featured page

`pickRandomPlaylist(playlists)`
- input: array of playlist objects
- output: one playlist, picked with `Math.random()`
- if there's only one playlist, returns it
- can return the same playlist as a previous call (no anti-repeat logic)

`renderFeatured(playlist, container)`
- input: a playlist object, the DOM element for the featured hero
- side effects: replaces the contents of `container` with the hero card and the Quick Picks tracklist for that playlist

### Milestone 8, AI description

`getPlaylistDescription(playlist)`
- input: a playlist object
- output: a string (the AI's 2-3 sentence description) on success
- API: POSTs to `https://openrouter.ai/api/v1/chat/completions` with a system message + a user message built by `buildAIPrompt(playlist)`. Walks a fallback chain of free models, returning the first non-empty response.
- on error: throws. The caller (`onAIClick`) catches the throw and shows the fallback message.

`buildAIPrompt(playlist)`
- input: a playlist object
- output: a string (the user message)
- builds a FACTS block from `playlist.source` (album title, artist, year, subjects, IA description, song titles) plus a STRICT RULES block telling the model not to invent facts and not to treat the curator/playlist names as a real album.

## AI Feature Spec (Milestone 8)

- **Role**: a careful, observational music critic who only writes from facts given.
- **Task**: write a 2 to 3 sentence description of a music collection's mood and feel, given metadata about the underlying CC-licensed album.
- **Inputs**: playlist `name`, `author` (clearly labeled as app labels, not factual claims), `mood`, and the `source` block (album title, album artist, year, subjects/genres, license, archive description, song titles).
- **Output format**: 2 to 3 sentences, plain prose. No song-by-song listing. No emoji. No marketing language ("ultimate", "hand-picked", "vibey").
- **Constraints**:
  - Do not invent locations, recording histories, or backstory.
  - Do not name artists not listed in the FACTS block.
  - Do not treat the curator or playlist names as a real album or artist.
  - If FACTS are sparse, write a shorter, more cautious description rather than guessing.
- **Failure behavior**: on a failed fetch, an empty model response, or a missing API key, the UI shows `"Could not generate a description right now. Try again in a moment."` and the button returns to its idle state.

## Decisions Log

### Pre-Milestone 0, design direction

Picked a warm dark backdrop with an amber accent over a paper-cream editorial direction. Cleaner contrast for the dense card grid and easier on the eyes. Picked Geist Sans for everything (Geist Mono only on hard numerical data) so the type system has one decision to make, not five. The vinyl-out-of-cover identity move (CSS-only spinning record peeking from behind every cover) is the one signature flourish that ties the brand together.

### Pre-Milestone 0, source of truth

Going with a static `data/data.json` file, no live external API at runtime. The assignment specifies fetching from a JSON file, and a runtime API call would fight that requirement. Cover images are inline SVG (8 distinct visual languages) so we don't need a stock photo workflow.

### Milestone 1, semantic structure

Used `<aside>` for the sidebar, `<header>` for the topbar, `<main>` for the page body, and `<footer>` for the credit line. The `.app` shell is a CSS Grid (sidebar column + main column) so the topbar can span the right column without nesting weirdness.

### Milestone 2, card hover

Cards have a subtle border + shadow at rest, and lift slightly on hover (transform + a softer shadow) so the affordance reads without being noisy. No background recolor on hover, since the cover image and like-count chip are already busy.

### Milestone 3, schema first

Wrote the schema in this file before touching `data.json`, then mirrored it 1:1. Every field that shows up in the UI has a corresponding field in the schema. The `source` block was added later in the project for the AI feature, but I left the schema entry here for clarity.

### Milestone 4, modal stays as the detail surface

Picked a modal (cover-left, tracks-right) over a separate detail page or a tabbed layout. Rationale: the spec asks for a centered floating card with a dimmed background, which is exactly a modal. A tabbed layout would hide either the tracklist or the description behind a click, which is worse UX.

### Milestone 5, like state persistence

Like state lives in memory only, resets on reload. localStorage would be a small win but the spec doesn't require it and keeping the data model simple makes the code easier to audit. Multiple visible instances of the same playlist (card on the shelf and inside the modal) sync through a `data-playlist-id` attribute and a single `querySelectorAll` after the toggle.

### Milestone 6, shuffle behavior

Shuffle overwrites the open playlist's `songs` array in memory, no preservation of original order. Closing and reopening the modal shows whatever order the array is currently in. The spec asked us to think about whether to preserve original order, this is the answer: simpler data model wins over a reset feature nobody asked for.

### Milestone 7, featured layout

Featured is the homepage. The hero card sits on top (cover + vinyl + name + meta + Play all + Shuffle), with a Quick Picks tracklist directly underneath so the user can start playing without opening the modal. The original plan also had a "more from the shelf" carousel but I dropped it: a horizontal-scroll carousel is non-trivial JS for a junior-level codebase, and a carousel of other playlists muddies the "one random playlist on each load" intent.

### Milestone 8, AI prompt

First-try output: a free 20B model returned a fluent paragraph that included a claim about the album being recorded in a city that wasn't in the metadata. That was the trigger for adding the `STRICT RULES` block: I now tell the model explicitly that the FACTS list is the only source of truth, that the playlist name and curator are app labels (not real artists), and that a sparse FACTS block should produce a shorter description rather than an invented one. After those rule additions the hallucination stopped.

Other adjustments:
- Switched from a single model to a fallback chain of free OpenRouter models, because free models throttle (429) constantly. The chain order is empirical, ones that responded reliably during smoke tests go first.
- `temperature: 0.3` so the model stays close to the FACTS block and doesn't get poetic.
- `max_tokens: 600` to give reasoning models headroom (some of them reason internally before outputting; too tight a cap returns empty content).

Tested the failure state by deleting the `OPENROUTER_API_KEY` from `config.js`. The fallback string from the spec rendered in the modal and the button returned to idle. Tested again by pointing the URL at a 404 endpoint (in dev only) to confirm the catch path triggers on network errors too.

One thing I'd specify differently next time: I'd be explicit about WHICH artist-naming variants are allowed. The first-try description got the album artist right but also creatively described "the band's earlier work", which I had no way to verify. A future spec rev would say "name the album artist if it's listed, but make no claims about their other work."

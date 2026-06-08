# Playshelf, Planning Spec

ALL BELOW ARE SUBJECT TO CHANGE. THIS IS A GENERAL IDEA.

A music playlist explorer. Two pages plus a modal. Inspired by YouTube Music's structural language (left sidebar, top search, dense card grids, playlist detail layout) but with our own color, type, and a vinyl-out-of-cover identity move.

## Pages

1. `index.html`, the Featured page. Picks one random playlist on every load and shows it as a hero card up top with a tracklist preview underneath. This is the homepage.
2. `playlists.html`, the All Playlists page. 4-column grid of every playlist. Each card opens the modal.

The modal is not a separate page, it lives inside `playlists.html` and toggles open when a card is clicked.

## Visual direction

Picked direction per surface (full mockups in `mockups/`):
- Featured: F2, the explore landing layout. Hero card with cover plus reshuffle button on top, then a Quick picks tracklist underneath.
- All Playlists: P1, the explore grid. Mood chips at the top, 4-column grid of cards below.
- Modal: M1, the playlist detail card. Cover and play actions on the left, tabbed tracklist on the right, AI description sits below the play row on the left side.

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
- Geist Mono only on hard data (durations, plays, IDs)
- No serif, no italic display headlines

Identity move:
- Every cover gets a vinyl record peeking out from behind it, pure CSS, slow rotation. The vinyl's center label color comes from the cover's palette so each record feels matched to its art.

App name: playshelf. Brand mark is a small amber square with a "p" inside. but subject to change

## Data Shape

Source of truth is `data/data.json`, an array of playlist objects. No external API.

planned as below

```
playlist:
  - id (string), unique slug, used for keys and click handlers
  - name (string), display name shown on the card and modal
  - author (string), curator credit
  - coverKey (string), references one of the 8 inline SVG covers in script.js (e.g. "midnight", "bluehour")
  - likes (number), starting like count
  - liked (boolean), false at load, toggled by the user
  - songs (array of song objects)

song:
  - title (string)
  - artist (string)
  - duration (string), formatted "M:SS"
```

We use SVG covers defined in code instead of image files. They're already drawn in `mockups/_covers.js`, we'll move them into the real script when we start Milestone 3. Each cover also exports a label color for the vinyl center.

`liked` lives in memory only. Reloading the page resets every playlist back to its starting `likes` value with `liked: false`. That's fine for this assignment, no localStorage needed.

## UI and Interaction Rules

### Featured page (index.html)

- On page load, pick one random playlist from the data and render it as the hero. Reloading the page picks a new one. Same playlist twice in a row is allowed (the spec says so).
- Hero shows: cover with vinyl peeking out, playlist name, author, "EP · 2026 · N songs · MM minutes", a primary "Play all" button, a secondary "Shuffle" button, and a "Reshuffle feature" button.
- The reshuffle button picks a new random playlist without reloading the page, so the user can browse without spamming F5.
- Underneath the hero, render the playlist's songs as a Quick picks tracklist. Each row is title, artist, duration.
- Top sidebar nav has Home (active), Explore, Library. Library is decorative for this assignment.
- Clicking Explore takes the user to playlists.html.

### All Playlists page (playlists.html)

- Renders all playlists from the data as a 4-column grid (3 on tablet, 2 on small tablet, 1 on phone).
- Each card has: cover with vinyl peek, playlist name, author, like count with a heart icon.
- The heart icon on a card is interactive. Clicking it toggles the like state for that playlist. No need to open the modal first.
  - Unliked to liked: like count goes up by 1, heart fills with the accent color, scale-bumps once.
  - Liked to unliked: like count goes down by 1, heart goes back to outline, no animation.
- Clicking anywhere else on the card opens the modal for that playlist.
- Mood chips at the top are decorative for this assignment. They render but don't filter anything. We can wire filtering as a stretch.

### Modal

- Opens centered on the screen with a dark scrim covering the rest of the page.
- Modal content is in a card with rounded corners and a deep shadow, max-width about 1080px, max-height 90vh.
- Modal head shows "Playlist" then the playlist name, plus a close X on the right.
- Left column: cover with vinyl, playlist name, author, meta line, action row (save, big play button, shuffle, more), then the AI description card.
- Right column: a tab bar (Tracklist active by default, About second), then the tracklist of every song.
- Each tracklist row shows track number, title, artist with play count, duration. Hovering swaps the number for a tiny play icon.
- Modal closes when:
  - The close X is clicked
  - The scrim outside the modal is clicked
  - Escape is pressed
- Clicking inside the modal panel does not close it.
- The Shuffle button shuffles the song order in the tracklist, in place. Pressing it again shuffles to a different order. Pressing it many times keeps producing different orders. Original order is not preserved, it gets overwritten in memory while the modal is open. Closing and reopening the modal does not restore the original order, it just shows whatever order the array is in.
- The AI Get description button (Milestone 8) lives in the AI card, replaces the placeholder description with the model's response, shows a loading state while the request is in flight.

## Function Specs

This section grows as we go. Each milestone adds the specs for the functions it introduces.

### Milestone 3, render the grid

`createPlaylistCard(playlist)`
- input: a playlist object
- output: an HTMLElement (the card)
- side effects: none, the caller is responsible for appending it to the DOM
- uses these fields from the playlist: name, author, coverKey, likes, liked

`renderAllPlaylists(playlists, container)`
- input: array of playlist objects, the DOM element to render into
- output: none
- side effects: replaces the contents of `container` with one card per playlist
- if playlists is empty, renders a "No playlists yet" message instead

### Milestone 4, modal population

`openModal(playlist)`
- input: a playlist object
- side effects: populates the modal's name, author, meta, AI placeholder, and tracklist with that playlist's data, then shows the modal and dims the page
- the modal must look exactly the same regardless of which playlist opened it, only the content changes

`closeModal()`
- side effects: hides the modal, clears the populated content, restores page scroll
- safe to call when the modal is already closed (no-op)

### Milestone 5, like toggle

`toggleLike(playlist, cardEl)`
- input: the playlist object, the card DOM element it lives in
- side effects:
  - if currently unliked: increments `playlist.likes`, sets `playlist.liked = true`, swaps the heart icon to filled, animates a one-time scale bump
  - if currently liked: decrements `playlist.likes`, sets `playlist.liked = false`, swaps the heart back to outline
  - in both cases, updates the displayed like count on the card
- the same playlist's like state is consistent across the card and the modal (if open). Clicking the heart on the card while the modal is open updates both. Out of scope: persisting across reloads.

### Milestone 6, shuffle

`shuffleSongs(songs)`
- input: an array of song objects
- output: a new array containing the same songs in a randomized order (the input array is not mutated)
- uses Fisher-Yates so every permutation is equally likely
- if `songs.length <= 1`, returns a copy unchanged

`onShuffleClick(playlist)`
- side effects: replaces `playlist.songs` with `shuffleSongs(playlist.songs)`, then re-renders the modal's tracklist
- the original order is not preserved, this is a deliberate decision to keep the data model simple

### Milestone 7, featured page

`pickRandomPlaylist(playlists)`
- input: array of playlist objects
- output: one playlist, picked with `Math.random()`
- if there's only one playlist, returns that one
- can return the same playlist as a previous call (no anti-repeat logic, the spec says that's fine)

`renderFeatured(playlist, container)`
- input: a playlist object, the DOM element for the featured hero
- side effects: replaces the contents of `container` with the hero card and the Quick picks tracklist for that playlist

`onReshuffleClick()`
- side effects: picks a new random playlist and re-renders the featured hero in place, no page reload

### Milestone 8, AI description

To be filled in before Milestone 8. See AI Feature Spec below for the prompt-level spec.

## AI Feature Spec (Milestone 8)

To be filled in before Milestone 8. Will cover:
- Role: who the model is playing
- Task: what it's being asked to do
- Inputs: which fields from the playlist get passed in
- Output format: 2 to 3 sentence description, no song-by-song listing, no marketing language
- Constraints: things to avoid
- Failure behavior: what shows in the UI on API error or empty response

## Decisions Log

### Pre-Milestone 0, design direction

We looked at YouTube Music as the reference for structure (sidebar, search bar, dense grids, playlist detail with cover-left and tracks-right, big circular play button). For the visual identity we deviated: warm dark `#131110` instead of YT's near-black, amber `#D9A441` instead of YT red, all-Geist typography instead of Roboto, and a CSS vinyl record peeking out from every cover as our identity move. Gen-z lowercase chrome inside data fields kept original casing so song titles read normally.

We rejected a cream-paper editorial direction (dotted-leader liner notes, italic serif headlines) because it didn't match the YT inspiration the user actually picked. We also rejected several "Claude.com classic" tells along the way (slash-slash captions like `// session 047`, tiny uppercase mono labels, accented period in the wordmark, the live-dot blink) so the page doesn't read as AI-generated.

### Pre-Milestone 0, source of truth

Going with a static `data/data.json` file, no external API. The assignment specifies fetching from a JSON file and the API path would fight that requirement. Cover images are inline SVG (8 distinct visual languages already drawn in the mockups) so we don't need a stock photo workflow.

### Pre-Milestone 0, scope of Featured

F2's hero card plus tracklist preview is the right Featured layout. We are dropping the "More from the shelf" carousel of other playlists that the original mockup had. Reasons:
1. Spec wants Featured to be one random playlist on each load, a carousel of other playlists muddies that intent.
2. A horizontal-scroll carousel with paging arrows is non-trivial JS for a junior-level codebase.
Less code, cleaner intent.

### Pre-Milestone 0, like state persistence

Like state lives in memory only, resets on reload. localStorage would be a small win but the spec doesn't require it and the manager review wants understandable code.

### Pre-Milestone 0, shuffle behavior

Shuffle overwrites the playlist's `songs` array in memory, no preservation of original order. Closing and reopening the modal shows whatever order the array is currently in. The spec asked us to think about whether to preserve original order, this is the answer: simpler data model wins over a reset feature nobody asked for.

### Pre-Milestone 0, modal stays as the detail surface

We picked M1 (modal with cover-left + tracks-right) over M2 (tabbed) and M3 (cinematic full-bleed sheet). M2 hides either the tracklist or the description behind a tab click, worse UX. M3 is more dramatic but doesn't match the flat dense feel of F2 and P1. M1 mirrors YT's playlist detail page, which is the natural expectation after clicking a card.

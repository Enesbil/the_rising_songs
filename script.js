/* =================================================================
   The Rising Songs, main script.

   This is the only JavaScript file in the project. The same file is
   loaded by BOTH pages (index.html and playlists.html). To know which
   page it's running on, the script reads `document.body.dataset.page`
   at boot time and only runs the rendering code for that page.

   How to read this file:
     - Top of the file: data + small helpers (you don't have to
       understand the cover SVGs in section 2, just know that COVERS
       maps a coverKey string to SVG markup).
     - Middle: rendering functions, one for each big chunk of the UI
       (Featured page, playlist cards, modal, etc.).
     - Bottom: boot() runs on page load and wires everything together.
       Search for `function boot()` to follow the entry point.

   Sections:
     1. Constants                  - state we share across the file
     2. Album cover art            - hand-drawn SVGs, indexed by key
     3. Helpers                    - small utility functions
     4. Data loading               - fetch data.json
     5. Featured page rendering    - hero + Quick Picks + carousel
     6. All Playlists page         - the grid of cards
     7. Modal                      - open/close/populate
     8. Like toggle                - the heart button
     9. Shuffle                    - reorder the songs
    9b. Audio playback             - the <audio> element + state sync
    10. AI description             - calls OpenRouter
    11. Boot                       - entry point at the bottom
================================================================= */


/* ----- 1. Constants --------------------------------------------- */
//
// These three variables are declared at the top of the file (not inside
// any function) so EVERY function can read and write them. This is how
// we share state across the app without passing it through every
// function call.
//
// PLAYLISTS    — the array of all 8 playlists loaded from data.json.
//                Filled in once at boot, then read by every render fn.
// OPEN_PLAYLIST — which playlist is currently open in the modal, or
//                 null if no modal is open. Used by the modal's play /
//                 shuffle / next buttons so they know what to act on.
// NOW_PLAYING  — declared further down (section 9b) for the same reason:
//                tracks which song is currently playing so the UI can
//                highlight it.

let PLAYLISTS = [];
let OPEN_PLAYLIST = null;


/* ----- 2. Album cover art ---------------------------------------

   Eight hand-drawn album covers, one per playlist. Each one is an
   inline SVG (vector graphics written as code) so they look sharp at
   any size and we don't have to ship image files.

   How this gets used: every playlist in data.json has a "coverKey"
   like "midnight" or "warm". Later in the file, paintCover() looks up
   that key in this COVERS object and drops the SVG into the page.

   Each entry has two pieces:
     - label: a hex color used for the small center label of the
              vinyl record graphic (so the vinyl matches the cover).
     - svg:   the actual SVG markup as a template literal string.

   You can ignore the SVG paths themselves while reading this file —
   they're just shapes. The important bit is the keys ("midnight",
   "bluehour", etc.) match the coverKey field in data/data.json.
----------------------------------------------------------------- */

const COVERS = {
  midnight: {
    label: '#D9A441',
    svg: `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="m-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1B1815"/>
            <stop offset="100%" stop-color="#0A0807"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#m-g)"/>
        <g fill="#F0EAD8" font-family="Geist, sans-serif" font-weight="500">
          <text x="32" y="232" font-size="50" letter-spacing="-2.5">midnight</text>
          <text x="32" y="284" font-size="50" letter-spacing="-2.5">in shore-</text>
          <text x="32" y="336" font-size="50" letter-spacing="-2.5">ditch.</text>
        </g>
        <circle cx="354" cy="354" r="5" fill="#D9A441"/>
      </svg>`
  },

  bluehour: {
    label: '#1B3D8F',
    svg: `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#162A4D"/>
        <ellipse cx="200" cy="180" rx="100" ry="120" fill="#D9A441"/>
        <rect x="0" y="290" width="400" height="110" fill="#D9A441"/>
        <g fill="#162A4D" font-family="Geist, sans-serif" font-weight="500">
          <text x="24" y="358" font-size="32" letter-spacing="-1.5">blue hour</text>
        </g>
        <g fill="#0E1A33" opacity="0.7">
          <rect x="280" y="320" width="6" height="56"/>
          <rect x="294" y="328" width="6" height="48"/>
          <rect x="308" y="316" width="6" height="60"/>
          <rect x="322" y="332" width="6" height="44"/>
          <rect x="336" y="320" width="6" height="56"/>
          <rect x="350" y="336" width="6" height="40"/>
          <rect x="364" y="324" width="6" height="52"/>
          <rect x="378" y="330" width="6" height="44"/>
        </g>
      </svg>`
  },

  backseat: {
    label: '#7A9F3D',
    svg: `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#1B1815"/>
        <circle cx="120" cy="140" r="86" fill="#C24B33"/>
        <rect x="180" y="60" width="160" height="160" fill="#D9A441"/>
        <path d="M 60 280 L 340 280 L 200 360 Z" fill="#7A9F3D"/>
        <g fill="#F0EAD8" font-family="Geist, sans-serif" font-weight="500">
          <text x="32" y="42" font-size="18" letter-spacing="-0.5">backseat</text>
          <text x="32" y="64" font-size="18" letter-spacing="-0.5">symphony</text>
        </g>
      </svg>`
  },

  cathedral: {
    label: '#8B6BB1',
    svg: `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="c-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3D2855"/>
            <stop offset="100%" stop-color="#7A4F8C"/>
          </linearGradient>
          <linearGradient id="c-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#C66B3D"/>
            <stop offset="100%" stop-color="#D9A441"/>
          </linearGradient>
          <linearGradient id="c-3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#162A4D"/>
            <stop offset="100%" stop-color="#3A5FB8"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="#0A0807"/>
        <path d="M 60 400 L 60 120 Q 100 60 140 120 L 140 400 Z" fill="url(#c-1)"/>
        <path d="M 160 400 L 160 100 Q 200 40 240 100 L 240 400 Z" fill="url(#c-2)"/>
        <path d="M 260 400 L 260 120 Q 300 60 340 120 L 340 400 Z" fill="url(#c-3)"/>
        <g stroke="#0A0807" stroke-width="3" fill="none">
          <path d="M 60 400 L 60 120 Q 100 60 140 120 L 140 400 Z"/>
          <path d="M 160 400 L 160 100 Q 200 40 240 100 L 240 400 Z"/>
          <path d="M 260 400 L 260 120 Q 300 60 340 120 L 340 400 Z"/>
          <line x1="100" y1="200" x2="100" y2="380"/>
          <line x1="200" y1="180" x2="200" y2="380"/>
          <line x1="300" y1="200" x2="300" y2="380"/>
        </g>
      </svg>`
  },

  warm: {
    label: '#C24B33',
    svg: `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#7A2A1A"/>
        <rect x="40" y="120" width="320" height="160" fill="#0A0807"/>
        <circle cx="120" cy="200" r="36" fill="#F0EAD8"/>
        <circle cx="280" cy="200" r="36" fill="#F0EAD8"/>
        <circle cx="120" cy="200" r="6" fill="#0A0807"/>
        <circle cx="280" cy="200" r="6" fill="#0A0807"/>
        <rect x="156" y="190" width="88" height="20" fill="#F0EAD8" opacity="0.95"/>
        <text x="200" y="206" fill="#0A0807" font-family="Geist Mono, monospace" font-size="11" text-anchor="middle" letter-spacing="2">WARM STATIC</text>
        <g fill="#F0EAD8" font-family="Geist, sans-serif" font-weight="500">
          <text x="40" y="82" font-size="34" letter-spacing="-1">side b</text>
        </g>
      </svg>`
  },

  engine: {
    label: '#3A5FB8',
    svg: `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#1B1815"/>
        <g stroke="#D9A441" stroke-width="1.2" fill="none">
          <circle cx="200" cy="200" r="110"/>
          <circle cx="200" cy="200" r="80"/>
          <circle cx="200" cy="200" r="50"/>
          <circle cx="200" cy="200" r="20"/>
          <line x1="60" y1="200" x2="340" y2="200"/>
          <line x1="200" y1="60" x2="200" y2="340"/>
          <line x1="100" y1="100" x2="300" y2="300"/>
          <line x1="300" y1="100" x2="100" y2="300"/>
        </g>
        <g fill="#D9A441" font-family="Geist, sans-serif" font-weight="500">
          <text x="200" y="208" text-anchor="middle" font-size="16" letter-spacing="-0.3">soft engine</text>
        </g>
      </svg>`
  },

  held: {
    label: '#6E5DA0',
    svg: `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1F2A4D"/>
            <stop offset="50%" stop-color="#6E5DA0"/>
            <stop offset="80%" stop-color="#D9A441"/>
            <stop offset="100%" stop-color="#7A2A1A"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#h-sky)"/>
        <ellipse cx="200" cy="320" rx="280" ry="80" fill="#0A0807" opacity="0.65"/>
        <circle cx="290" cy="120" r="22" fill="#F0EAD8" opacity="0.92"/>
        <g fill="#F0EAD8" font-family="Geist, sans-serif" font-weight="500">
          <text x="32" y="380" font-size="30" letter-spacing="-1">held breath</text>
        </g>
      </svg>`
  },

  bridge: {
    label: '#5A6BBF',
    svg: `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#0E1A33"/>
        <g fill="#F0EAD8" font-family="Geist, sans-serif" font-weight="500">
          <text x="32" y="48" font-size="28" letter-spacing="-1">bridge</text>
          <text x="32" y="80" font-size="28" letter-spacing="-1">in fog.</text>
        </g>
        <g stroke="#F0EAD8" fill="none" stroke-dasharray="1.5 3" stroke-width="0.8" opacity="0.35">
          <path d="M 0 140 Q 100 130 200 140 T 400 140"/>
          <path d="M 0 170 Q 100 160 200 170 T 400 170"/>
          <path d="M 0 200 Q 100 190 200 200 T 400 200"/>
          <path d="M 0 230 Q 100 220 200 230 T 400 230"/>
          <path d="M 0 260 Q 100 250 200 260 T 400 260"/>
          <path d="M 0 290 Q 100 280 200 290 T 400 290"/>
          <path d="M 0 320 Q 100 310 200 320 T 400 320"/>
          <path d="M 0 350 Q 100 340 200 350 T 400 350"/>
        </g>
      </svg>`
  }
};


/* ----- 3. Helpers -----------------------------------------------
   Tiny reusable functions used by the bigger render functions below.
----------------------------------------------------------------- */

/**
 * Add up the durations of every song in a playlist and return a friendly
 * string like "47 minutes".
 *
 * Each song's `duration` is stored as "M:SS" (e.g. "3:42"). We split on
 * the colon, convert each piece to a number, multiply minutes by 60 to
 * get seconds, and sum everything. Then we round to whole minutes.
 *
 * Example: totalDuration([{duration:"3:42"},{duration:"4:18"}]) -> "8 minutes"
 */
function totalDuration(songs) {
  let totalSec = 0;
  for (const s of songs) {
    // "3:42" -> [3, 42] -> minutes=3, seconds=42. If a song has a
    // missing or malformed duration (e.g. user-added playlist where
    // someone typed "abc"), parseInt returns NaN; default to 0 so the
    // sum stays a real number and we don't render "NaN minutes".
    const parts = String(s.duration || '').split(':');
    const m = parseInt(parts[0], 10) || 0;
    const sec = parseInt(parts[1], 10) || 0;
    totalSec += m * 60 + sec;
  }
  const minutes = Math.round(totalSec / 60);
  // Pluralize: "1 minute" vs "8 minutes"
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/**
 * Build the small meta line shown under playlist titles.
 * Example output: "EP, 2026, 12 songs, 47 minutes"
 */
function metaLine(playlist) {
  return `EP, 2026, ${playlist.songs.length} songs, ${totalDuration(playlist.songs)}`;
}

/**
 * Look up a coverKey ("midnight", "warm", etc.) in the COVERS table
 * and return a real <svg> DOM element we can drop into the page.
 * Returns null if the key is missing.
 *
 * The trick with the <template> element:
 *   We have an SVG string ('<svg ...>...</svg>'). We can't just hand
 *   that to the page — it's text. Browsers parse HTML/SVG inside
 *   <template> WITHOUT rendering it. So we set the template's
 *   innerHTML to the string, then grab the first parsed child.
 *   The result is a live element you can append anywhere.
 */
function makeCoverNode(coverKey) {
  const data = COVERS[coverKey];
  if (!data) return null;
  const tpl = document.createElement('template');
  tpl.innerHTML = data.svg.trim();
  return tpl.content.firstElementChild;
}

/**
 * Build an <img> element for a user-uploaded cover image (a data-URI
 * stored on the playlist). Used by paintCover and paintRecord when the
 * playlist has a custom coverImage instead of the built-in SVG art.
 */
function buildCoverImage(playlist) {
  const img = document.createElement('img');
  img.src = playlist.coverImage;
  img.alt = playlist.name ? `${playlist.name} cover` : 'cover';
  // loading="lazy" lets the browser delay loading the image until it's
  // about to scroll into view; decoding="async" lets it decode off the
  // main thread. Both are pure perf wins for image-heavy pages.
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

/**
 * Paint the vinyl-record graphic in the modal.
 *
 * The .record element looks like this in the HTML:
 *   <div class="record">
 *     <div class="cover">  <-- album art lives here
 *     <div class="vinyl">  <-- the spinning disc
 *   </div>
 * It also reads a CSS variable called --label, which sets the color of
 * the small label at the center of the vinyl. We update that variable
 * so the vinyl visually matches the cover.
 *
 * Two cases:
 *   1. The playlist has a custom uploaded image (coverImage set):
 *      render an <img>, set --label to the amber accent color.
 *   2. Otherwise, render the built-in SVG keyed by playlist.coverKey,
 *      and use that cover's hand-picked label color.
 */
function paintRecord(recordEl, playlist) {
  if (!recordEl) return;
  const coverArea = recordEl.querySelector('.cover');
  if (!coverArea) return;

  // Case 1: user-uploaded image.
  if (playlist.coverImage) {
    coverArea.replaceChildren(buildCoverImage(playlist));
    // Use the brand accent color since we don't know the image's palette.
    recordEl.style.setProperty('--label', 'var(--accent)');
    return;
  }

  // Case 2: keyed SVG cover from the COVERS table.
  const data = COVERS[playlist.coverKey];
  if (!data) return;
  const node = makeCoverNode(playlist.coverKey);
  if (node) coverArea.replaceChildren(node);
  recordEl.style.setProperty('--label', data.label);
}

/**
 * Paint a plain cover (no vinyl wrapper) into a container element.
 * Used everywhere we show album art OUTSIDE the modal: hero, cards,
 * carousel, Quick Picks thumbs, now-playing hint thumb.
 *
 * Like paintRecord, two cases: user image vs keyed SVG.
 */
function paintCover(containerEl, playlist) {
  if (!containerEl) return;
  if (playlist.coverImage) {
    containerEl.replaceChildren(buildCoverImage(playlist));
    return;
  }
  const node = makeCoverNode(playlist.coverKey);
  if (node) containerEl.replaceChildren(node);
}

/**
 * Turn an HTML string into a real DOM element. Saves us from writing
 * `document.createElement(...) + appendChild(...) + setAttribute(...)`
 * over and over for every little piece.
 *
 * Example:
 *   const node = el(`<button class="hi">Hello</button>`);
 *   document.body.appendChild(node);
 *
 * Trick: we wrap the HTML in a <div>, then return its first child.
 */
function el(html) {
  const wrap = document.createElement('div');
  wrap.innerHTML = html.trim();
  return wrap.firstElementChild;
}

/**
 * Returns the SVG markup for a heart icon. The `filled` argument
 * controls whether the heart is solid (liked) or outlined (not liked).
 */
function heartSVG(filled) {
  if (filled) {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7-4.35-9.5-8.5C0 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 7 4 4.5 8.5C19 16.65 12 21 12 21z"/>
    </svg>`;
  }
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
    <path d="M12 21s-7-4.35-9.5-8.5C0 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 7 4 4.5 8.5C19 16.65 12 21 12 21z"/>
  </svg>`;
}


/* ----- 4. Data loading ------------------------------------------ */

/**
 * Asynchronously fetch data/data.json from the same folder as the page
 * and store the result in the PLAYLISTS variable so the rest of the app
 * can read it.
 *
 * Why `async` and `await`: fetching a file takes time. `async` lets us
 * write code that LOOKS sequential ("await this, then do that") even
 * though the fetch is happening in the background. The `await` keyword
 * pauses inside this function until the network request resolves; the
 * rest of the page keeps running.
 *
 * If the fetch fails (404, network down, bad JSON), we catch the error,
 * log it, and leave PLAYLISTS as an empty array. The render functions
 * already handle the empty case by showing a "No playlists found"
 * message, so a failure doesn't crash anything.
 */
async function loadData() {
  try {
    const res = await fetch('data/data.json');
    if (!res.ok) throw new Error('failed to fetch playlist data');
    const json = await res.json();
    PLAYLISTS = json;
    return json;
  } catch (err) {
    console.error(err);
    PLAYLISTS = [];
    return [];
  }
}




/* ----- 5. Featured page -----------------------------------------
   Renders the homepage (index.html). The page picks a random playlist
   to show as the "featured" record at the top, plus a tracklist of
   that playlist's songs and a horizontal carousel of the others.
----------------------------------------------------------------- */

/**
 * Pick a random playlist from the array. Returns null if the array is
 * empty (so the caller can show an empty state instead of crashing).
 *
 * How it works:
 *   Math.random()                     -> a number from 0 up to (but
 *                                        not including) 1
 *   * playlists.length                -> scaled to the array's length
 *   Math.floor(...)                   -> rounded down to a whole index
 */
function pickRandomPlaylist(playlists) {
  if (playlists.length === 0) return null;
  const i = Math.floor(Math.random() * playlists.length);
  return playlists[i];
}

/**
 * Render the entire Featured page into `root`. Builds three sections:
 *   1. The big "hero" card at the top (cover + title + Play / Shuffle).
 *   2. A "Quick picks" tracklist (the hero playlist's songs).
 *   3. A horizontal "More from the shelf" carousel of OTHER playlists.
 *
 * `root` is a real DOM element (the <div id="featured-root"> from
 * index.html). We clear it and re-fill it from scratch each time.
 */
function renderFeatured(playlist, root) {
  if (!playlist) {
    root.innerHTML = `<div class="empty-state">No playlists found.</div>`;
    return;
  }

  // Build the hero card HTML.
  // The Featured hero shows a clean cover, no vinyl. Vinyl only appears
  // on the modal where the user is "playing" the playlist.
  const hero = el(`
    <div class="hero">
      <div class="left">
        <div class="hero-cover"></div>
      </div>
      <div class="right">
        <div class="featured-cap">Featured today</div>
        <h1>${playlist.name}</h1>
        <div class="by">${playlist.author}</div>
        <div class="meta-line">${metaLine(playlist)}</div>
        <div class="actions">
          <button class="btn primary" id="hero-play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l16 9-16 9z"/></svg>
            Play all
          </button>
          <button class="btn" id="hero-shuffle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 3h5v5"/><path d="M4 20L21 3"/>
              <path d="M21 16v5h-5"/><path d="M15 15l6 6"/>
              <path d="M4 4l5 5"/>
            </svg>
            Shuffle
          </button>
        </div>
      </div>
    </div>
  `);

  // Paint the cover SVG into the hero (no vinyl on this surface).
  paintCover(hero.querySelector('.hero-cover'), playlist);

  // Wire up the three interactive bits of the hero:
  //   1. Click the cover -> open the playlist modal.
  //   2. Click "Play all" -> start playback at song 0.
  //   3. Click "Shuffle" -> reorder the songs randomly, then start.
  //
  // The cover is just a <div>, not a <button>. To make it accessible we
  // give it role="button" and tabindex="0" (so keyboard users can Tab
  // to it) and listen for Enter/Space keypresses ourselves. This is
  // the standard pattern for "I styled this thing as a clickable area."
  const heroCover = hero.querySelector('.hero-cover');
  heroCover.style.cursor = 'pointer';
  heroCover.setAttribute('role', 'button');
  heroCover.setAttribute('tabindex', '0');
  heroCover.setAttribute('aria-label', `Open ${playlist.name}`);
  heroCover.addEventListener('click', () => openModal(playlist));
  heroCover.addEventListener('keydown', (e) => {
    // Enter and Space are the standard "activate" keys for buttons.
    // preventDefault stops Space from also scrolling the page down.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(playlist);
    }
  });
  hero.querySelector('#hero-play').addEventListener('click', () => playTrack(playlist, 0));
  hero.querySelector('#hero-shuffle').addEventListener('click', () => {
    // shuffleSongs returns a NEW array, so this assignment swaps the
    // playlist's song order in place. The next render will see the
    // shuffled order. playTrack(playlist, 0) then starts the first
    // song of the shuffled list.
    playlist.songs = shuffleSongs(playlist.songs);
    playTrack(playlist, 0);
  });

  // Build the Quick picks section header.
  const sectionHead = el(`
    <div class="section-head">
      <div class="l">
        <h2>Quick picks</h2>
        <span class="sub-cap">pulled from the feature</span>
      </div>
    </div>
  `);

  // Build the tracklist of song rows. Clicking a row plays that track.
  const quickPicks = el(`<div class="quick-picks"></div>`);
  for (let i = 0; i < playlist.songs.length; i++) {
    const song = playlist.songs[i];
    const row = el(`
      <div class="pick" data-playlist-id="${playlist.id}" data-song-index="${i}">
        <div class="thumb"></div>
        <div class="info">
          <div class="t">${song.title}</div>
          <div class="s">${song.artist}</div>
        </div>
        <div class="dur">${song.duration}</div>
        <div class="play-icon">
          <!-- Play / pause icons. CSS shows play when idle/hovered,
               pause when this row is the currently playing track. -->
          <svg class="ico-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l16 9-16 9z"/></svg>
          <svg class="ico-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </div>
      </div>
    `);
    paintCover(row.querySelector('.thumb'), playlist);
    row.addEventListener('click', () => playTrack(playlist, i));
    quickPicks.appendChild(row);
  }

  // Build the "More from the shelf" section: every playlist EXCEPT the
  // currently featured one, rendered as a horizontal carousel of cards.
  const others = PLAYLISTS.filter(p => p.id !== playlist.id);
  const moreHead = el(`
    <div class="section-head">
      <div class="l">
        <h2>More from the shelf</h2>
        <span class="sub-cap">${others.length} other room${others.length === 1 ? '' : 's'}</span>
      </div>
      <div class="pager">
        <button title="scroll left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button title="scroll right">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
    </div>
  `);

  // The carousel itself. We render a smaller card per other playlist.
  // Clicking a card opens that playlist in the modal in place.
  const carousel = el(`<div class="carousel"></div>`);
  for (const other of others) {
    // role="button" + tabindex makes the card focusable and announceable
    // to screen readers as a button. The keydown handler activates the
    // card on Enter/Space so it works without a mouse.
    const card = el(`
      <div class="card" role="button" tabindex="0" aria-label="Open ${other.name}">
        <div class="art">
          <div class="cover-only"></div>
        </div>
        <div class="title">${other.name}</div>
        <div class="sub">EP, ${other.author}</div>
      </div>
    `);
    paintCover(card.querySelector('.cover-only'), other);
    card.addEventListener('click', () => openModal(other));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(other);
      }
    });
    carousel.appendChild(card);
  }

  // Wire the pager arrows to scroll the carousel left and right.
  const [leftBtn, rightBtn] = moreHead.querySelectorAll('.pager button');
  leftBtn.addEventListener('click', () => carousel.scrollBy({ left: -320, behavior: 'smooth' }));
  rightBtn.addEventListener('click', () => carousel.scrollBy({ left: 320, behavior: 'smooth' }));

  // Replace the root's contents with all five pieces, in order.
  root.innerHTML = '';
  root.appendChild(hero);
  root.appendChild(sectionHead);
  root.appendChild(quickPicks);
  root.appendChild(moreHead);
  root.appendChild(carousel);

}


/* ----- 6. All Playlists page ------------------------------------
   Renders the shelf page (playlists.html): a grid of cards, one per
   playlist. Each card shows the cover, title, author, and a heart
   button with a like count. Clicking the card opens the modal.
----------------------------------------------------------------- */

/**
 * Build a single playlist card element. The caller is responsible for
 * appending it into the page (see renderAllPlaylists).
 *
 * Two click handlers attached:
 *   - heart button  -> toggleLike (with stopPropagation so it doesn't
 *                      also bubble up and open the modal)
 *   - the card      -> openModal
 */
function createPlaylistCard(playlist) {
  const card = el(`
    <div class="card">
      <div class="art">
        <div class="cover-only"></div>
        <div class="card-tools">
          <button class="card-tool" type="button"
                  data-action="edit" data-playlist-id="${playlist.id}"
                  title="edit playlist" aria-label="Edit ${playlist.name}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4l4 4-11 11H5v-4z"/>
            </svg>
          </button>
          <button class="card-tool" type="button"
                  data-action="delete" data-playlist-id="${playlist.id}"
                  title="delete playlist" aria-label="Delete ${playlist.name}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <path d="M4 7h16"/>
              <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="title">${playlist.name}</div>
      <div class="sub">${playlist.author}</div>
      <div class="like-row">
        <button class="like-btn ${playlist.liked ? 'liked' : ''}" type="button"
                data-playlist-id="${playlist.id}">
          ${heartSVG(playlist.liked)}
          <span class="count">${playlist.likes}</span>
        </button>
      </div>
    </div>
  `);

  // Drop the cover art into the .cover-only slot.
  paintCover(card.querySelector('.cover-only'), playlist);

  // The card has THREE clickable things stacked on top of each other:
  // the heart, the edit/delete tools, and the card itself (which opens
  // the modal). Without help, clicking the heart would ALSO bubble up
  // to the card and open the modal at the same time.
  //
  // e.stopPropagation() blocks that bubble, so the inner buttons only
  // do their own action and the card's click handler stays quiet.

  // Heart button: like/unlike.
  card.querySelector('.like-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLike(playlist, card);
  });

  // Edit and delete buttons share a single handler. We tell them apart
  // by reading their data-action attribute.
  card.querySelectorAll('.card-tool').forEach(toolBtn => {
    toolBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = toolBtn.dataset.action;
      if (action === 'edit') {
        openPlaylistForm(playlist);
      } else if (action === 'delete') {
        deletePlaylist(playlist);
      }
    });
  });

  // Anywhere else on the card -> open the modal.
  card.addEventListener('click', () => openModal(playlist));

  return card;
}

/**
 * Render every playlist as a card into `container`.
 * Replaces the contents of `container`.
 */
function renderAllPlaylists(playlists, container) {
  container.innerHTML = '';

  if (playlists.length === 0) {
    container.innerHTML = `<div class="empty-state">No playlists found.</div>`;
    return;
  }

  for (const playlist of playlists) {
    container.appendChild(createPlaylistCard(playlist));
  }

  // Update the count text in the page header.
  const countEl = document.getElementById('playlist-count');
  if (countEl) countEl.textContent = `${playlists.length} records`;
}


/* ----- 7. Modal -------------------------------------------------
   The modal is the big floating panel that appears when you click a
   playlist card. The HTML for the modal is hard-coded inside both
   index.html and playlists.html (search for `id="modal-overlay"`),
   so this section only needs to FILL IN the bits that change per
   playlist (title, cover, tracklist, etc.) and toggle visibility.
----------------------------------------------------------------- */

/**
 * Fill in every modal field for the given playlist and reveal the modal
 * on screen.
 *
 * Steps:
 *   1. Remember which playlist is open (so other handlers can find it).
 *   2. Fill in title, author, meta line, cover, tracklist, and About panel.
 *   3. Reset to the Tracklist tab and reset the AI description card.
 *   4. Set the play/pause icon to match whatever the audio is doing.
 *   5. Add the "is-open" CSS class so the modal fades in, and lock the
 *      page from scrolling underneath the overlay.
 */
function openModal(playlist) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  OPEN_PLAYLIST = playlist;

  // Top mini title in the modal head.
  document.getElementById('modal-title-mini').textContent = playlist.name;

  // Big record on the left (cover + label color).
  paintRecord(document.getElementById('modal-record'), playlist);

  // Title, author, meta.
  document.getElementById('modal-title').textContent = playlist.name;
  document.getElementById('modal-author').textContent = playlist.author;
  document.getElementById('modal-meta').textContent = metaLine(playlist);

  // Tracklist on the right.
  renderModalTracklist(playlist);

  // About panel content (full description from Internet Archive, plus
  // album / year / license footer).
  renderModalAbout(playlist);

  // Default to the Tracklist tab when a new playlist is opened.
  setModalTab('tracklist');

  // Reset the AI description card to its placeholder state.
  resetAICard();

  // If this playlist is already playing, keep the vinyl spinning when
  // the modal opens. Otherwise start in the still state.
  const audio = document.getElementById('audio-player');
  const sameAsPlaying = NOW_PLAYING && NOW_PLAYING.playlistId === playlist.id && audio && !audio.paused;
  setPlayingState(!!sameAsPlaying);

  // Show the modal and lock the page from scrolling underneath.
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

/**
 * Update the modal's "is something playing" visuals.
 *
 * Two things change:
 *   1. The .spinning class on .record toggles the vinyl's spin animation
 *      (the CSS pre-defines the animation as paused; .spinning flips it
 *      to running — see _personal/concepts_cheatsheet.md section 19).
 *   2. The play button's icon swaps between a play triangle and a
 *      pause bar pair by replacing the inner <path>'s d attribute.
 *
 * This function ONLY changes visuals — actual audio play/pause happens
 * via the <audio> element's API in section 9b.
 */
function setPlayingState(isPlaying) {
  const record = document.getElementById('modal-record');
  const icon = document.getElementById('modal-play-icon');
  if (!record || !icon) return;
  // classList.toggle(name, force) is a handy form: if the second arg is
  // true it adds the class, if false it removes. Saves a manual if/else.
  record.classList.toggle('spinning', isPlaying);
  icon.innerHTML = isPlaying
    ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'  // pause: two bars
    : '<path d="M5 3l16 9-16 9z"/>';             // play: triangle
}

/**
 * Hide the modal and clear OPEN_PLAYLIST.
 *
 * We DON'T stop the audio here — the user might want to keep listening
 * after closing the modal. The now-playing hint stays visible so they
 * can pause/skip from the corner.
 *
 * Setting body.style.overflow back to '' (empty string) re-enables
 * scrolling on the page (we set it to 'hidden' in openModal so the
 * page underneath the modal couldn't scroll while the modal was open).
 */
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  OPEN_PLAYLIST = null;
}

/**
 * Render the modal's tracklist (right column).
 * Called by openModal and again by shuffle, since shuffle changes the order.
 */
function renderModalTracklist(playlist) {
  const list = document.getElementById('modal-tracklist');
  list.innerHTML = '';

  for (let i = 0; i < playlist.songs.length; i++) {
    const song = playlist.songs[i];
    const row = el(`
      <div class="track" data-playlist-id="${playlist.id}" data-song-index="${i}">
        <span class="num">${i + 1}</span>
        <span class="title">${song.title}</span>
        <span class="artist">${song.artist}</span>
        <span class="dur">${song.duration}</span>
      </div>
    `);
    row.addEventListener('click', () => playTrack(playlist, i));
    list.appendChild(row);
  }

  // Update the "12 tracks · 47:21" total in the tab bar.
  const total = document.getElementById('modal-total');
  total.textContent = `${playlist.songs.length} tracks, ${totalDuration(playlist.songs)}`;

  // After re-rendering, re-apply the .playing marker if applicable.
  syncPlayingUI();
}


/* ----- 8. Like toggle ------------------------------------------- */

/**
 * Toggle the like state for a playlist and update the heart icon
 * everywhere this playlist appears on the page.
 *
 * Two branches:
 *   unliked -> liked: likes goes up by 1, heart fills in, the clicked
 *                     heart bumps with a small scale animation.
 *   liked   -> unliked: likes goes down by 1, heart goes back to outline.
 *
 * Why we re-find every like button:
 *   The same playlist can appear in the page in TWO places at once —
 *   the shelf grid and the featured carousel. If we only updated the
 *   button the user clicked, the OTHER copy would show stale data.
 *   So we look up every `.like-btn` whose data-playlist-id matches
 *   and update them all together.
 */
function toggleLike(playlist, cardEl) {
  // Step 1: update the data model (the playlist object itself).
  // !!playlist.liked converts the value to a strict true/false in case
  // it was undefined or some other falsy value.
  const wasLiked = !!playlist.liked;
  playlist.liked = !wasLiked;
  playlist.likes += wasLiked ? -1 : 1;

  // Step 2: redraw every heart button that points at this playlist.
  const allButtons = document.querySelectorAll(`.like-btn[data-playlist-id="${playlist.id}"]`);
  allButtons.forEach(b => {
    b.classList.toggle('liked', playlist.liked);
    b.innerHTML = heartSVG(playlist.liked) + `<span class="count">${playlist.likes}</span>`;
  });

  // Step 3: bump animation, only on the actual heart the user clicked.
  // Other synced copies don't pulse — they just quietly update their
  // count, which feels less weird visually.
  if (!wasLiked) {
    const clicked = cardEl.querySelector('.like-btn');
    if (clicked) {
      clicked.classList.add('bumping');
      // Remove the class after the animation finishes so the next
      // click can trigger it fresh.
      setTimeout(() => clicked.classList.remove('bumping'), 400);
    }
  }
}


/* ----- 9. Shuffle ----------------------------------------------- */

/**
 * Return a NEW array with the same songs in a random order. The input
 * array is not changed.
 *
 * This uses the Fisher-Yates algorithm, which is the standard way to
 * shuffle an array fairly:
 *   - Walk from the LAST element down to the second.
 *   - At each step, pick a random index from 0 to i (inclusive).
 *   - Swap the element at i with the element at that random index.
 *
 * Every permutation has equal probability (unlike, say, sorting with a
 * random comparator, which is biased).
 */
function shuffleSongs(songs) {
  const out = songs.slice(); // .slice() with no args = a shallow copy
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Destructuring swap: the right side `[out[j], out[i]]` is built
    // first, then assigned back to `[out[i], out[j]]`. So out[i] and
    // out[j] swap places without needing a temp variable.
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Called when the modal's shuffle button is clicked. */
function onShuffleClick() {
  if (!OPEN_PLAYLIST) return;
  // Reorder songs in place. Future shuffles continue to produce
  // different orders. Original order is not preserved, documented in
  // planning.md.
  OPEN_PLAYLIST.songs = shuffleSongs(OPEN_PLAYLIST.songs);
  renderModalTracklist(OPEN_PLAYLIST);
  // Clear NOW_PLAYING so playTrack doesn't see "same playlist + same
  // index" and toggle pause instead of playing the freshly-shuffled
  // track sitting at index 0.
  NOW_PLAYING = null;
  playTrack(OPEN_PLAYLIST, 0);
}

/** Called when the modal's "next" button is clicked. */
function onNextClick() {
  if (!OPEN_PLAYLIST) return;
  // Empty playlist: nothing to advance to. Bail before the modulo
  // below would yield NaN and corrupt NOW_PLAYING.
  if (!OPEN_PLAYLIST.songs || !OPEN_PLAYLIST.songs.length) return;
  // If nothing from this playlist is playing yet, start at track 0.
  if (!NOW_PLAYING || NOW_PLAYING.playlistId !== OPEN_PLAYLIST.id) {
    playTrack(OPEN_PLAYLIST, 0);
    return;
  }
  // Otherwise advance to the next track, wrapping to 0 at the end so
  // the button never feels like a dead-end.
  const next = (NOW_PLAYING.songIndex + 1) % OPEN_PLAYLIST.songs.length;
  playTrack(OPEN_PLAYLIST, next);
}


/* ----- 9b. Audio playback --------------------------------------

   How playback works in this app, in plain English:

   1. There's exactly ONE <audio id="audio-player"> element on each
      page (in the HTML). To play a song we set its `src` attribute to
      the song's URL and call `.play()`. To switch tracks we swap the
      src and play again. The browser handles streaming and decoding
      for us — we don't have to know how mp3 works.

   2. We track which song is "current" in NOW_PLAYING (an object like
        { playlistId: "midnight-in-shoreditch", songIndex: 2 }
      ). Other parts of the UI read this to know which row to highlight,
      whether to spin the vinyl, what to show in the now-playing hint,
      etc. When playback stops, NOW_PLAYING goes back to null.

   3. Each song's URL is built from its data:
      - For curated playlists: song.file + playlist.source.identifier
        plug into the Internet Archive download URL pattern.
      - For user-added playlists: the user pasted a direct URL into
        song.url, which we use as-is.

   4. The <audio> element fires events as it goes through its lifecycle:
        play, pause, ended, error, loadedmetadata.
      We attach listeners to those (in wireAudioEvents) so the UI can
      react automatically.
----------------------------------------------------------------- */

let NOW_PLAYING = null;

/**
 * Build the streamable mp3 URL for one song.
 *
 * Priority:
 *   1. song.url    -> a direct URL (used by user-added playlists where
 *                     the user pasted a link to an mp3 / audio file).
 *   2. song.file + playlist.source.identifier -> an Internet Archive
 *                     stream URL built on the fly.
 *
 * Returns null when neither is available, in which case playTrack
 * silently no-ops.
 */
function buildAudioUrl(playlist, song) {
  if (!playlist || !song) return null;
  // Direct URL wins. trim() guards against trailing whitespace from
  // a copy-paste.
  if (song.url && String(song.url).trim()) return String(song.url).trim();
  if (!song.file) return null;
  if (!playlist.source || !playlist.source.identifier) return null;
  const id = encodeURIComponent(playlist.source.identifier);
  const file = encodeURIComponent(song.file);
  return `https://archive.org/download/${id}/${file}`;
}

/**
 * Start playing a specific song from a playlist.
 *
 * The flow:
 *   1. Validate the inputs. If anything is off (no playlist, bad
 *      songIndex, empty songs array) we return early so we don't
 *      corrupt NOW_PLAYING with bogus values.
 *   2. Build the audio URL. If we can't (no song.url AND no song.file),
 *      return early — the song isn't playable.
 *   3. Special case: if THIS exact song is already the current track,
 *      treat the click as a pause/resume toggle.
 *   4. Otherwise, swap the audio src to the new URL, call .play(),
 *      record the new NOW_PLAYING, and sync the UI.
 *
 * Note on .play().catch(): browsers can reject .play() if the user
 * hasn't interacted with the page yet (autoplay policies). We log
 * the error but don't try to recover — the click that triggered this
 * counts as user interaction so it usually won't fire.
 */
function playTrack(playlist, songIndex) {
  // Step 1: bounds checks.
  if (!playlist || !Array.isArray(playlist.songs) || playlist.songs.length === 0) return;
  if (!Number.isInteger(songIndex) || songIndex < 0 || songIndex >= playlist.songs.length) return;

  const song = playlist.songs[songIndex];
  const url = buildAudioUrl(playlist, song);
  const audio = document.getElementById('audio-player');
  if (!audio || !url) return;

  // Step 3: same-song-clicked? Toggle pause/play.
  if (NOW_PLAYING && NOW_PLAYING.playlistId === playlist.id && NOW_PLAYING.songIndex === songIndex) {
    if (audio.paused) audio.play();
    else audio.pause();
    return;
  }

  // Step 4: switch to the new song.
  audio.src = url;
  audio.play().catch(err => console.warn('audio play failed:', err.message));
  NOW_PLAYING = { playlistId: playlist.id, songIndex };
  syncPlayingUI();
}

/**
 * Make every visible piece of the UI agree with NOW_PLAYING. Call this
 * after anything that changes which song is playing.
 *
 * Steps:
 *   1. Strip the .playing CSS class from any row that previously had
 *      it (so highlights from old tracks go away).
 *   2. If nothing is playing, hide the now-playing hint and stop the
 *      modal's vinyl spin.
 *   3. Otherwise, find every row whose data attributes match the
 *      currently playing song and add .playing to highlight them.
 *      (We use querySelectorAll because the same song can show up in
 *      Quick Picks AND the modal tracklist.)
 *   4. If the modal is showing the playing playlist, spin its vinyl.
 *   5. Show the floating now-playing hint with the song's info.
 */
function syncPlayingUI() {
  document.querySelectorAll('.pick.playing, .track.playing').forEach(el => {
    el.classList.remove('playing');
  });

  if (!NOW_PLAYING) {
    setPlayingState(false);
    hideNowPlayingHint();
    return;
  }

  const sel = `[data-playlist-id="${NOW_PLAYING.playlistId}"][data-song-index="${NOW_PLAYING.songIndex}"]`;
  document.querySelectorAll(sel).forEach(el => el.classList.add('playing'));

  if (OPEN_PLAYLIST && OPEN_PLAYLIST.id === NOW_PLAYING.playlistId) {
    setPlayingState(true);
  }

  showNowPlayingHint();
}

/** Pause whatever's playing and clear the now-playing state. */
function stopPlayback() {
  const audio = document.getElementById('audio-player');
  if (audio) audio.pause();
  NOW_PLAYING = null;
  syncPlayingUI();
}

/**
 * Listen for events the <audio> element emits so the UI keeps up with
 * what the audio is actually doing. Called once at boot.
 *
 * The audio element fires these events on its own:
 *   - 'pause'  : the user (or our code) paused playback.
 *   - 'play'   : playback resumed.
 *   - 'ended'  : the current track finished naturally.
 *   - 'error'  : the URL failed to load.
 *
 * Each handler updates the visual state to match (icon swaps, vinyl
 * spin, auto-advance to the next track, etc.).
 */
function wireAudioEvents() {
  const audio = document.getElementById('audio-player');
  if (!audio) return;

  audio.addEventListener('pause', () => {
    setPlayingState(false);
    // Add a marker class on <body> so CSS can flip the Quick Picks /
    // track-row icons back to a play triangle while keeping the row's
    // amber highlight. (See style.css `body.audio-paused .pick.playing`.)
    document.body.classList.add('audio-paused');
    updateHintToggleIcon();
  });

  audio.addEventListener('play', () => {
    // Spin the vinyl only if the modal is currently showing the
    // playlist whose song is playing.
    if (OPEN_PLAYLIST && NOW_PLAYING && OPEN_PLAYLIST.id === NOW_PLAYING.playlistId) {
      setPlayingState(true);
    }
    document.body.classList.remove('audio-paused');
    updateHintToggleIcon();
  });

  // Auto-advance: when one song ends, play the next one in the
  // playlist. If we're at the last song, stop instead of looping.
  audio.addEventListener('ended', () => {
    if (!NOW_PLAYING) return;
    const playlist = PLAYLISTS.find(p => p.id === NOW_PLAYING.playlistId);
    if (!playlist) return;
    const nextIndex = NOW_PLAYING.songIndex + 1;
    if (nextIndex < playlist.songs.length) {
      playTrack(playlist, nextIndex);
    } else {
      stopPlayback();
    }
  });

  // Once the browser knows how long the audio is, write that back to
  // the song's `duration` field if it was missing or "0:00". This is
  // how user-added songs get their real length without typing it in.
  audio.addEventListener('loadedmetadata', () => {
    if (!NOW_PLAYING) return;
    const playlist = PLAYLISTS.find(p => p.id === NOW_PLAYING.playlistId);
    if (!playlist) return;
    const song = playlist.songs[NOW_PLAYING.songIndex];
    if (!song) return;
    const realSec = audio.duration;
    if (!Number.isFinite(realSec) || realSec <= 0) return;
    const formatted = formatSeconds(realSec);
    // Only overwrite when the stored value is missing or the
    // placeholder "0:00" so we don't trample a curated playlist's
    // real metadata.
    if (!song.duration || song.duration === '0:00') {
      song.duration = formatted;
      // Repaint anywhere the duration shows up.
      if (OPEN_PLAYLIST && OPEN_PLAYLIST.id === playlist.id) {
        document.getElementById('modal-meta').textContent = metaLine(playlist);
        renderModalTracklist(playlist);
      }
      // Quick Picks rows on the Featured page show the duration too.
      // Update any matching row in place.
      const rows = document.querySelectorAll(
        `.pick[data-playlist-id="${playlist.id}"][data-song-index="${NOW_PLAYING.songIndex}"] .dur`
      );
      rows.forEach(el => { el.textContent = formatted; });
    }
  });

  // If a track URL fails (404, network error, CORS, wrong MIME type),
  // surface a small error in the now-playing hint so the user gets
  // feedback instead of silent failure, then bail.
  audio.addEventListener('error', () => {
    console.warn('audio error, skipping track');
    flashAudioError();
    stopPlayback();
  });
}

/** Format a number of seconds as M:SS, matching the JSON's format. */
function formatSeconds(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Show a 3-second toast in the bottom-right when an audio source
 * can't be loaded. Reuses the now-playing hint container so it
 * blends visually with the rest of the playback chrome.
 */
function flashAudioError() {
  let toast = document.getElementById('audio-error-toast');
  if (!toast) {
    toast = el(`
      <div id="audio-error-toast" class="audio-error-toast" role="status">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 8v5"/><path d="M12 16h.01"/>
        </svg>
        <span>Couldn't play that track. The link may be broken or blocked.</span>
      </div>
    `);
    document.body.appendChild(toast);
  }
  toast.classList.add('open');
  clearTimeout(flashAudioError._t);
  flashAudioError._t = setTimeout(() => toast.classList.remove('open'), 3500);
}

/* Now-playing hint, pinned to the bottom-right of the page. */

function showNowPlayingHint() {
  if (!NOW_PLAYING) return;
  const playlist = PLAYLISTS.find(p => p.id === NOW_PLAYING.playlistId);
  if (!playlist) return;
  const song = playlist.songs[NOW_PLAYING.songIndex];

  let hint = document.getElementById('now-playing-hint');
  if (!hint) {
    hint = el(`
      <div id="now-playing-hint" class="now-playing-hint">
        <div class="np-thumb"></div>
        <div class="np-info">
          <div class="np-title"></div>
          <div class="np-sub"></div>
        </div>
        <button class="np-toggle" type="button" aria-label="play/pause">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
        </button>
        <button class="np-close" type="button" aria-label="stop">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
      </div>
    `);
    document.body.appendChild(hint);
    hint.querySelector('.np-toggle').addEventListener('click', () => {
      const audio = document.getElementById('audio-player');
      if (!audio) return;
      if (audio.paused) audio.play(); else audio.pause();
    });
    hint.querySelector('.np-close').addEventListener('click', stopPlayback);
  }

  paintCover(hint.querySelector('.np-thumb'), playlist);
  hint.querySelector('.np-title').textContent = song.title;
  hint.querySelector('.np-sub').textContent = `${song.artist} · ${playlist.name}`;
  hint.classList.add('open');
  updateHintToggleIcon();
}

function updateHintToggleIcon() {
  const audio = document.getElementById('audio-player');
  const btn = document.querySelector('#now-playing-hint .np-toggle');
  if (!audio || !btn) return;
  btn.innerHTML = audio.paused
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l16 9-16 9z"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
}

function hideNowPlayingHint() {
  const hint = document.getElementById('now-playing-hint');
  if (hint) hint.classList.remove('open');
}


/* ----- 10. AI description --------------------------------------
   The "Get description" button in the modal sends the playlist's
   metadata to OpenRouter (an API that proxies many LLMs). The model
   replies with a short blurb that's shown in the modal.

   Pieces in this section:
     - resetAICard:           reset the card UI when a new modal opens.
     - buildAIPrompt:         assemble the user message from the
                              playlist's source-of-record metadata.
     - getPlaylistDescription: try a chain of free models, return the
                              first non-empty answer, or throw.
     - callOpenRouter:        a single fetch() call to the API.
     - onAIClick:             button click handler.
----------------------------------------------------------------- */

/**
 * Reset the AI description card to its initial state when the modal opens
 * for a new playlist.
 */
function resetAICard() {
  const text = document.getElementById('ai-text');
  const status = document.getElementById('ai-status');
  const btn = document.getElementById('ai-btn');
  text.textContent = `Click "Get description" for an AI-generated note about this playlist.`;
  status.textContent = '';
  btn.disabled = false;
  btn.innerHTML = `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>
    </svg>
    Get description
  `;
}

/**
 * Build the user-message string we send to the AI.
 *
 * The string has two parts:
 *   1. A "STRICT RULES" block telling the model exactly what NOT to do
 *      (don't invent facts, don't list songs, don't dress it up with
 *      marketing language). This combats hallucination.
 *   2. A "FACTS" block listing every piece of real metadata we have
 *      (year, genres, archive.org description, song titles). The model
 *      is told to write only from these facts.
 *
 * Why the rules are this strict: our playlist names like "midnight in
 * shoreditch" are invented by us, NOT real albums. Without explicit
 * guidance the model will cheerfully make up a backstory for them.
 */
function buildAIPrompt(playlist) {
  const src = playlist.source || {};

  // Build up the FACTS list one bullet at a time, only adding fields
  // that actually exist (some playlists don't have every field).
  const facts = [];
  if (src.albumTitle)  facts.push(`- Original album title: ${src.albumTitle}`);
  if (src.albumArtist) facts.push(`- Original album artist: ${src.albumArtist}`);
  if (src.year)        facts.push(`- Year: ${src.year}`);
  if (Array.isArray(src.subjects) && src.subjects.length) {
    facts.push(`- Genres / tags: ${src.subjects.join(', ')}`);
  }
  facts.push(`- Mood tag (curator-assigned): ${playlist.mood || 'unspecified'}`);
  if (src.description) {
    facts.push(`- Source description (verbatim from Internet Archive): ${src.description}`);
  }
  // Defensive: skip these if songs is missing for some reason, instead
  // of crashing on .length / .map.
  if (Array.isArray(playlist.songs) && playlist.songs.length) {
    facts.push(`- Track count: ${playlist.songs.length}`);
    facts.push(`- Track titles: ${playlist.songs.map(s => s.title).join(' | ')}`);
  }

  // Join everything with newlines into one big multi-line string.
  return [
    `Write a 2 to 3 sentence description of this music collection's mood and feel.`,
    ``,
    `STRICT RULES:`,
    `- Use ONLY information present in the FACTS block below. Do not invent locations, dates, recording histories, or backstory.`,
    `- The display name "${playlist.name}" and curator "${playlist.author}" are this app's own playlist labels — do NOT treat them as a real album or artist; do not weave them into factual claims.`,
    `- If the original album artist is in the facts, you may name them. Do not name any artist that is not listed.`,
    `- Do not list songs individually.`,
    `- Avoid marketing language, clichés, and emoji.`,
    `- If the FACTS are sparse, write a shorter, more cautious description rather than filling the gap with invention.`,
    ``,
    `FACTS:`,
    facts.join('\n'),
  ].join('\n');
}

/**
 * Ask OpenRouter for an AI-generated description of the playlist.
 *
 * Why a fallback chain instead of a single model: free OpenRouter
 * models get rate-limited (HTTP 429) constantly. Rather than show
 * "rate limited" errors, we just try the next model in the list.
 *
 * Returns the trimmed description text on success.
 * Throws an Error if all models fail, the key is missing, etc.
 * The caller (onAIClick) catches the throw and shows FALLBACK_TEXT.
 *
 * The API key lives in config.js (gitignored). buildAIPrompt produces
 * the user message; we add a short system message so the model stays
 * in "careful music critic" voice.
 */
const FALLBACK_TEXT = `Could not generate a description right now. Try again in a moment.`;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function getPlaylistDescription(playlist) {
  const cfg = window.APP_CONFIG;
  if (!cfg || !cfg.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key missing. Copy config.example.js to config.js and fill it in.');
  }

  const userPrompt = buildAIPrompt(playlist);
  const messages = [
    {
      role: 'system',
      content: [
        'You are a careful, observational music critic.',
        'You only use information given in the user message. You never invent facts.',
        'If a fact is not stated, you do not include it. You would rather write a shorter description than guess.',
        'Reply in 2 to 3 sentences. No marketing language. No clichés. No emoji. Do not list songs individually.',
      ].join(' '),
    },
    { role: 'user', content: userPrompt },
  ];

  const models = (cfg.OPENROUTER_MODELS && cfg.OPENROUTER_MODELS.length)
    ? cfg.OPENROUTER_MODELS
    : ['openai/gpt-oss-20b:free'];

  // Walk the list of models in order. The first one that returns
  // non-empty text wins; we return immediately. If a model fails or
  // returns empty content, remember the error and try the next one.
  let lastErr = null;
  for (const model of models) {
    try {
      const text = await callOpenRouter(model, messages, cfg.OPENROUTER_API_KEY);
      if (text && text.trim()) return text.trim();
      // 200 OK but empty content. Treat as a failure and try the next.
      lastErr = new Error(`empty response from ${model}`);
    } catch (err) {
      lastErr = err;
      // 429 = throttled, anything else = some other failure. Either
      // way, fall through to the next model rather than giving up.
      console.warn(`OpenRouter ${model} failed:`, err.message);
    }
  }
  // Every model failed. Throw so onAIClick shows FALLBACK_TEXT.
  throw lastErr || new Error('all OpenRouter models failed');
}

/**
 * Make ONE POST request to OpenRouter and return the model's reply.
 *
 * This is just a normal fetch() call. The interesting parts:
 *   - method: 'POST' because we're sending data, not just reading.
 *   - Authorization header: standard "Bearer <key>" pattern for API
 *     keys. The server checks this to know we're allowed to call it.
 *   - Content-Type: application/json tells the server the body is JSON.
 *   - The body itself must be a STRING (not a JS object), so we use
 *     JSON.stringify to serialize it.
 *
 * The response:
 *   - res.ok is true for status codes 200-299. False otherwise.
 *   - res.json() parses the response body as JSON. It's async because
 *     parsing the full body might require waiting for more bytes.
 *   - The chat-completion shape OpenRouter returns:
 *       { choices: [{ message: { content: "the AI's reply" } }] }
 *
 * Throws on any non-OK status, or if the response body has an `error`
 * field (OpenRouter sometimes returns 200 with an error inside).
 */
async function callOpenRouter(model, messages, apiKey) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter wants these for attribution. Optional, but polite.
      'HTTP-Referer': window.location.origin || 'http://localhost',
      'X-Title': 'the rising songs',
    },
    body: JSON.stringify({
      model,
      messages,
      // Generous token budget. Some models (gpt-oss, etc.) emit "reasoning
      // tokens" that count against the limit, so a tight cap can make
      // them run out mid-answer.
      max_tokens: 600,
      // Low temperature = less random, sticks closer to the prompt.
      // This is what stops the model from inventing fake facts.
      temperature: 0.3,
    }),
  });

  // Handle non-2xx responses by reading whatever the server returned
  // and throwing it as an error message we can log later.
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      // The ?. (optional chaining) here just avoids crashing if the
      // response shape doesn't have an `error.message` field.
      detail = j?.error?.message || JSON.stringify(j);
    } catch (_) {
      // If the body wasn't even JSON, fall back to the raw text.
      detail = await res.text();
    }
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }

  // Even with a 200 OK, OpenRouter sometimes embeds an error in the
  // body (e.g. when the upstream provider is throttled). Surface those
  // as thrown errors too so the fallback chain can move on.
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter error');

  // Pull out the assistant's reply. Optional chaining keeps us safe
  // if the shape is unexpectedly different.
  const content = data.choices?.[0]?.message?.content;
  return content || '';
}

function setAIText(text, statusLabel = '') {
  document.getElementById('ai-text').textContent = text;
  document.getElementById('ai-status').textContent = statusLabel;
}

/**
 * Click handler for the "Get description" button in the modal's AI
 * card. Manages the three UI states: loading, success, error.
 *
 * try/catch/finally pattern:
 *   - try   : do the work that might throw (the API call).
 *   - catch : if it throws, show the fallback message.
 *   - finally: re-enable the button no matter what so the user can
 *             retry on failure.
 */
async function onAIClick() {
  if (!OPEN_PLAYLIST) return;
  const btn = document.getElementById('ai-btn');
  const status = document.getElementById('ai-status');

  // Show the "loading" state: disable the button, show animated dots,
  // and put placeholder text in the description area.
  btn.disabled = true;
  status.innerHTML = `<span class="dots"><span></span><span></span><span></span></span> generating`;
  document.getElementById('ai-text').textContent = 'Reading the room...';

  try {
    const description = await getPlaylistDescription(OPEN_PLAYLIST);
    setAIText(description, 'generated');
  } catch (err) {
    console.error(err);
    setAIText(FALLBACK_TEXT, 'error');
  } finally {
    btn.disabled = false;
  }
}


/* ----- 10b. Playlist add / edit / delete (stretch) -------------
   The shelf page exposes three management actions:
     - "+" button in the page-head opens a blank form.
     - pen icon on each card opens the same form, prefilled.
     - trash icon on each card removes the playlist after confirm.
   Added playlists live in PLAYLISTS like any other; they participate
   in search, sorting, the modal, and audio playback if the user
   provided file URLs (rare — usually they won't, so playback for
   user-added songs just no-ops).
----------------------------------------------------------------- */

// The playlist currently being edited, or null when the form is in
// "add new" mode. Used by the form's submit handler to decide whether
// to update an existing record or create a new one.
let EDITING_PLAYLIST = null;

// Staged cover image for the form, as a data-URI string. The user
// uploads an image and we read it via FileReader; the preview tile
// shows it, and the value is committed to playlist.coverImage on
// submit. Reset whenever the form opens.
let FORM_COVER_IMAGE = null;

/**
 * Open the playlist form modal.
 *
 * The same form handles BOTH "create new" and "edit existing":
 *   - If `playlist` is provided, we open in EDIT mode and prefill
 *     every field from the existing record.
 *   - If `playlist` is undefined, we open in CREATE mode with empty
 *     fields and a single blank song row.
 *
 * The `condition ? a : b` syntax below is a "ternary expression" —
 * a one-line if/else. Equivalent to:
 *     if (playlist) { ... } else { ... }
 */
function openPlaylistForm(playlist) {
  const overlay = document.getElementById('form-overlay');
  if (!overlay) return;

  EDITING_PLAYLIST = playlist || null;

  // Swap the heading + submit-button text based on which mode we're in.
  document.getElementById('form-eyebrow').textContent =
    playlist ? 'Edit playlist' : 'New playlist';
  document.getElementById('form-submit').textContent =
    playlist ? 'Save changes' : 'Create playlist';

  // Prefill (or clear) the basic fields.
  // The double-ternary on mood/cover (`playlist ? (playlist.mood || 'focus') : 'focus'`)
  // means: in EDIT mode, use playlist.mood, but if that's missing fall
  // back to 'focus'; in CREATE mode just use 'focus'.
  document.getElementById('form-name').value   = playlist ? playlist.name   : '';
  document.getElementById('form-author').value = playlist ? playlist.author : '';
  document.getElementById('form-mood').value   = playlist ? (playlist.mood || 'focus') : 'focus';
  document.getElementById('form-cover').value  = playlist ? (playlist.coverKey || 'midnight') : 'midnight';

  // Stage the existing custom cover (if any) so the preview tile shows
  // it and submitting without re-uploading keeps it.
  FORM_COVER_IMAGE = playlist && playlist.coverImage ? playlist.coverImage : null;
  syncCoverPreview();
  // Reset the file input so picking the same file again still fires change.
  const fileInput = document.getElementById('form-cover-file');
  if (fileInput) fileInput.value = '';

  // Rebuild the song rows.
  const songsRoot = document.getElementById('form-songs');
  songsRoot.innerHTML = '';
  const seedSongs = playlist && playlist.songs && playlist.songs.length
    ? playlist.songs
    : [{ title: '', artist: '', duration: '' }];
  seedSongs.forEach(s => songsRoot.appendChild(buildSongRow(s)));

  // Reset error state.
  const err = document.getElementById('form-error');
  err.hidden = true;
  err.textContent = '';

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus the name field for fast input.
  setTimeout(() => document.getElementById('form-name').focus(), 50);
}

/** Hide the playlist form modal. */
function closePlaylistForm() {
  const overlay = document.getElementById('form-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  // Only release the body scroll lock if the main modal isn't also open.
  const mainOpen = document.getElementById('modal-overlay');
  if (!mainOpen || !mainOpen.classList.contains('is-open')) {
    document.body.style.overflow = '';
  }
  EDITING_PLAYLIST = null;
}

/**
 * Build one row of the song list inside the form. Each row has
 * three inputs (title, artist, duration) and a remove button.
 */
function buildSongRow(song) {
  const row = el(`
    <div class="form-song-row">
      <div class="song-row-main">
        <input class="song-title"    placeholder="title"    autocomplete="off">
        <input class="song-artist"   placeholder="artist"   autocomplete="off">
        <input class="song-duration" placeholder="3:24"     autocomplete="off">
        <button type="button" class="form-remove-song" aria-label="remove song">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
            <path d="M6 6l12 12M6 18L18 6"/>
          </svg>
        </button>
      </div>
      <input class="song-url" type="url" autocomplete="off"
             placeholder="audio url (https://… .mp3) — optional, for playback">
    </div>
  `);
  row.querySelector('.song-title').value    = song.title    || '';
  row.querySelector('.song-artist').value   = song.artist   || '';
  row.querySelector('.song-duration').value = song.duration || '';
  row.querySelector('.song-url').value      = song.url      || '';
  row.querySelector('.form-remove-song').addEventListener('click', () => {
    // Don't let the user delete the last row — they need at least one.
    const rows = document.querySelectorAll('#form-songs .form-song-row');
    if (rows.length > 1) row.remove();
  });
  return row;
}

/**
 * Run when the playlist form is submitted (Save / Save changes).
 *
 * Steps:
 *   1. e.preventDefault() — stops the browser's default behavior of
 *      submitting the form (which would reload the page).
 *   2. Read every input value, validate.
 *   3. Build a songs array from the song rows.
 *   4. Either UPDATE an existing playlist (EDIT mode) or PUSH a new
 *      one to PLAYLISTS (CREATE mode).
 *   5. Close the form, re-render the grid.
 */
function submitPlaylistForm(e) {
  e.preventDefault();

  const name   = document.getElementById('form-name').value.trim();
  const author = document.getElementById('form-author').value.trim();
  const mood   = document.getElementById('form-mood').value;
  const coverKey = document.getElementById('form-cover').value;

  const errBox = document.getElementById('form-error');
  const showError = (msg) => {
    errBox.textContent = msg;
    errBox.hidden = false;
  };

  if (!name)   return showError('Please give the playlist a name.');
  if (!author) return showError('Please add an author.');

  // Collect songs (skip empties — only require a title for the song to
  // count). If nothing valid was entered, complain.
  //
  // For curated playlists (the 8 from data.json), each song has a
  // `file` field that the IA streaming URL is built from. The form
  // doesn't expose `file` as an input, so on EDIT we preserve the
  // original `file` value by matching the form's row to the original
  // songs by title+artist. Plain index matching would silently bind
  // the wrong file when the user deletes or reorders rows mid-edit.
  const songRows = document.querySelectorAll('#form-songs .form-song-row');
  const songs = [];
  const originalSongs = (EDITING_PLAYLIST && Array.isArray(EDITING_PLAYLIST.songs))
    ? EDITING_PLAYLIST.songs
    : [];
  // Pool of available original songs to match against. We pull each
  // matched original out of the pool so two form rows with the same
  // title+artist don't both claim the same source file.
  const originalPool = originalSongs.slice();
  const findOriginal = (title, artist) => {
    const tLower = title.toLowerCase();
    const aLower = (artist || '').toLowerCase();
    const idx = originalPool.findIndex(s =>
      (s.title || '').toLowerCase() === tLower &&
      (s.artist || '').toLowerCase() === aLower
    );
    if (idx === -1) return null;
    const [match] = originalPool.splice(idx, 1);
    return match;
  };
  songRows.forEach(r => {
    const t = r.querySelector('.song-title').value.trim();
    if (!t) return;
    const artist = r.querySelector('.song-artist').value.trim() || 'Unknown';
    const url = r.querySelector('.song-url').value.trim();
    const orig = findOriginal(t, artist);
    songs.push({
      title:    t,
      artist,
      // Run the duration through normalizeDuration so anything garbage
      // ("abc", "5", "") gets coerced into a clean "M:SS" string.
      duration: normalizeDuration(r.querySelector('.song-duration').value),
      // Direct audio URL (mp3 or any browser-playable format). Optional.
      // If empty, playTrack returns null and the row just won't play.
      url: url || null,
      // Preserve the original `file` only for rows that match an
      // existing curated song by title+artist. New rows or renamed
      // rows have no claim to any source file.
      file: orig && orig.file ? orig.file : null,
    });
  });
  if (!songs.length) return showError('Add at least one song with a title.');

  if (EDITING_PLAYLIST) {
    // EDIT mode: update the existing playlist record in place. Keep
    // likes / liked / id / addedAt unchanged.
    EDITING_PLAYLIST.name = name;
    EDITING_PLAYLIST.author = author;
    EDITING_PLAYLIST.mood = mood;
    EDITING_PLAYLIST.coverKey = coverKey;
    EDITING_PLAYLIST.coverImage = FORM_COVER_IMAGE || null;
    EDITING_PLAYLIST.songs = songs;

    // If the user is currently playing a song from this playlist and
    // the edit removed enough songs that NOW_PLAYING.songIndex no
    // longer points at a real song, stop playback so the now-playing
    // hint doesn't render `undefined.title`.
    if (NOW_PLAYING && NOW_PLAYING.playlistId === EDITING_PLAYLIST.id) {
      if (NOW_PLAYING.songIndex >= songs.length) {
        stopPlayback();
      }
    }

    // If the modal is open on this playlist, refresh its tracklist
    // and About panel so the user immediately sees the updated state.
    if (OPEN_PLAYLIST && OPEN_PLAYLIST.id === EDITING_PLAYLIST.id) {
      document.getElementById('modal-title').textContent = EDITING_PLAYLIST.name;
      document.getElementById('modal-author').textContent = EDITING_PLAYLIST.author;
      document.getElementById('modal-meta').textContent = metaLine(EDITING_PLAYLIST);
      document.getElementById('modal-title-mini').textContent = EDITING_PLAYLIST.name;
      paintRecord(document.getElementById('modal-record'), EDITING_PLAYLIST);
      renderModalTracklist(EDITING_PLAYLIST);
      renderModalAbout(EDITING_PLAYLIST);
    }
  } else {
    // CREATE mode: build a new playlist record and prepend it so the
    // user sees their addition at the top of the grid.
    const newPlaylist = {
      id: makePlaylistId(name),
      name,
      author,
      coverKey,
      coverImage: FORM_COVER_IMAGE || null,
      mood,
      likes: 0,
      liked: false,
      addedAt: todayISO(),
      songs,
      // Marker that lets us style or filter user-added playlists later.
      userAdded: true,
      // Empty source object — the AI summary code already handles
      // missing fields gracefully (FACTS block stays sparse).
      source: {},
    };
    PLAYLISTS.unshift(newPlaylist);
  }

  closePlaylistForm();
  // Re-render the visible grid using the current URL filters + search.
  rerenderShelf();
}

/**
 * Remove a playlist after a quick confirm.
 * Also stops playback if a song from this playlist is currently playing.
 */
function deletePlaylist(playlist) {
  // confirm() is the standard way to ask "are you sure?" in vanilla JS.
  // It's plain but it works on every browser without us having to build
  // our own confirmation modal.
  const ok = confirm(`Delete "${playlist.name}"? This can't be undone.`);
  if (!ok) return;

  // If the deleted playlist is currently playing, stop playback so the
  // now-playing hint doesn't point at a record that no longer exists.
  if (NOW_PLAYING && NOW_PLAYING.playlistId === playlist.id) {
    stopPlayback();
  }

  const i = PLAYLISTS.findIndex(p => p.id === playlist.id);
  if (i !== -1) PLAYLISTS.splice(i, 1);

  rerenderShelf();
}

/**
 * Re-render the playlist grid using the current URL filters + search.
 * Called after add / edit / delete so changes show up immediately.
 */
function rerenderShelf() {
  const root = document.getElementById('playlist-cards-root');
  if (!root) return;
  const params = new URLSearchParams(window.location.search);
  let list = applyFilters(PLAYLISTS, params);
  // Apply current search query if the input has one.
  const input = document.querySelector('.topbar .search input');
  const q = input ? input.value.trim().toLowerCase() : '';
  if (q) {
    list = list.filter(p => {
      if (p.name.toLowerCase().includes(q)) return true;
      if ((p.author || '').toLowerCase().includes(q)) return true;
      if ((p.mood || '').toLowerCase().includes(q)) return true;
      return (p.songs || []).some(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q)
      );
    });
  }
  renderAllPlaylists(list, root);
}

/** Build a slug-style id from the playlist name; append a number if it collides. */
function makePlaylistId(name) {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'playlist';
  let id = slug;
  let n = 2;
  while (PLAYLISTS.some(p => p.id === id)) {
    id = `${slug}-${n++}`;
  }
  return id;
}

/**
 * Coerce free-form user input into a clean "M:SS" duration string.
 *
 * Examples:
 *   "3:24"  -> "3:24"
 *   "3:7"   -> "3:07"   (pads seconds)
 *   "5"     -> "5:00"   (assumes whole minutes)
 *   ""      -> "0:00"
 *   "abc"   -> "0:00"
 *   "3:65"  -> "3:00"   (clamps invalid seconds)
 */
function normalizeDuration(raw) {
  const s = String(raw || '').trim();
  if (!s) return '0:00';
  const parts = s.split(':');
  let m = parseInt(parts[0], 10);
  let sec = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  if (!Number.isFinite(m) || m < 0) m = 0;
  if (!Number.isFinite(sec) || sec < 0 || sec > 59) sec = 0;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Today's date as YYYY-MM-DD, used for the new-playlist addedAt field. */
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Refresh the cover-preview tile in the form to match FORM_COVER_IMAGE.
 * If a custom image is staged, the preview shows it and the "clear"
 * button appears. Otherwise the preview is blank (the dropdown selection
 * will be used at submit time).
 */
function syncCoverPreview() {
  const preview = document.getElementById('form-cover-preview');
  const clearBtn = document.getElementById('form-cover-clear');
  if (!preview) return;
  preview.innerHTML = '';
  if (FORM_COVER_IMAGE) {
    const img = document.createElement('img');
    img.src = FORM_COVER_IMAGE;
    img.alt = 'cover preview';
    preview.appendChild(img);
    if (clearBtn) clearBtn.hidden = false;
  } else {
    if (clearBtn) clearBtn.hidden = true;
  }
}

/** Wire the form modal's open/close/submit/song-row handlers (called once at boot). */
function wirePlaylistForm() {
  const overlay = document.getElementById('form-overlay');
  if (!overlay) return;

  document.getElementById('form-close').addEventListener('click', closePlaylistForm);
  document.getElementById('form-cancel').addEventListener('click', closePlaylistForm);
  // Click outside the panel closes the form.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePlaylistForm();
  });
  // Escape closes the form (and only the form — main modal listener
  // gates on the main overlay's open state).
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closePlaylistForm();
    }
  });

  document.getElementById('form-add-song').addEventListener('click', () => {
    document.getElementById('form-songs').appendChild(
      buildSongRow({ title: '', artist: '', duration: '', url: '' })
    );
  });

  document.getElementById('playlist-form').addEventListener('submit', submitPlaylistForm);

  // Cover image upload: button proxies the hidden file input. We read
  // the chosen file as a data-URI so the image survives in memory
  // without us having to upload anywhere.
  const fileInput = document.getElementById('form-cover-file');
  const uploadBtn = document.getElementById('form-cover-upload');
  const clearBtn  = document.getElementById('form-cover-clear');
  if (uploadBtn && fileInput) {
    // The browser's default <input type="file"> button is ugly and
    // can't be styled freely. So we hide it and use our own button
    // that just calls .click() on the hidden input. The file picker
    // dialog still opens normally.
    uploadBtn.addEventListener('click', () => fileInput.click());

    // The 'change' event fires after the user picks a file. fileInput.files
    // is a FileList (array-like collection of File objects). [0] grabs
    // the first one (we only allow single-file uploads).
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      // Cap at ~3MB so a giant photo doesn't bloat the in-memory state.
      // file.size is in bytes; 3 * 1024 * 1024 = 3 MB.
      if (file.size > 3 * 1024 * 1024) {
        const errBox = document.getElementById('form-error');
        if (errBox) {
          errBox.textContent = 'Cover image must be 3MB or smaller.';
          errBox.hidden = false;
        }
        fileInput.value = '';
        return;
      }

      // FileReader reads a File asynchronously. We use readAsDataURL,
      // which gives us the file as a base64 data-URI string like:
      //   "data:image/png;base64,iVBORw0KGgo..."
      // That string can be dropped straight into <img src="..."> and
      // displayed without any network call. We store it on
      // FORM_COVER_IMAGE so the form's submit handler can save it
      // onto the playlist's coverImage field.
      const reader = new FileReader();
      reader.onload = () => {
        FORM_COVER_IMAGE = reader.result;
        syncCoverPreview();
      };
      reader.readAsDataURL(file);
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      FORM_COVER_IMAGE = null;
      if (fileInput) fileInput.value = '';
      syncCoverPreview();
    });
  }

  // The big "+" button in the page head opens the form in CREATE mode.
  const addBtn = document.getElementById('add-playlist-btn');
  if (addBtn) addBtn.addEventListener('click', () => openPlaylistForm(null));
}


/* ----- 11. Boot -------------------------------------------------
   The entry point. boot() runs at the bottom of this file (search for
   `boot();` at the end). It loads data, then wires up only the parts
   that exist on the current page.
----------------------------------------------------------------- */

/**
 * Attach every event listener the modal needs. Called once per page
 * load (on both pages, since both pages have the modal markup).
 *
 * What gets wired:
 *   - the X button     -> closeModal
 *   - clicking outside -> closeModal
 *   - Escape key       -> closeModal (if open)
 *   - Shuffle button   -> onShuffleClick
 *   - Next button      -> onNextClick
 *   - Play button      -> toggle pause if same playlist, otherwise
 *                          start playing track 0
 *   - "Get description" -> onAIClick
 *   - Tab strip        -> setModalTab
 */
function wireModalCloseHandlers() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  document.getElementById('modal-close').addEventListener('click', closeModal);

  // Click on the overlay (but not on the panel itself) closes.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Escape key closes the modal if it's open.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Shuffle button inside the modal.
  document.getElementById('modal-shuffle').addEventListener('click', onShuffleClick);

  // Next-track button inside the modal.
  const nextBtn = document.getElementById('modal-next');
  if (nextBtn) nextBtn.addEventListener('click', onNextClick);

  // Play button: if this playlist is already playing, toggle pause.
  // Otherwise, start the playlist from track 0.
  document.getElementById('modal-play').addEventListener('click', () => {
    if (!OPEN_PLAYLIST) return;
    const audio = document.getElementById('audio-player');
    if (NOW_PLAYING && NOW_PLAYING.playlistId === OPEN_PLAYLIST.id) {
      if (audio.paused) audio.play();
      else audio.pause();
    } else {
      playTrack(OPEN_PLAYLIST, 0);
    }
  });

  // AI Get description button.
  document.getElementById('ai-btn').addEventListener('click', onAIClick);

  // Modal tab switching: Tracklist / About.
  document.querySelectorAll('.tab-bar .tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => setModalTab(tab.dataset.tab));
  });
}

/**
 * Switch the modal's right column between the Tracklist and About panels.
 * Updates the active tab indicator and hides/shows the matching panel.
 */
function setModalTab(name) {
  const tabs = document.querySelectorAll('.tab-bar .tab[data-tab]');
  tabs.forEach(t => t.classList.toggle('on', t.dataset.tab === name));

  const tracklist = document.getElementById('modal-tracklist');
  const about     = document.getElementById('modal-about');
  const total     = document.getElementById('modal-total');
  if (!tracklist || !about) return;

  if (name === 'about') {
    tracklist.hidden = true;
    about.hidden = false;
    if (total) total.style.visibility = 'hidden';
  } else {
    tracklist.hidden = false;
    about.hidden = true;
    if (total) total.style.visibility = '';
  }
}

/**
 * Fill the About panel with the playlist's source-of-record info from
 * archive.org: full description, album/artist credits, year, license,
 * subjects, and a link to the IA item.
 */
function renderModalAbout(playlist) {
  const about = document.getElementById('modal-about');
  if (!about) return;

  const src = playlist.source || {};
  const desc = src.description || 'No description available for this record.';

  const facts = [];
  if (src.albumTitle)  facts.push(`<dt>Album</dt><dd>${escapeHTML(src.albumTitle)}</dd>`);
  if (src.albumArtist) facts.push(`<dt>Artist</dt><dd>${escapeHTML(src.albumArtist)}</dd>`);
  if (src.year)        facts.push(`<dt>Year</dt><dd>${escapeHTML(String(src.year))}</dd>`);
  if (Array.isArray(src.subjects) && src.subjects.length) {
    facts.push(`<dt>Tags</dt><dd>${src.subjects.map(escapeHTML).join(', ')}</dd>`);
  }
  if (src.license) {
    facts.push(`<dt>License</dt><dd><a href="${escapeAttr(src.license)}" target="_blank" rel="noopener">${escapeHTML(src.license)}</a></dd>`);
  }
  if (src.url) {
    facts.push(`<dt>Source</dt><dd><a href="${escapeAttr(src.url)}" target="_blank" rel="noopener">${escapeHTML(src.provider || 'Internet Archive')} · ${escapeHTML(src.identifier || '')}</a></dd>`);
  }

  about.innerHTML = `
    <p class="about-desc">${escapeHTML(desc)}</p>
    ${facts.length ? `<dl class="about-facts">${facts.join('')}</dl>` : ''}
  `;
}

/** Minimal HTML/attr escaping so source text can't break the markup. */
function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeAttr(s) { return escapeHTML(s); }

/**
 * Entry point. boot() runs once at the bottom of this file (look for
 * the bare `boot();` call on the last line).
 *
 * What "boot" does:
 *   1. Loads data.json (await pauses here until the file arrives).
 *   2. Wires up the global stuff that exists on every page (audio
 *      events, mobile sidebar toggle).
 *   3. Reads body[data-page] (set in the HTML: <body data-page="featured">)
 *      to know which page we're on.
 *   4. Runs ONLY the rendering + wiring for that specific page. The
 *      featured page and the shelf page have completely different
 *      content, so they each get their own branch.
 *
 * Why we don't wrap this in DOMContentLoaded: the <script> tag for
 * this file lives at the END of the <body>. By the time the browser
 * reaches that <script>, every element above it has already been
 * parsed. So the DOM is ready and we can query it immediately.
 */
async function boot() {
  await loadData();

  // Audio playback is wired the same way on every page that includes the
  // <audio id="audio-player"> element, so attach event handlers up front.
  wireAudioEvents();

  // Mobile sidebar toggle is on every page.
  wireSidebarToggle();

  const page = document.body.dataset.page;

  if (page === 'featured') {
    const root = document.getElementById('featured-root');
    const playlist = pickRandomPlaylist(PLAYLISTS);
    renderFeatured(playlist, root);
    // Featured page has the same modal markup as playlists.html, so its
    // close/play/shuffle/AI handlers need wiring too.
    wireModalCloseHandlers();
    // Search submit jumps to the shelf with the query pre-applied.
    wireFeaturedSearch();
  } else if (page === 'playlists') {
    const root = document.getElementById('playlist-cards-root');

    // Read sort/mood/q filter from the URL (e.g. ?sort=likes or ?q=jazz).
    // applyFilters returns a new array, so PLAYLISTS itself is untouched.
    const params = new URLSearchParams(window.location.search);
    const filtered = applyFilters(PLAYLISTS, params);
    renderAllPlaylists(filtered, root);

    // Highlight the chip and sidebar item that matches the current params.
    syncFilterChrome(params);

    wireModalCloseHandlers();
    // Live search: typing in the topbar input re-renders the grid.
    wirePlaylistsSearch(root);
    // Stretch features: add / edit / delete playlists.
    wirePlaylistForm();
  }
}

/**
 * Wire up the mobile hamburger menu.
 *
 * On screens <= 720px wide the sidebar is hidden off-canvas. Clicking
 * the hamburger button toggles a "sidebar-open" class on <body>, which
 * the CSS uses to slide the sidebar in and dim the rest of the page.
 *
 * The sidebar closes when:
 *   - Hamburger is clicked again (toggles).
 *   - User taps anywhere outside the sidebar (backdrop dismiss).
 *   - User clicks a nav link (it's about to navigate anyway).
 *   - Escape key (but only if no modal is on top — the modal has its
 *     own Escape handler and we don't want both firing).
 *   - Window resizes wider than 720px (so the sidebar isn't stuck in
 *     "open" state when the layout transitions back to desktop).
 */
function wireSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle');
  if (!btn) return;

  const close  = () => document.body.classList.remove('sidebar-open');
  const toggle = () => document.body.classList.toggle('sidebar-open');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  // Backdrop click anywhere that's not the sidebar, the toggle, or
  // the modal overlay (which sits above the sidebar at z-index 100 —
  // clicks inside it shouldn't dismiss the sidebar underneath).
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('sidebar-open')) return;
    if (e.target.closest('.sidebar')) return;
    if (e.target.closest('#sidebar-toggle')) return;
    if (e.target.closest('.modal-overlay')) return;
    close();
  });

  // Sidebar links auto-close (they're navigation; the page reload would
  // close it anyway, but doing it eagerly avoids a flash).
  document.querySelectorAll('.sidebar a').forEach(a => {
    a.addEventListener('click', close);
  });

  // Escape closes the sidebar, but only when no modal is on top.
  // wireModalCloseHandlers has its own Escape listener for the modal,
  // so we don't want both firing on the same keypress.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const overlay = document.getElementById('modal-overlay');
    if (overlay && overlay.classList.contains('is-open')) return;
    close();
  });

  // Resize past the desktop breakpoint: drop the open state so the
  // sidebar isn't stuck mid-transition when going from mobile to wide.
  // Track the previous "narrow" state so we only act on transitions
  // out of the mobile layout, not on every resize tick.
  let wasNarrow = window.innerWidth <= 720;
  window.addEventListener('resize', () => {
    const isNarrow = window.innerWidth <= 720;
    if (wasNarrow && !isNarrow) close();
    wasNarrow = isNarrow;
  });
}

/**
 * Search bar on the FEATURED page.
 *
 * The featured page doesn't have a grid to filter, so its search bar
 * just navigates to the shelf page with ?q=<query>. The shelf page's
 * own search wiring (below) reads ?q= and applies it to the grid.
 */
function wireFeaturedSearch() {
  const input = document.querySelector('.topbar .search input');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = input.value.trim();
    window.location.href = q ? `playlists.html?q=${encodeURIComponent(q)}` : 'playlists.html';
  });
}

/**
 * Search bar on the SHELF page.
 *
 * Filters the grid live as the user types. The query is matched
 * (case-insensitively) against:
 *   - playlist name
 *   - playlist author
 *   - playlist mood tag
 *   - any song's title or artist
 *
 * It also works alongside the URL params (?sort=likes etc.) — first
 * applyFilters narrows by sort/mood, THEN the search filters within
 * that result. An empty search falls back to the URL filters only.
 */
function wirePlaylistsSearch(root) {
  const input = document.querySelector('.topbar .search input');
  if (!input) return;
  // Pre-fill the input from ?q= so the URL and the input stay in sync.
  const params = new URLSearchParams(window.location.search);
  const initialQ = params.get('q') || '';
  if (initialQ) input.value = initialQ;

  const rerender = () => {
    const q = input.value.trim().toLowerCase();
    const baseParams = new URLSearchParams(window.location.search);
    let list = applyFilters(PLAYLISTS, baseParams);
    if (q) {
      list = list.filter(p => {
        if (p.name.toLowerCase().includes(q)) return true;
        if ((p.author || '').toLowerCase().includes(q)) return true;
        if ((p.mood || '').toLowerCase().includes(q)) return true;
        return (p.songs || []).some(s =>
          (s.title || '').toLowerCase().includes(q) ||
          (s.artist || '').toLowerCase().includes(q)
        );
      });
    }
    renderAllPlaylists(list, root);
  };

  input.addEventListener('input', rerender);
  if (initialQ) rerender();
}

/**
 * Apply sort/mood filters to a playlist array based on URL params.
 *
 * URL params we read:
 *   ?sort=recent  -> newest first (highest addedAt date wins)
 *   ?sort=likes   -> most-liked first (highest likes count wins)
 *   ?sort=mood    -> group by mood, then alphabetize within each mood
 *   ?mood=<name>  -> only show playlists with that mood
 *
 * Returns a NEW array — the input is never mutated. That matters
 * because the caller (the search code) may apply filters, then re-apply
 * them with different URL params later. If we mutated the original
 * array we'd lose data that was filtered out.
 *
 * Sort comparator refresher:
 *   sort((a, b) => RESULT)
 *     RESULT < 0  -> a comes before b
 *     RESULT > 0  -> a comes after b
 *     RESULT === 0 -> keep relative order
 *   So `b.likes - a.likes` sorts DESCENDING by likes (high first)
 *   because if b is bigger, the result is positive, putting a after b.
 *
 * localeCompare is just a string version of the same idea — returns a
 * negative/zero/positive number depending on alphabetical order.
 */
function applyFilters(playlists, params) {
  let out = playlists.slice(); // shallow copy so we don't mutate input

  // Mood filter (e.g. "?mood=focus"). URL params are strings so we
  // lowercase both sides for a case-insensitive match.
  const mood = params.get('mood');
  if (mood) {
    const target = mood.toLowerCase();
    out = out.filter(p => (p.mood || '').toLowerCase() === target);
  }

  // Sort. addedAt is YYYY-MM-DD so localeCompare on the strings
  // doubles as a date sort (lexical order = chronological order).
  const sort = params.get('sort');
  if (sort === 'recent') {
    out.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
  } else if (sort === 'likes') {
    out.sort((a, b) => b.likes - a.likes);
  } else if (sort === 'mood') {
    // Two-level sort: mood first, then name for tie-breaks.
    out.sort((a, b) => {
      const m = (a.mood || '').localeCompare(b.mood || '');
      return m !== 0 ? m : a.name.localeCompare(b.name);
    });
  }

  return out;
}

/**
 * Toggle the .on class on the chip and sidebar link that matches the
 * current URL params. With no params, the "All" chip lights up.
 */
function syncFilterChrome(params) {
  const chips = document.querySelectorAll('#filter-chips .chip');
  if (!chips.length) return;

  // Reset.
  chips.forEach(c => c.classList.remove('on'));

  const mood = params.get('mood');
  const sort = params.get('sort');

  // Find which chip matches and turn it on. With no params we light the
  // "All" chip (data-filter="all").
  let matched = null;
  if (mood) {
    matched = document.querySelector(`#filter-chips .chip[data-mood="${mood.toLowerCase()}"]`);
  } else if (sort) {
    matched = document.querySelector(`#filter-chips .chip[data-sort="${sort}"]`);
  } else {
    matched = document.querySelector('#filter-chips .chip[data-filter="all"]');
  }
  if (matched) matched.classList.add('on');

  // Update the page count to reflect the filtered total.
  const countEl = document.getElementById('playlist-count');
  if (countEl) {
    const cards = document.querySelectorAll('#playlist-cards-root .card').length;
    const noun = cards === 1 ? 'record' : 'records';
    countEl.textContent = `${cards} ${noun}`;
  }

  // Highlight the matching sidebar shelf link (recently added / most
  // liked / by mood). When a sort is active, the matching link gets the
  // .active class same as the top-level "the shelf" link.
  const shelves = document.querySelectorAll('#sidebar-shelves a');
  shelves.forEach(s => s.classList.remove('active'));
  if (sort) {
    const shelfMatch = document.querySelector(`#sidebar-shelves a[data-sort="${sort}"]`);
    if (shelfMatch) shelfMatch.classList.add('active');
  }
}

// Kick everything off. boot() is async, so it returns a promise we
// don't await — fire-and-forget is fine here because the only thing
// after this is the end of the file.
boot();

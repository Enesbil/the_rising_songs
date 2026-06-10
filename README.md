# the rising songs

**Deployment:** https://the-rising-songs.onrender.com/index.html

## Unit Assignment: Music Playlist Explorer

Submitted by: **Muhammed Enes Bilek**

Estimated time spent: **10** hours spent in total

### Application Features

#### CORE FEATURES

- [x] **Display Playlists**
  - [x] Dynamically render playlists on the homepage using JavaScript.
    - [x] Playlists should be shown in grid view.
    - [x] Playlist images should be reasonably sized (at least 6 playlists on your laptop when full screen; large enough that the playlist components detailed in the next feature are legible).
  - [x] Fetch data from a provided JavaScript file and use it to create interactive playlist tiles.

- [x] **Playlist Components**
  - [x] Each tile should display the playlist's:
    - [x] Cover image
    - [x] Name
    - [x] Author
    - [x] Like count

- [x] **Playlist Details**
  - [x] Create a modal pop-up view that displays detailed information about a playlist when a user clicks on a playlist tile.
  - [x] The modal should show the playlist's:
    - [x] Cover image
    - [x] Name
    - [x] Author
    - [x] List of songs, including each song's:
      - [x] Title
      - [x] Artist
      - [x] Duration
  - [x] The modal itself should:
    - [x] Not occupy the entire screen.
    - [x] Have a shadow to show that it is a pop-up.
    - [x] Appear floating on the screen.
    - [x] The backdrop should appear darker or in a different shade.

- [x] **Like Playlists**
  - [x] Implement functionality to allow users to like playlists by clicking a heart icon on each playlist tile.
  - [x] When the heart icon is clicked:
    - [x] If previously unliked:
      - [x] The like count on the playlist tile should increase by 1.
      - [x] There should be visual feedback (such as the heart turning a different color) to show that the playlist has been liked by the user.
    - [x] If previously liked:
      - [x] The like count on the playlist tile should decrease by 1.
      - [x] There should be visual feedback (such as the heart turning a different color) to show that the playlist has been unliked by the user.
    - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** In addition to showcasing the above features, for ease of grading, please film yourself liking and unliking:
      - [x] a playlist with a like count of 0
      - [x] a playlist with a non-zero like count

- [x] **Shuffle Songs**
  - [x] Enable users to shuffle the songs within a playlist using a shuffle button in the playlist's detail modal.
  - [x] When the shuffle button is clicked, the playlist's songs should display in a different order.
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** In addition to showcasing the above features, for ease of grading, please show yourself shuffling the same playlist more than once.

- [x] **Featured Page**
  - [x] Application includes a dedicated page that randomly selects and displays a playlist, showing the playlist's:
    - [x] Playlist Image
    - [x] Playlist Name
    - [x] List of songs, including each song's:
      - [x] Title
      - [x] Artist
      - [x] Duration
  - [x] When the page is refreshed or reloaded, a new random playlist is displayed
    - For example, navigating to the all playlists page and then back to the featured playlist page should result in a new random playlist being displayed
    - Note that because your algorithm will not be truly random, it is possible that the same playlist will feature twice in a row.
    - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** In addition to showcasing the above features, for ease of grading, please show yourself refreshing the featured page more than once.
  - [x] Application includes a navigation bar or some other mechanism such that users can navigate to the page with all playlists from the featured page and vice versa without using the browser's back and forward buttons.

- [x] **Planning Documentation**
  - [x] Repository includes a `planning.md` file with:
    - [x] A **Data Shape** section (fields and types for playlist and song objects)
    - [x] A **UI and Interaction Rules** section (at least three rules describing what happens in the UI for a user action)
    - [x] At least one **Function Spec** (name, purpose, inputs, outputs, side effects)
    - [x] A **Featured Page** section describing the random playlist display behavior
    - [x] A **Decisions Log** with entries from at least two different milestones

- [x] **AI-Powered Playlist Description**
  - [x] The playlist detail modal includes a "Get Description" button.
  - [x] Clicking the button calls an AI API and displays a generated description within the modal.
  - [x] `planning.md` includes an **AI Feature Spec** documenting role, task, inputs, output format, constraints, and failure behavior.
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** For ease of grading, open your browser's DevTools Network tab, click the "Get Description" button, and show the outbound request going directly to an AI API URL (e.g., `openrouter.ai`).

#### STRETCH FEATURES

- [x] **Add New Playlists**
  - [x] Allow users to create new playlists.
  - [x] Using a form, users can input playlist:
    - [x] Name
    - [x] Author
    - [x] Cover image
    - [x] Add one or more songs to the playlist, specifying the song's:
      - [x] Title
      - [x] Artist
  - [x] The resulting playlist should display in the grid view.
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** For ease of grading, please show yourself adding at least two songs to the playlist.

- [x] **Edit Existing Playlists**
  - [x] Enable users to modify the details of existing playlists.
  - [x] Add an edit button to each playlist tile.
  - [x] Users can update the playlist:
    - [x] Name
    - [x] Author
    - [x] Songs
  - [x] The playlist grid view and playlist detail modal should update to display any changes (see Required Features, Criterion 1 & 2).
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS:** For ease of grading, please show yourself:
    - [x] Editing all of a playlist's features (name, creator, AND songs)
    - [x] Editing some of a playlist's features (name, creator, OR songs)

- [x] **Delete Playlists**
  - [x] Add a delete button to each playlist tile within the grid view.
  - [x] When clicked, the playlist is removed from the playlist grid view.

- [x] **Search Functionality**
  - [x] Implement a search bar that allows users to filter playlists by:
    - [x] Name
    - [x] Author
  - [x] The search bar should include:
    - [x] Text input field
    - [x] Submit/Search Button
    - [x] Clear Button
  - [x] Playlists matching the search query in the text input are displayed in a grid view when the user:
    - [x] Presses the Enter Key
    - [x] Clicks the Submit/Search Button
  - [x] User can click the clear button. When clicked:
    - [x] All text in the text input field is deleted
    - [x] All playlists in the `data.json` file are displayed in a grid view
    - [x] **Optional:** If the Add Playlist, Edit Existing Playlist, or Delete Playlist stretch features were implemented:
      - [x] If users can add a playlist, added playlists should be included in search results.
      - [x] If users can edit a playlist, search results should reflect the latest edits to each playlist.
      - [x] If users can delete a playlist, deleted playlists should no longer be included in search results.

- [x] **Sorting Options**
  - [x] Implement a drop-down or button options that allow users to sort the playlist by:
    - [x] Name (A-Z alphabetically)
    - [x] Number of likes (descending order)
    - [x] Date added (most recent to oldest, chronologically)
  - [x] Selecting a sort option should result in a reordering based on the selected sort while maintaining a grid view.

### Walkthrough Video

**Walkthrough video:** [Music Playlist Explorer Walkthrough](https://www.loom.com/share/55a58deaa9c24df8bebcb4d6c3a1d149)

### Reflection

* Did the topics discussed in your labs prepare you to complete the assignment? Be specific, which features in your weekly assignment did you feel unprepared to complete?

The labs covered the basics of dynamic rendering, modals, and the AI API integration pattern, so the core features felt familiar by the time I started. The piece I felt least prepared for was the audio playback layer (which is technically beyond the core requirements). Sharing one `<audio>` element across two pages and keeping the "now playing" UI in sync with pause and end events took more iteration than I expected. The AI feature itself was straightforward thanks to Lab 3, but I underestimated how much prompt-tuning was needed to stop a free model from inventing facts about an album.

* If you had more time, what would you have done differently? Would you have added additional features? Changed the way your project responded to a particular event, etc.

I would persist the like state and any user-added playlists to localStorage so they survive a refresh, and add a small "now playing" bar that survives navigation between the two pages. I would also tighten the responsive layout further on very narrow phones, the modal still feels a bit dense at 320px wide. Beyond that, I would add a real "more from the shelf" carousel on the featured page (I cut it from scope to keep the JS simple) and a tiny waveform or progress bar on the audio player.

* Reflect on your project demo, what went well? Were there things that maybe didn't go as planned? Did you notice something that your peer did that you would like to try next time?

Going in with a planning.md file written before the code paid off, every milestone had a clear shape before I started typing. What didn't go to plan was how often free OpenRouter models would 429 mid-demo, which is why I ended up writing a fallback chain. Watching peers, I noticed how clean it was when someone built smaller helper functions and named them obviously instead of one big render function, I want to lean into that pattern more next project.

### Open-source libraries used

- No external runtime libraries. Vanilla HTML, CSS, and JavaScript only.
- Geist Sans and Geist Mono fonts (loaded via Google Fonts) for typography.
- Internet Archive (archive.org) as the streaming source for the CC-licensed audio files referenced in `data/data.json`.
- OpenRouter (openrouter.ai) as the routing layer in front of the free LLM models used by the AI description feature.

### Shout out

Big thanks to my CodePath cohort for the daily check-ins and to my pod TA for unblocking me on the modal scrim click handler when it was eating clicks meant for the modal body. Also a shout out to whoever wrote the Lab 3 walkthrough, the structure of that lab made the AI integration in this project feel approachable.

## Run it locally

You need to serve the files over HTTP (not open them with `file://`) because `script.js` uses `fetch` to load `data/data.json`.

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

See `planning.md` for the full design spec, function specs, and the per-milestone decisions log.

#!/usr/bin/env python3
"""
Build data/data.json from a curated list of CC-licensed Internet Archive albums.

This is a one-shot dev-time script. It is NOT used by the running app.
The app loads data/data.json directly. Re-run this to refresh the data.

  python3 scripts/build_data.py > data/data.json
"""

import json
import re
import sys
import urllib.request

# 8 playlists. Each maps a "the rising songs" identity to an Internet Archive
# item we've manually picked. All items are CC-licensed (verified by inspecting
# `licenseurl` in the metadata response).
#
# Each playlist also has:
#   - mood: one of our 8 mood categories (used by the chip filter)
#   - addedAt: ISO date used for the "recently added" sort
PICKS = [
    {
        "id": "midnight-in-shoreditch",
        "name": "midnight in shoreditch",
        "author": "the late hours",
        "coverKey": "midnight",
        "likes": 24,
        "mood": "night drive",
        "addedAt": "2026-06-01",
        "ia_id": "DWK149",
    },
    {
        "id": "blue-hour-radio",
        "name": "blue hour radio",
        "author": "miles & co.",
        "coverKey": "bluehour",
        "likes": 12,
        "mood": "slow morning",
        "addedAt": "2026-05-21",
        "ia_id": "pcr089EmilDavydov-Sketches",
    },
    {
        "id": "backseat-symphony",
        "name": "backseat symphony",
        "author": "anya v.",
        "coverKey": "backseat",
        "likes": 47,
        "mood": "workout",
        "addedAt": "2026-04-17",
        "ia_id": "Lethargie.LP",
    },
    {
        "id": "glass-cathedral",
        "name": "glass cathedral",
        "author": "coen drake",
        "coverKey": "cathedral",
        "likes": 8,
        "mood": "focus",
        "addedAt": "2026-05-09",
        "ia_id": "NS051",
    },
    {
        "id": "warm-static",
        "name": "warm static",
        "author": "vesper",
        "coverKey": "warm",
        "likes": 33,
        "mood": "commute",
        "addedAt": "2026-05-30",
        "ia_id": "DWK155",
    },
    {
        "id": "soft-engine",
        "name": "soft engine",
        "author": "the late hours",
        "coverKey": "engine",
        "likes": 16,
        "mood": "focus",
        "addedAt": "2026-06-04",
        "ia_id": "NS050",
    },
    {
        "id": "held-breath",
        "name": "held breath",
        "author": "anya v.",
        "coverKey": "held",
        "likes": 21,
        "mood": "slow morning",
        "addedAt": "2026-04-29",
        "ia_id": "foot018",
    },
    {
        "id": "bridge-in-fog",
        "name": "bridge in fog",
        "author": "maya / vesper",
        "coverKey": "bridge",
        "likes": 5,
        "mood": "night drive",
        "addedAt": "2026-03-12",
        "ia_id": "PoodleplayArkestra-TheoryOfColour",
    },
]

AUDIO_FORMATS = {"VBR MP3", "MP3", "128Kbps MP3", "64Kbps MP3"}
MAX_TRACKS = 12


def fetch_metadata(identifier: str) -> dict:
    url = f"https://archive.org/metadata/{identifier}"
    with urllib.request.urlopen(url, timeout=20) as r:
        return json.load(r)


def clean_title(s: str) -> str:
    """Strip leading track numbers and file extensions."""
    s = re.sub(r"^\s*\d{1,3}/\d{1,3}\.?\s*", "", s)  # "1/13. Foo" -> "Foo"
    s = re.sub(r"^\s*\d{1,3}[\.\-_)\s]+", "", s)      # "01. Foo" -> "Foo"
    s = re.sub(r"\.(mp3|ogg|wav|m4a|flac)$", "", s, flags=re.I)
    return s.strip() or "Untitled"


def fmt_duration(sec) -> str:
    if sec is None:
        return "0:00"
    try:
        sec = float(sec)
    except (TypeError, ValueError):
        return "0:00"
    total = round(sec)
    return f"{total // 60}:{total % 60:02d}"


def parse_duration_string(val) -> float:
    """IA stores 'length' as either seconds (e.g. '245.78') or 'M:SS' (e.g. '03:30')."""
    if val is None:
        return 0.0
    s = str(val)
    if ":" in s:
        parts = s.split(":")
        try:
            return float(parts[0]) * 60 + float(parts[1])
        except ValueError:
            return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def strip_html(s: str) -> str:
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def shape_playlist(pick: dict) -> dict:
    """Pull metadata for one IA item and shape it into our playlist record."""
    meta_resp = fetch_metadata(pick["ia_id"])
    meta = meta_resp.get("metadata", {})
    files = meta_resp.get("files", [])

    # Keep only mp3 audio files (skip ogg duplicates).
    audio = [f for f in files if f.get("format") in AUDIO_FORMATS]

    # Sort by track number where possible.
    def track_sort_key(f):
        t = f.get("track", "")
        # IA sometimes returns "1/13" or "01"
        m = re.match(r"\s*(\d+)", str(t))
        if m:
            return (0, int(m.group(1)))
        return (1, f.get("name", ""))

    audio.sort(key=track_sort_key)

    # Dedup: same album sometimes lists the same track in multiple bitrates.
    # Keep the first occurrence per (track number, title).
    seen = set()
    unique = []
    for f in audio:
        m = re.match(r"\s*(\d+)", str(f.get("track", "")))
        track_num = m.group(1) if m else ""
        title = clean_title(f.get("title") or f.get("name") or "")
        key = (track_num, title.lower())
        if key in seen:
            continue
        seen.add(key)
        unique.append(f)
    audio = unique[:MAX_TRACKS]

    songs = []
    total_seconds = 0.0
    for f in audio:
        title = clean_title(f.get("title") or f.get("name") or "Untitled")
        artist = f.get("creator") or meta.get("creator") or "Unknown"
        secs = parse_duration_string(f.get("length"))
        total_seconds += secs
        songs.append({
            "title": title,
            "artist": artist,
            "duration": fmt_duration(secs),
            # Filename on archive.org. Combined with the album identifier
            # this gives us a streamable mp3 url:
            # https://archive.org/download/<identifier>/<filename>
            "file": f.get("name"),
        })

    # IA metadata-derived context. These extra fields will help the AI
    # write better summaries and aren't shown in the basic UI.
    subjects = meta.get("subject")
    if isinstance(subjects, str):
        subjects = [s.strip() for s in subjects.split(";")]
    elif not isinstance(subjects, list):
        subjects = []

    return {
        "id": pick["id"],
        "name": pick["name"],
        "author": pick["author"],
        "coverKey": pick["coverKey"],
        "likes": pick["likes"],
        "liked": False,
        "mood": pick["mood"],
        "addedAt": pick["addedAt"],
        "songs": songs,
        "source": {
            "provider": "Internet Archive",
            "identifier": pick["ia_id"],
            "url": f"https://archive.org/details/{pick['ia_id']}",
            "albumTitle": meta.get("title"),
            "albumArtist": meta.get("creator"),
            "year": (meta.get("date") or meta.get("year") or "").split("-")[0] or None,
            "license": meta.get("licenseurl"),
            "subjects": subjects,
            "description": strip_html(meta.get("description") or "")[:600] or None,
            "trackCount": len(songs),
            "totalSeconds": round(total_seconds),
        },
    }


def main():
    out = []
    for pick in PICKS:
        print(f"fetching {pick['ia_id']}...", file=sys.stderr)
        try:
            out.append(shape_playlist(pick))
        except Exception as e:
            print(f"  failed: {e}", file=sys.stderr)
            sys.exit(1)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()

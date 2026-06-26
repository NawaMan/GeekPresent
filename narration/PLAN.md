# Narration Pipeline — Implementation Plan

Turn a GeekPresent deck's `<Note>`s into narrated voice clips, then drive the deck
on that audio timeline for an OBS screen-capture. **Voice first**; capture later.

This plan is written to be implemented **inside the GeekPresent booth** (`.booth/`,
`base` variant, headless, Node 22, vite `5173` exposed to host `31173`).

---

## 1. Goals & non-goals

**Goals**
- `<Note>` content is the single source of truth for narration — no separate script file.
- Per-beat voice clips, human-locatable filenames, hash-based incremental regeneration.
- Reproducible toolchain (Python venv + ElevenLabs + Playwright) provisioned by the booth.
- Deterministic A/V sync at capture by playing each clip and advancing on its `ended` event.

**Non-goals (for the voice half)**
- No video muxing. OBS records screen + system audio on the host; sync is by construction.
- No editing of the existing decks' content beyond authoring `<Note>`s.

---

## 2. Architecture — the booth / host split

The pipeline splits along the line the booth forces:

| Phase | Where | Why |
|---|---|---|
| `extract` — read `<Note>`s → manifest | **booth** (headless Playwright) | reproducible, no display needed |
| `voice` — manifest → clips | **booth** (Python venv + ElevenLabs) | credentials + Python pinned in the image |
| `capture` — drive deck, OBS records | **host** (browser + OBS) | a headless container can't be screen-recorded |

The booth **serves** the deck on `localhost:31173`; the host **displays + records** it.
Output (`voice_clips/`, `manifest.json`) is written into the mounted repo, so booth
UID/GID mapping makes it **host-owned**.

---

## 3. The `<Note>` authoring convention

`<Note>` IS the verbatim narration for a video deck. Authored inline per slide.

```svelte
<ContentPage title="Works on My Machine" subtitle="The hidden cost">
  <!-- visible slide stays CONCISE -->
  <ul><li>Environmental drift</li><li>Lost onboarding days</li><li>Flaky tests</li></ul>
</ContentPage>

<Note>
  <p>This friction occurs when software runs perfectly for the developer who wrote it, but fails inconsistently on another machine.</p>
  <p>It's driven by environmental drift — failed experiments never reversed, cross-project pollution, quick fixes nobody documented.</p>
  <p data-pause="800">All of it slowly destroys trust in the development process.</p>
</Note>
```

Rules:
- Each block-level child (`<p>`) of `.note` = **one voice clip**, spoken in document order.
- Write **prose**, not bullet fragments (ElevenLabs prosody is good on sentences, choppy on fragments).
- The visible slide is concise; the `<Note>` is the full spoken script. They differ on purpose.
- `data-pause="ms"` = silence **before** this beat (default from config, ~400ms).
- No `<Note>` on a slide → one **silent beat**, held for `silent_dwell_ms`.

`<Note>` already renders only in `SCALED` mode and is hidden in `FITTED`/print — so it's
visible to the author and absent from the captured (FITTED) view. No component change needed
for extraction; it just needs `displayMode='SCALED'` set before load.

---

## 4. Filenames, hashing, manifest

### Filename (slide-name form)

```
0007-what-is-geekpresent-b2-this-friction-occurs-when-a1b2c3d4.mp3
└──┘ └────────────────┘ └┘ └───────────────────────┘ └──────┘
 │           │           │            │                  └ content hash (8 hex)
 │           │           │            └ slug: first ~5 words / 40 chars of the beat
 │           │           └ beat # within the slide
 │           └ slide path (pages.ts entry, ".html" stripped)
 └ global playback index (4-digit, zero-padded)
```

Field order = human-first (scan order, slide, words) → machine-last (hash).

### Hash

```
hash = sha256(spokenText + "\n" + voiceFingerprint).hex()[:8]
spokenText      = lexicon-applied, whitespace-normalized beat text (the exact string sent to TTS)
voiceFingerprint = sha256(JSON of { voice_id, model_id, output_format, voice_settings }).hex()
```

The hash covers **everything that changes the audio** — beat text *and* voice config — so a
voice/model change correctly invalidates every clip.

### Manifest — `narration/<deck>/manifest.json`

`extract` owns all naming + hashing and writes the final `file` + `hash` into the manifest.
`voice` only consumes them (so hash logic lives in exactly one place):

```json
{
  "deck": "slides",
  "voiceFingerprint": "9a8b...",
  "beats": [
    {
      "index": 7,
      "slide": "what-is-geekpresent.html",
      "beat": 2,
      "text": "This friction occurs when…",
      "spokenText": "This friction occurs when…",
      "pauseMs": 800,
      "silent": false,
      "hash": "a1b2c3d4",
      "file": "voice_clips/0007-what-is-geekpresent-b2-this-friction-occurs-when-a1b2c3d4.mp3",
      "ms": null
    }
  ]
}
```

`ms` (clip duration) is filled by `voice` via `ffprobe` after generation; the capture phase reads it.

---

## 5. Directory layout

```
narration/
  PLAN.md                       ← this file
  bin/
    extract.ts                  ← Node/Playwright extractor (owns naming + hashing)
    voice.py                    ← Python ElevenLabs reconcile + generate
    voice.sh                    ← venv wrapper invoked by the pnpm script
  <deck>/                       ← e.g. narration/slides/
    narration.config.json       ← voice id, model, pauses, slug rules
    narration.lexicon.json      ← pronunciation overrides
    manifest.json               ← produced by extract, enriched by voice
    voice_clips/
      0001-…-<hash>.mp3
      _unused/                  ← retired clips parked here (never hard-deleted)
```

---

## 6. Phase 1 — Booth provisioning

Make Python + Playwright-chromium part of the booth image, and mount the token.

**`.booth/Boothfile`** — add capabilities (confirm exact directive names against
`CODINGBOOTH.md` / `booth config`):
- Python 3 + venv support (`setup python …` or `install python3 python3-venv`).
- Playwright chromium with system deps, cached into the image
  (`run pnpm dlx playwright install --with-deps chromium`).

**`.booth/startups/70-narration-deps--startup.sh`** (new):
```bash
#!/bin/bash
set -e
VENV="$HOME/.venvs/narration"
[ -d "$VENV" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip elevenlabs python-dotenv
# Ensure the headless browser is present (no-op if image already cached it)
pnpm exec playwright install chromium >/dev/null 2>&1 || true
```

**Token** — never committed:
- Keep `ELEVEN_LAB_TOKEN` in a gitignored `~/.elevenlabs.env` on the host.
- Mount it via `.booth/config.toml` `run-args`, e.g.
  `"-v", "~/.elevenlabs.env:/etc/cb-home/.elevenlabs.env:ro"`,
  and have `voice.sh` load it (`set -a; . /etc/cb-home/.elevenlabs.env; set +a`).
- Add `narration/**/voice_clips/` policy to `.gitignore` as desired (clips can be large;
  decide commit-or-not per deck — see §11).

---

## 7. Phase 2 — `extract` (Node + Playwright, in booth)

`pnpm narrate:extract <deck>` → writes `narration/<deck>/manifest.json`.

Algorithm:
1. Read `narration/<deck>/narration.config.json` and `narration.lexicon.json`.
2. Load ordered slide paths from `src/routes/<deck>/pages.ts` (pure data — import via `tsx`/`jiti`).
3. Start (or reuse) `vite preview` on `5173`.
4. Launch headless chromium. `addInitScript` to set `localStorage.displayMode='SCALED'`
   so `.note` renders.
5. For each slide, in order:
   - `goto(/<deck>/<path>)`, wait for network idle + `document.fonts.ready`.
   - Query `.note > p`. For each: read `innerText` and `data-pause`.
   - No `.note` / no `<p>` → emit one `silent: true` beat (no text, no clip).
6. For each beat compute, in this order, a global `index` (1-based across the deck):
   - `spokenText` = applyLexicon(normalizeWhitespace(text))
   - `hash` = sha256(spokenText + "\n" + voiceFingerprint)[:8]
   - `slug` = first `slug_words` words of `text`, kebab-cased, capped at `slug_max_chars`
   - `file` = `voice_clips/{index:04}-{slide−.html}-b{beat}-{slug}-{hash}.mp3`
7. Write `manifest.json` (`ms` left `null`; silent beats get `file: null`).

Normalization detail: hash over `spokenText` (what TTS receives) so cosmetic whitespace
edits don't re-bill; slug from the original `text` for readability.

---

## 8. Phase 3 — `voice` (Python venv + ElevenLabs, in booth)

`pnpm narrate:voice <deck>` → reconciles `voice_clips/` against the manifest, generates
only what changed, **shows a plan first**.

Reconcile (hash-keyed, never recomputes hashes — reads them from the manifest):
1. Index existing clips by the `hash` parsed from their filename, scanning both
   `voice_clips/` and `voice_clips/_unused/`.
2. For each non-silent beat with target `file` and `hash`:
   - hash present on disk, filename already == target → **reuse**
   - hash present, filename differs (order/slug shifted) → **rename** (incl. restoring from `_unused/`)
   - hash absent → **NEW** (ElevenLabs call)
3. Any on-disk clip whose hash is not referenced by the manifest → **unused** → move to `_unused/`.
4. Print the plan and (unless `--yes`) confirm before spending credits:
   ```
   reuse    42   unchanged
   rename    6   same audio, shifted order
   NEW       3   → ElevenLabs (~$0.04)
   unused    1   → _unused/
   Generate 3 new clips? [y/N]
   ```
5. Execute:
   - **Renames are two-phase** (everything → `*.tmp`, then `*.tmp` → final) so shifting
     global indices never clobber each other.
   - Generate NEW clips with the ElevenLabs SDK using `narration.config.json` voice settings.
   - Move unused clips to `_unused/`.
   - `ffprobe` each new/renamed clip; write `ms` back into `manifest.json`.
- `--plan` prints the table and exits without generating.

Optimization: because retired clips live in `_unused/` (not deleted), re-adding a beat with
unchanged text restores from `_unused/` with **no API call**.

---

## 9. Phase 4 — `capture` (host + OBS) — specified, deferred

Recommended: an **autoplay route** built into the deck, so capture needs no host-side Playwright.
- `/<deck>?autoplay` mounts a player that fetches `manifest.json` + clips (served as static
  assets — copy/symlink `voice_clips/` under `static/` or add a vite-served route).
- Browsers block autoplay audio without a gesture → render a **Start** button.
- On Start: for each beat play its clip; on `ended` wait `pauseMs`; then advance to the next
  beat or, at slide end, the next slide via the existing `navigate()` (works for view-transition
  decks too). Stop after the last slide.
- Capture op: OBS rolling → open `localhost:31173/<deck>?autoplay` full-screen → click Start.
  A/V is synced because the same loop plays audio and advances slides.

Open decision for this phase (defer): autoplay-route vs. host-side headed Playwright.
Either works; the autoplay route avoids a second toolchain on the host.

---

## 10. Config files

**`narration/<deck>/narration.config.json`**
```json
{
  "voice_id": "REPLACE_ME",
  "model_id": "eleven_multilingual_v2",
  "output_format": "mp3_44100_128",
  "voice_settings": { "stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "speed": 1.0 },
  "default_pause_ms": 400,
  "silent_dwell_ms": 2500,
  "slug_words": 5,
  "slug_max_chars": 40
}
```

**`narration/<deck>/narration.lexicon.json`**
```json
{ "CodingBooth": "Coding Booth", "GeekPresent": "Geek Present", "CLI": "C L I" }
```

---

## 11. `package.json` scripts

```json
"narrate":         "pnpm narrate:extract \"$DECK\" && pnpm narrate:voice \"$DECK\"",
"narrate:extract": "tsx narration/bin/extract.ts",
"narrate:voice":   "narration/bin/voice.sh"
```
Pass the deck as the first arg: `pnpm narrate:extract slides`. `voice.sh` activates the venv,
sources the token, and runs `voice.py`.

Add dev deps as needed: `tsx` (or `jiti`), `playwright`, `@playwright/test` (optional).

---

## 12. Edge cases (handled by design)

- **Edit a beat's wording** → hash + slug change → that one clip re-bills + renames; rest untouched.
- **Insert / reorder beats** → global indices shift → rename-only, zero API cost.
- **Delete a beat** → clip moved to `_unused/` (recoverable), never destroyed.
- **Change voice/model** → `voiceFingerprint` changes → every hash changes → full regen (correct).
- **Cosmetic whitespace/markup edits** → normalized away before hashing → no re-bill.
- **Silent slide** (no `<Note>`) → tracked beat with `file: null`, capture holds `silent_dwell_ms`.
- **Re-added beat** → restored from `_unused/` with no API call.

---

## 13. Implementation order (checklist)

1. [ ] Booth: Boothfile python + playwright, `70-narration-deps` startup, token mount.
2. [ ] `narration/slides/narration.config.json` + `narration.lexicon.json` (pick a voice).
3. [ ] `bin/extract.ts`: pages.ts import → Playwright `.note > p` read → manifest (naming + hashing).
4. [ ] `bin/voice.py` + `voice.sh`: reconcile (plan/confirm), generate, two-phase rename, ffprobe.
5. [ ] Author real `<Note>`s on the `slides/` deck (prose, one `<p>` per beat).
6. [ ] Run `pnpm narrate slides`; verify clips, filenames, manifest, incremental re-runs.
7. [ ] (Later) Phase 4 capture: autoplay route + OBS.

---

## 14. Open decisions

- **Commit clips to git?** Large binaries; lean toward gitignoring `voice_clips/` and
  regenerating in-booth (the hash cache makes regen cheap for unchanged beats), or commit
  per deck if you want reproducible captures without re-billing.
- **Capture driver** (Phase 4): autoplay route (recommended) vs. host Playwright.
- **Exact Boothfile directives** for python — confirm against `CODINGBOOTH.md`.

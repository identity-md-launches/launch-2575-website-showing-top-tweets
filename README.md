# Swamp

A dark green reader for the identity.md conversation, with AI-equipped Pepe artwork and **12 sourced posts**. Search, filter by topic, rank captured engagement, browse the latest posts, save locally, and copy original X links.

The feed is explicitly an **October 25, 2026 snapshot**, not a live X feed or an exhaustive ranking. Cards distinguish summaries from excerpts. Every card links to its source. See [post provenance](artifacts/SOURCES.md).

## Install, run, and rebuild

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Build and preview production:

```sh
npm run typecheck
npm run build
npm run preview
```

Vite prints the local preview URL (normally port 4173). The finished export is already included in **`dist/`**. A static server can serve it without a rebuild:

```sh
python3 -m http.server 4173 --directory dist
```

Serve over HTTP rather than opening `index.html` as a `file://` URL. `vite.config.ts` sets `base: './'`; the export’s JS, CSS, font, image, favicon, and metadata paths are relative. Navigation uses hashes, so gateway subpaths need no server rewrite. Assets are local and rendering requires no third-party network requests. This assignment does not deploy or publish the site.

## Interaction validation

```sh
npx playwright install chromium
npm run build
npm run check:interactions
```

The test script starts its own temporary server under `/preview/`, inspects the actual production export, and closes the server and browser on completion. Results and screenshots go to `test/scratch/interactions/`. Install WebKit with `npx playwright install webkit` if your host provides its native libraries; inability to launch is recorded separately, while a WebKit interaction failure fails the check.

The source has no runtime API keys or backend. Saved post IDs live in this browser’s local storage under `swamp.saved.v1`; clearing browser data removes them. If storage is unavailable, bookmarks last only for the current visit. Clipboard denial exposes a manually selectable original URL.

## Actual worker results

Validation on October 25, 2026:

| Check | Result |
| --- | --- |
| Clean lockfile install, `npm ci` | Passed; 0 audit vulnerabilities reported |
| Production build, `npm run build` | Passed; relative static export in `dist/` |
| TypeScript, `npm run typecheck` | Passed; no diagnostics |
| Production interaction script | **54 checks passed** in Chromium |
| Pinned taste@1 design probe, external network blocked | **16/16 passed** at 320, 390, and 1440px |
| Axe WCAG A/AA scans | 0 reported violations on mobile, desktop, and About dialog |
| Rendered hero contrast | All sampled text regions passed; measured separately from the probe |
| First screen at 390×844 | Product, search, filters, and first original-post action visible |

Worker dependencies were installed in isolated temporary staging directories, with production output written into this repository’s `dist/`. No dependency installation is required to serve that export. The final build used the clean lockfile installation and bundled assets. Full commands, fixed findings, coverage, and limitations are in [validation](artifacts/validation.md); raw worker reports are in [interaction results](artifacts/interaction-results.json), [probe results](artifacts/taste-results.json), and [hero contrast measurements](artifacts/hero-contrast.json).

**Limitations:** WebKit downloaded but could not launch because native libraries were missing, including GTK 4 and Pango/Cairo. Safari, physical devices, screen readers, native browser zoom, RTL, localization, and end-to-end social unfurls were not tested. Automated accessibility checks are not a compliance certification. X/mirror availability and author claims are external dependencies; counts may have changed. Bookmarks do not synchronize across devices.

## Source map

- `src/App.tsx`: page, post cards, source dialog, controls, saved/share behavior.
- `src/feed.ts`: selection, ranking, snapshot labels, storage parsing.
- `src/posts.json`: sourced content and captured metrics; unknown counts are `null`.
- `src/styles.css`: tokens, components, responsive layouts, focus and motion behavior.
- `src/icons.tsx`: local SVG icon set.
- `public/`: bundled art, avatars, Inter font, favicon, and 1200×630 share image.
- `scripts/check-interactions.mjs`: reproducible browser interaction validation.
- [DESIGN.md](DESIGN.md): final tokens, typography, reusable components, and breakpoints.
- [Asset credits](artifacts/ASSETS.md): generation prompt, image sources, font and design-guidance attribution.

To refresh the feed, verify new post IDs and capture dates, edit `src/posts.json`, update the snapshot labels in `src/feed.ts` and the provenance record, then typecheck, rebuild, and rerun the interaction checks. The assignment’s pinned design probe is an input, not a runtime dependency or a vendored tool.

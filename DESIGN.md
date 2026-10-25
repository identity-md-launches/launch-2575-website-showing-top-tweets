# Swamp design system

## Overview

Swamp is an independent reader for tweets about identity.md. The requested dark green and AI-armed Pepe direction is carried by one hero illustration, forest-colored reading surfaces, and a lime accent. The feed is the product: source links, search, topic filters, ranking, and bookmarks take priority over promotional content.

The implementation lives in `src/styles.css`, `src/App.tsx`, `src/icons.tsx`, and `src/feed.ts`. Screenshots of the final export are in `artifacts/mobile.webp` and `artifacts/desktop.webp`. Data provenance is in `artifacts/SOURCES.md`.

## Colors

`src/styles.css:8` defines two layers: hue primitives and semantic aliases. Components use semantic aliases. The site has one intentionally dark theme, declared with `color-scheme: dark`.

| Semantic token | Value | Use |
| --- | --- | --- |
| `--color-page` | `#0b1510` | Page backdrop and text on lime actions |
| `--color-surface` | `#0e1d14` | Search field surface |
| `--color-card` | `#112319` | Posts, briefing, empty state, dialog |
| `--color-hover` | `#172d20` | Hovered neutral controls |
| `--color-selected` | `#1e3827` | Selected feed view and message surface |
| `--color-border` | `#294031` | Structural separators and card outlines |
| `--color-control-border` | `#52745a` | Search field, outlined actions, dialog |
| `--color-text` | `#ecf1e9` | Main text and selected topic fill |
| `--color-muted` | `#a4b5a7` | Handles, timestamps, metadata, secondary copy |
| `--color-accent` | `#b8f36a` | Selected states, saved icon, primary action fill |
| `--color-accent-hover` | `#cbff89` | Hovered primary action |
| `--color-on-accent` | `#0b1510` | Primary action text |
| `--color-focus` | `#b8f36a` | Keyboard focus outline |

Hero-specific colors match the artwork: `#0c1913` is the seam/background color, `#c1cdbf` the description, and `#d2e7bf` the illustration caption. Post topic text uses `#c1d8ab`. The dialog backdrop is `#020b07cc` with a 6px backdrop blur. These are scoped treatments rather than additional themes.

Measured pairs include main text/card **14.34:1**, muted text/card **7.62:1**, muted text/page **8.63:1**, lime/page **14.23:1**, and control border/search surface **3.32:1**. Hero measurements sampled the actual rendered background under text rectangles; see `artifacts/hero-contrast.json` for values and method limits.

## Typography

Use the local `public/fonts/inter-latin.woff2`, then Arial and sans-serif fallbacks. This is the normal Latin weight-variable Inter file; weights **400, 500, and 700** are used. There are no synthesized italic styles or additional type families. The font is preloaded, uses `font-display: swap`, and was confirmed loaded in Chromium.

| Token | Default size | Role |
| --- | ---: | --- |
| `--text-caption` | 12px / .75rem | Timestamps, tags, source labels, engagement |
| `--text-small` | 14px / .875rem | Navigation, controls, secondary copy |
| `--text-body` | 16px / 1rem | Post text and author names |
| `--text-heading` | 20px / 1.25rem | Feed heading, briefing statement, dialog title |
| `--text-brand` | 28px / 1.75rem | Wordmark |
| `--text-display` | 72px / 4.5rem | Hero headline |

The headline is 60px through 1100px width, 44px through 600px, and 40px through 360px. The wordmark reduces to 20px through 360px so all header controls stay in one row. These are responsive substitutions in existing type roles. Browser measurements found six distinct sizes at each tested primary width. Mobile search input text is 16px to avoid iOS focus zoom.

Hero line-height is 1.02 desktop and 1.04 mobile, with -0.065em tracking. Post text uses 1.65 desktop and 1.6 mobile, capped at 72ch. Secondary paragraphs use 1.65–1.7. Titles use modest negative tracking; body copy has natural spacing. Headings balance, introductory copy uses pretty wrapping, and counts use tabular numerals. Content is selectable and never line-clamped.

## Layout

Spacing follows a 4px rhythm. `--space-1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, and `12` declare 4, 8, 12, 16, 20, 24, 32, 40, and 48px. Repeated padding, margin, and gap declarations use these tokens; optical and control dimensions have local values.

The page is at most **1216px** wide with 32px side gutters. The header uses a 1280px outer container with 32px padding, aligning its content with the page. Hero copy is inset 40px on desktop. Content and controls share the feed’s leading edge.

| Width | Implemented behavior |
| --- | --- |
| Above 1400px | Feed plus 320px sidebar, 40px gap; hero at least 360px tall |
| 1101–1399px | Feed plus 304px sidebar, 36px gap; hero at least 336px tall |
| 841–1100px | Feed plus 272px sidebar, 24px gap; feed controls stack |
| 601–840px | One feed column, two-column information area below it; 20px page gutters; controls return to a row while they fit |
| Through 600px | 16px page gutters, 68px minimum header, 210px minimum hero, stacked search and view controls; sidebar becomes supporting content below the feed |
| Through 360px | Smaller headline and wordmark, tighter header/metadata/action gaps; source arrow is omitted while the source link stays visible |

Mobile removes the redundant sidebar topic list, hero caption, and decorative signoff. The same topic choices remain directly above the feed. It retains the product description and artwork. Rows can wrap when text is enlarged; text containers grow instead of clipping. Layout properties are mostly logical; illustration placement and the physical gradient retain their intended direction.

At **390×844**, the first post begins at y=580, search ends at y=466, and the first original-post action begins at y≈798. Layout checks covered 320, 390, 600, 768, 840, 1024, and 1440 CSS pixels. A 200% root-text enlargement at 390px also reflowed without horizontal scroll. Native browser zoom and RTL/localized variants were not tested.

## Elevation & Depth

Surfaces are flat, distinguished by tone and thin structural borders. Cards have no shadows. The only gradient is a dark scrim over the hero image; it protects headline legibility. The hero uses an isolated stacking context: art, scrim, then copy. The toast is fixed with z-index 40; the native modal uses the browser’s top layer.

## Shapes

Cards and the briefing use 12px corners, reduced to 10px on mobile. The hero uses 16px corners desktop and 10px mobile. Buttons/search use 8px corners, topic chips 6px, avatars 50%. The dialog uses 16px corners desktop and 12px mobile. Decorative hero clipping does not clip text content; enlarged copy determines its height.

## Components

- **Header and navigation** (`App`, `src/App.tsx`): logo returns to the feed, saved navigation clears old search/topic filters, and About opens the source methodology. Active navigation has an underline in addition to color. `#feed` and `#saved` work without server rewrites.
- **Feed controls** (`App`): native buttons with pressed states select Top/Latest/Saved and topics. Search has a bound accessible label, a persistent search icon, Escape-to-clear, and a Ctrl+K / Command+K shortcut when outside editable controls. Ranking is a labeled native select. Query and topic filters combine.
- **PostCard** (`src/App.tsx:31`): receives `post`, `saved`, `rank`, `onSave`, and `onShare`. Shows the author, publication date, labeled summary/excerpt, captured counts, original source, and local bookmark state. Unknown metrics use a dash plus an accessible “not captured” label. Counts are informational; they do not imitate X actions. Avatars have a local initials fallback.
- **Selection logic** (`selectPosts`, `src/feed.ts:32`): all search terms must match; a topic intersects the query. Top uses the selected captured metric, with newer posts breaking ties and unknown values last. Latest uses publication time. Saved restricts the same collection to browser-stored IDs.
- **Empty state** (`App`): explains an empty search or saved view and offers Clear filters or Explore tweets. No network loading state is fabricated because the collection is bundled synchronously.
- **AboutDialog** (`src/App.tsx:201`): native `dialog.showModal()`, labeled title, close control, backdrop dismissal, Escape, and native focus restoration. Background page controls become inert. The share fallback provides a read-only selectable URL if clipboard access is denied.
- **Bookmarks and messages** (`toggleSaved`, `copyPost`): bookmarks persist under `swamp.saved.v1`; unavailable storage falls back to the current visit with an explicit message. Messages use a stable polite live region, a success or information icon, and a dismiss control. They do not expire while being read.
- **Icons** (`src/icons.tsx`): one 1.7px current-color SVG set, with a filled saved state. Icons are hidden from assistive technology where adjacent text or accessible labels provide the meaning.

Focus uses a 2px lime outline with a 4px offset; input focus is inset by 2px. Forced-colors mode uses system Highlight. Dense icon controls are 40px desktop and 36×44px mobile; the probe confirmed the 24px/spacing baseline, but many controls are below the 44px comfort target. Motion is limited to 120ms color/background/border transitions and a 0.96 press scale, all inside `prefers-reduced-motion: no-preference`. There is no entrance or endless animation.

## Do’s and Don’ts

- Start additional content inside `.page-shell`; preserve feed-first DOM order and shared alignment edges.
- Reuse semantic colors and the existing type/spacing scale. Reserve lime filled actions for the current empty-state recovery action; selection fills communicate state.
- Keep source attribution, snapshot dates, and local-storage limits visible in the appropriate UI. Preserve unknown values instead of inventing metrics.
- Keep required art and fonts local, use relative export paths, and use anchors/hash navigation for additional views.
- Do not clip posts, shrink critical text to fit, or add a second card/surface system.
- For another feed view, reuse `PostCard` and `selectPosts`, add its native control beside existing views, and recheck empty, focused, and narrow-width states.

Guidance and asset attribution are retained in `artifacts/ASSETS.md` and the accompanying license files. This document describes the final source; review findings and unverified checks are in `artifacts/validation.md`.

<p align="center">
  <img src="icons/icon128.png" alt="UI Inspector" width="80" />
</p>

<h1 align="center">UI Inspector</h1>

<p align="center">
  <strong>The all-in-one Chrome extension for frontend developers and designers.</strong><br/>
  Extract design tokens, audit performance, check accessibility & SEO, annotate the page with shapes and text, capture screenshots, and get AI-ready fix prompts — all from a single floating panel.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/chrome-MV3-blue?style=flat-square" alt="Chrome MV3" />
  <img src="https://img.shields.io/badge/zero_dependencies-vanilla_JS-green?style=flat-square" alt="Vanilla JS" />
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/privacy-100%25_local-purple?style=flat-square" alt="100% Local" />
</p>

---

## Why UI Inspector?

Most browser DevTools are powerful but scattered. UI Inspector brings **design extraction**, **performance auditing**, **accessibility checks**, **SEO analysis**, and **AI-assisted fixes** into one clean panel — no context switching, no multiple extensions, no setup.

---

## Features at a Glance

| Tab | Purpose |
|-----|---------|
| **Overview** | Page info, typography summary, color palette preview, WCAG contrast scanner, page stats |
| **Colors** | Full color palette with alpha support, live color picker + alpha slider, real-time color swapping, categories (text/background/border), JSON export |
| **Typography** | Font style cards with live preview, family/size/weight/line-height, instance counts |
| **Assets** | Images & SVGs, grid or list view, file sizes, one-click download |
| **Audit** | Performance & quality audit: CLS, images, unused CSS, accessibility, spacing consistency, design token export |
| **SEO** | Meta tags, Open Graph, heading structure, link analysis, structured data, 0-100 score |
| **Inspector** | Element picker with box model, text props, colors, layout details, contrast ratio, AI fix prompts |
| **Markup Mode** | Annotate the live page with pencil, rectangle, ellipse, arrow, and draggable text; copy screenshots to clipboard; gallery of saved captures persisted locally |

---

## Core Capabilities

### Design Token Extraction

- Scans all colors, fonts, font sizes, border radii, shadows, and spacing from any page
- **Palette** view sorted by usage or **Categories** view grouped by text/background/border
- Full **alpha/opacity** support — 8-digit hex display with percentage badge
- One-click export as **CSS Variables**, **Tailwind Config**, or **JSON**

### Live Color Editing

- Native color picker + **alpha slider** on every color band
- All matching elements update in real time as you pick
- Swapped colors rendered with `rgba()` for cross-browser alpha support
- Reset individual colors or all at once — panel close auto-reverts everything

### Element Inspector

- Hover any element to see a **floating tooltip**: tag, dimensions, colors, font, padding, contrast
- Click to inspect: **syntax-highlighted selector**, **box model diagram**, text properties, layout (flex/grid), decoration
- Walks up the DOM tree for effective background calculation
- Uses `elementsFromPoint()` for deep element targeting through overlapping layers

### WCAG Contrast Checking

- Contrast ratios for every text/background pair on the page
- Badges: **Excellent** (7+), **AA Pass** (4.5+), **AA Large** (3+), **Poor** (<3)
- Auto-suggests **AA-compliant alternative colors** preserving the original hue
- **Copy Prompt** buttons in both Overview scanner and Inspector for AI-assisted fixes

---

## Audit Tab

On-demand audit with skeleton loading states — click **Run Audit** to scan:

### Layout Shift Detection
Detects CLS (Cumulative Layout Shift) culprits using `PerformanceObserver`. Shows a score with Good/Needs Work/Poor badge. Flags images missing `width`/`height` and `@font-face` rules without `font-display: swap`. **Highlight** button overlays culprit elements directly on the page.

### Image Audit
Flags oversized images (natural vs rendered size with wasted pixel %), missing `loading="lazy"` on below-fold images, missing `alt` attributes, and non-optimal formats (PNG/JPEG that should be WebP/AVIF). Click any row to scroll to the image.

### Unused CSS Detector
Iterates all accessible `document.styleSheets` and finds rules with no matching DOM element. Shows unused/total count. Copy individual rules or bulk export. Cross-origin sheets gracefully skipped with count displayed.

### Accessibility Score Card
Scans 7 categories: heading hierarchy (skips, missing/multiple H1), images without `alt`, form inputs without labels, interactive elements without accessible text, missing `lang` on `<html>`, unsafe `target="_blank"` links, positive `tabindex` values. Score 0-100 with issues grouped by severity. **Copy Prompt** at every level: single issue, severity group, or entire section.

### Spacing Consistency Checker
Scans all margin/padding values and flags those off a **4px grid**. Shows current value, suggested grid-aligned value, element selector, and instance count — sorted by frequency.

### Export Design Tokens
One-click export in three formats:
- **CSS Variables** — `:root { --color-1: #xxx; --font-1: ...; }`
- **Tailwind Config** — ready-to-paste `tailwind.config.js` with `theme.extend`
- **JSON** — structured data with source URL and timestamp

---

## SEO Tab

Automatic analysis on tab open with **shimmer skeleton** loading state:

| Section | What it checks |
|---------|---------------|
| **Meta Tags** | Title (length 50-60), description (150-160), canonical URL, viewport, lang — with OK/Warning/Missing badges |
| **Social / Open Graph** | og:title, og:description, og:image, twitter:card, JSON-LD structured data |
| **Heading Structure** | Visual indented tree of all H1-H6 headings, flags hierarchy issues |
| **Links** | Internal/external/nofollow counts, empty anchor text detection |
| **Issues** | Grouped by severity (Errors/Warnings/Suggestions) with copy prompts at every level |

Case-insensitive meta tag detection ensures compatibility with all frameworks and CMS platforms.

---

## Markup Mode

Click the **pen icon** in the panel header to enter Markup Mode. The inspector panel transforms into a markup workspace and a floating toolbar appears at the top-center of the page so you can draw directly on the live DOM — perfect for filing visual bug reports, briefing design changes, or sharing review feedback.

### Toolbar

| Section | Controls |
|---------|----------|
| **Tools** | Pencil (freehand), Rectangle outline, Ellipse outline, Arrow with arrowhead, Text |
| **Colors** | 9-swatch palette — red, orange, yellow, green, blue, indigo, purple, black, white |
| **Size** | 3 stroke-width presets for shapes; switches to **font-size presets (12/16/20/28 px) + custom number input (4–200)** when the Text tool is selected |
| **Actions** | Show/Hide Inspector panel, Undo last shape, Clear canvas, Copy Screenshot to Clipboard, Exit (Esc) |

### Drawing & Text

- **Pencil / Rect / Ellipse / Arrow** — click-drag on the page; zero-size shapes are auto-discarded on mouseup
- **Text** — click to drop an inline editor, type, **Enter** to commit (Esc cancels). Committed text is draggable: hover shows a move cursor, click-drag repositions it. **Double-click** a text annotation to re-open the editor with the previous value
- The annotation layer is a **full-document SVG**, so annotations stay anchored to page content when you scroll

### Status Panel

While markup is active, the inspector panel shows a live status card with the current **Tool / Color / Stroke (or Font size)** and quick actions for **Capture Screenshot** and **Clear Drawing**. Toolbar selections update the panel in real time.

### Screenshot Capture

Click the camera icon (toolbar or panel button). The flow:

1. The panel host and toolbar host are temporarily **detached from the DOM** so they cannot appear in the screenshot
2. The browser repaints, then a background service worker calls `chrome.tabs.captureVisibleTab` to grab the visible tab
3. The PNG is written to the clipboard via `ClipboardItem` **and** saved to `chrome.storage.local`
4. The UI is restored exactly where it was

### Captures Gallery

Every screenshot is persisted in the panel's **Captures** section (capped at the last 20). Each row shows a thumbnail and timestamp with three actions:

- **Copy** — re-copy the PNG to clipboard
- **Download** — save as `markup-<ISO-timestamp>.png`
- **Delete** — remove this capture
- Click the thumbnail to preview the full-resolution image in a new tab

Captures survive page reloads and browser restarts. Hit **Clear All** in the header to wipe the gallery.

### Keyboard

- **Esc** — cancels active text input first, then exits Markup Mode
- **Enter** — commits text annotation (or applies a custom font-size value)

---

## AI-Ready Prompts

Every issue discovered by UI Inspector can be copied as a ready-to-paste prompt:

| Level | What it copies |
|-------|---------------|
| **Single issue** | One issue with description and fix instruction |
| **Severity group** | All errors, warnings, or info items in a group |
| **Full section** | All issues in a section (CLS, images, CSS, a11y, spacing, SEO) |
| **Copy All to AI** | Combined prompt with all sections for the entire page |

Paste into **Claude**, **ChatGPT**, **Copilot**, or any AI tool to get targeted code fixes.

---

## UI & UX

- **Floating draggable panel** — grab the top bar to reposition anywhere
- **Resizable** — drag the bottom-right corner (320-500px wide, 400px-90vh tall)
- **Remembers position** between open/close within a session
- **Shadow DOM isolated** — zero CSS leakage from host page
- **Skeleton loading states** — shimmer animations during audit and SEO scans
- **Light theme** with clean typography and subtle shadows

---

## Installation

1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** → select the `ui-inspector-extension` folder
5. Navigate to any page → click the extension icon → **Open Inspector** or **Pick Element**

---

## Project Structure

```
ui-inspector-extension/
  manifest.json      — Chrome MV3 manifest
  popup.html         — Extension popup UI
  popup.js           — Popup click handlers
  background.js      — Service worker: handles tab screenshot capture
                       (chrome.tabs.captureVisibleTab) for Markup Mode
  content.js         — Core: scanning, rendering, picker, color swaps,
                       audit, accessibility, SEO, token export, markup
                       overlay & toolbar, capture persistence
  content.css        — Panel styles (loaded into Shadow DOM)
  icons/             — Extension icons (16, 48, 128px)
  docs/mockups/      — HTML design mockups
```

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Manifest V3** | Chrome extension platform |
| **Shadow DOM** | CSS isolation — panel renders in a shadow root |
| **Vanilla JS** | Zero dependencies, no build step |
| `<input type="color">` + range slider | Color picker with alpha support |
| `document.elementsFromPoint()` | Deep element targeting |
| `getComputedStyle()` | Property extraction |
| `PerformanceObserver` | CLS layout shift detection |
| `document.styleSheets` / `cssRules` | Unused CSS detection |
| WCAG relative luminance formula | Contrast ratio calculation |
| DOM traversal | Accessibility & SEO checks |
| Inline **SVG** with namespace API | Markup annotation overlay (shapes, arrows, text) |
| `chrome.tabs.captureVisibleTab` | Screenshot capture (Markup Mode) |
| `ClipboardItem` + `navigator.clipboard.write` | Copy PNG screenshots to clipboard |
| `chrome.storage.local` | Persisted markup captures gallery |

---

## Permissions

| Permission | Reason |
|-----------|--------|
| `activeTab` | Access the current tab when clicked; required by `chrome.tabs.captureVisibleTab` for Markup screenshots |
| `scripting` | Inject content script |
| `storage` | Persist Markup Mode screenshot captures in the gallery |
| `unlimitedStorage` | Remove the 5 MB cap on `chrome.storage.local` so captures aren't truncated |

**No data is collected, stored, or sent anywhere. Everything runs 100% locally in the browser. Markup screenshots live only in your browser's local storage and can be deleted at any time from the Captures gallery.**

---

## License

MIT

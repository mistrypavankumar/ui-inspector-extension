# UI Inspector

A Chrome extension that extracts and inspects design tokens from any webpage — colors, typography, assets, spacing, contrast ratios, accessibility, performance, and more. Includes a full audit tab with AI-ready prompts to fix issues. Built for developers and designers who need to audit, debug, or replicate UI from live sites.

## Features

### 7-Tab Panel

| Tab | What it does |
|-----|-------------|
| **Overview** | Page title/URL, typography summary (heading & body fonts), color palette preview, contrast scanner, page stats |
| **Colors** | All colors with instance counts, including alpha/opacity values. **Palette** view (sorted by usage) or **Categories** view (grouped by text/background/border). Live color picker with alpha slider to swap colors on the page in real time. Reset individual or all changes. |
| **Typography** | Font style cards with live "AaBbCcDdEeFf" preview rendered in the actual font, size, and weight. Instance counts per style. |
| **Assets** | All images and SVGs on the page. Grid or list view. File sizes. Download any asset. |
| **Audit** | One-click performance audit: Layout Shifts, Image Audit, Unused CSS, Accessibility Score Card, Spacing Consistency, and Export Design Tokens. Each section has a **Copy Prompt** button for AI-assisted fixes. |
| **SEO** | Full SEO analysis: meta tags (title, description, canonical, viewport, lang), Open Graph / Twitter Card, heading structure tree, link analysis (internal/external/nofollow/empty), structured data detection. Score 0-100 with issues grouped by severity. |
| **Inspector** | Click any element to see: selector with syntax highlighting, box model diagram, text properties, colors with swatches, layout (flex/grid details), decoration, and contrast ratio with AA compliance badge. |

### Element Picker

- Hover any element to see a **floating tooltip** with: tag, dimensions, text color, background, font family/size/weight, padding, and contrast ratio
- Purple border highlights the hovered element with dimension labels
- Walks up the DOM to find effective background for accurate contrast calculation
- Uses `elementsFromPoint` to target the deepest element (not the parent container)

### Contrast Checking

- Calculates WCAG contrast ratios for text against background
- Badges: **Excellent** (7+), **AA Pass** (4.5+), **AA Large** (3+), **Poor** (<3)
- When contrast is poor, the Inspector suggests an **AA-compliant alternative color** that preserves the original hue
- **Copy Prompt to Fix Contrast** — one-click button in both the Overview scanner and Inspector that copies a ready-to-use prompt describing the contrast issues with suggested fixes, useful for AI-assisted or team workflows

### Live Color Editing

- Click the circle picker on any color band to open the native color picker
- **Alpha slider** on every color band — drag to adjust opacity (0-100%), live-updates elements with `rgba()` values
- Colors with alpha display as 8-digit hex (e.g. `#FF000080`) with a percentage badge
- All elements using that color update in real time as you pick
- "Reset" reverts individual colors; "Reset All" reverts everything
- Closing the panel automatically reverts all changes
- Export all colors (or swapped colors) as JSON

### Audit Tab

On-demand audit with six sections — click **Run Audit** to scan the page:

- **Layout Shift Highlighter** — detects elements causing CLS (Cumulative Layout Shift). Shows a CLS score with Good/Needs Work/Poor badge. Flags images missing `width`/`height` attributes and `@font-face` rules without `font-display: swap`. "Highlight" button overlays culprit elements on the page.
- **Image Audit** — flags oversized images (natural vs rendered size with % wasted), missing `loading="lazy"` on below-fold images, missing `alt` attributes, and images that should be converted to WebP/AVIF. Click any row to scroll to the image on the page.
- **Unused CSS Detector** — scans all accessible stylesheets and finds CSS rules that don't match any element on the page. Shows count of unused vs total rules. Copy individual rules or all at once. Cross-origin sheets are gracefully skipped.
- **Accessibility Score Card** — scans for heading hierarchy violations (h1->h3 skips, missing/multiple h1), images without `alt`, form inputs without labels, buttons/links without accessible text, missing `lang` attribute on `<html>`, unsafe `target="_blank"` links without `rel="noopener"`, and positive `tabindex` values. Shows a 0-100 score with issues grouped by severity (errors/warnings/info). Each group (Errors, Warnings, Info) has its own **Copy Prompt** button, and every individual issue has a copy button on hover for single-issue prompts.
- **Spacing Consistency Checker** — scans all elements' margin and padding values and flags those not aligned to a 4px grid (e.g. `13px`, `5px`). Shows each off-grid value with a suggested nearest grid value (`13px → 12px`), the element selector, and instance count. Sorted by most frequent offenders.
- **Export Design Tokens** — one-click export of all extracted colors, fonts, font sizes, border radii, shadows, and spacing values from the page in three formats:
  - **CSS Variables** — `:root` custom properties ready to paste into a stylesheet
  - **Tailwind Config** — `tailwind.config.js` with `theme.extend` populated
  - **JSON** — structured token data with source URL and timestamp

Every audit section includes a **Copy Prompt** button that generates an AI-ready prompt with specific fix instructions. Copy at three levels of granularity: a single issue, an entire severity group, a full section, or everything at once with the **"Copy All to AI"** button at the top — paste directly into Claude, ChatGPT, or any AI tool to fix your codebase.

### SEO Tab

Automatic SEO analysis with six sections:

- **Meta Tags** — checks title (length 50-60), description (length 150-160), canonical URL, viewport, and lang attribute. Each tag shows a status badge (OK/Warning/Missing).
- **Social / Open Graph** — checks og:title, og:description, og:image, twitter:card, and JSON-LD structured data presence.
- **Heading Structure** — visual tree of all headings (H1-H6) with indentation by level. Flags missing H1, multiple H1s, and skipped levels.
- **Links** — counts internal, external, nofollow links, and links with empty anchor text.
- **Issues** — all issues grouped by severity (Errors/Warnings/Suggestions) with per-issue, per-group, and full **Copy Prompt** buttons for AI-assisted fixes.

SEO tab scans automatically when opened — no "Run" button needed. "Re-scan" refreshes the data.

### UI

- **Floating draggable popup** — grab the top bar to move it anywhere
- **Resizable** — drag the bottom-right corner (320-500px wide, 400px-90vh tall)
- **Remembers position** between open/close within a session
- **Shadow DOM isolated** — host page CSS cannot break the panel styling
- **Light theme** with clean typography and subtle shadows

## Install

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the `ui-inspector-extension` folder
5. Navigate to any page, click the extension icon, then **Open Inspector** or **Pick Element**

## Files

```
ui-inspector-extension/
  manifest.json      — Chrome MV3 manifest
  popup.html         — Extension popup (Open Inspector / Pick Element)
  popup.js           — Popup click handlers
  content.js         — Core logic: scanning, rendering, picker, color swaps, audit, a11y, token export
  content.css        — Panel styles (loaded into Shadow DOM)
  icons/             — Extension icons (16, 48, 128px)
  docs/mockups/      — HTML mockup files
```

## Tech

- **Manifest V3** Chrome extension
- **Shadow DOM** for CSS isolation — the panel renders inside a shadow root so no host page styles leak in
- **Vanilla JS** — no frameworks, no build step
- Native `<input type="color">` + custom alpha range slider for the color picker
- `document.elementsFromPoint()` for accurate deep element targeting
- `getComputedStyle()` for all property extraction
- WCAG relative luminance formula for contrast ratios
- `PerformanceObserver` with `layout-shift` entries for CLS detection
- `document.styleSheets` + `cssRules` iteration for unused CSS detection
- DOM traversal for accessibility checks (headings, labels, ARIA, tab order)

## Permissions

- `activeTab` — access the current tab when clicked
- `scripting` — inject content script

No data is collected, stored, or sent anywhere. Everything runs locally in the browser.

## License

MIT

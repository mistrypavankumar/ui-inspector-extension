# UI Inspector

A Chrome extension that extracts and inspects design tokens from any webpage — colors, typography, assets, spacing, contrast ratios, and more. Built for developers and designers who need to audit or replicate UI from live sites.

## Features

### 5-Tab Panel

| Tab | What it does |
|-----|-------------|
| **Overview** | Page title/URL, typography summary (heading & body fonts), color palette preview, contrast scanner, page stats |
| **Colors** | All colors with instance counts. **Palette** view (sorted by usage) or **Categories** view (grouped by text/background/border). Live color picker to swap colors on the page in real time. Reset individual or all changes. |
| **Typography** | Font style cards with live "AaBbCcDdEeFf" preview rendered in the actual font, size, and weight. Instance counts per style. |
| **Assets** | All images and SVGs on the page. Grid or list view. File sizes. Download any asset. |
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

### Live Color Editing

- Click the circle picker on any color band to open the native color picker
- All elements using that color update in real time as you pick
- "Reset" reverts individual colors; "Reset All" reverts everything
- Closing the panel automatically reverts all changes
- Export all colors (or swapped colors) as JSON

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
  content.js         — Core logic: scanning, rendering, picker, color swaps
  content.css        — Panel styles (loaded into Shadow DOM)
  icons/             — Extension icons (16, 48, 128px)
  docs/mockups/      — HTML mockup files
```

## Tech

- **Manifest V3** Chrome extension
- **Shadow DOM** for CSS isolation — the panel renders inside a shadow root so no host page styles leak in
- **Vanilla JS** — no frameworks, no build step
- Native `<input type="color">` for the color picker
- `document.elementsFromPoint()` for accurate deep element targeting
- `getComputedStyle()` for all property extraction
- WCAG relative luminance formula for contrast ratios

## Permissions

- `activeTab` — access the current tab when clicked
- `scripting` — inject content script

No data is collected, stored, or sent anywhere. Everything runs locally in the browser.

## License

MIT

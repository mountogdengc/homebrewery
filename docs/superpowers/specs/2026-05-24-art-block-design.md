# Art Block: Interactive Image Placement — Phase 1 Design

**Date:** 2026-05-24
**Scope:** Phase 1 — Parser + Static Rendering (no interactive drag/resize)

## Overview

Add a new `{{art ... }}` block syntax to the homebrewery markdown parser that renders absolutely positioned images within brew pages. The preview becomes a WYSIWYG placement surface: users set coordinates in the markdown source and see the image positioned precisely in the preview. Phase 2 (future) will add click-to-select, drag-to-move, and handle-to-resize in the preview, with automatic markdown patching.

## Syntax

```
{{art
src: /images/milk-stable-map.png
x: 0.45in
y: 1.2in
w: 3.25in
anchor: page
z: behind
}}
```

- Multiline block: starts with `{{art`, ends with `}}` on its own line.
- Body contains `key: value` pairs, one per line.
- Whitespace around keys and values is trimmed.

### Supported Properties

| Property | Required | Default | Values |
|----------|----------|---------|--------|
| `src`    | yes      | —       | URL or relative path |
| `x`      | no       | `0in`   | number + unit (`in`, `%`, `cm`, `px`) |
| `y`      | no       | `0in`   | number + unit |
| `w`      | no       | `100%`  | number + unit |
| `h`      | no       | auto    | number + unit |
| `anchor` | no       | `page`  | `page` only (Phase 1) |
| `z`      | no       | `front` | `front`, `behind` |

- Units supported: `in`, `%`, `cm`, `px`.
- If `h` is omitted, the browser preserves the image's aspect ratio.
- Unrecognized properties are ignored silently (forward compatibility for Phase 2: `opacity`, `rotation`, `wrap`, `anchor: column`, etc.).

## Architecture

### Tokenizer

A new marked.js extension registered in `shared/markdown.js` alongside the existing `mustacheSpans` and `mustacheDivs` extensions.

**Token type:** `artBlock`

**Matching:** The tokenizer matches blocks starting with `{{art` followed by a newline, one or more `key: value` lines, and a closing `}}` on its own line.

**Regex pattern:**
```
/^{{art\n([\s\S]*?)\n}}/
```

**Parsing:** The captured body is split by newlines. Each line is parsed as `key: value` using a simple split on the first `:`. Keys and values are trimmed.

**Token output:**
```js
{
  type: 'artBlock',
  raw: '{{art\nsrc: ...\nx: ...\n}}',
  src: '/images/map.png',
  x: '0.45in',
  y: '1.2in',
  w: '3.25in',
  h: null,
  anchor: 'page',
  z: 'behind',
  sourceLine: 14  // line number in the source document
}
```

The `sourceLine` is derived from the token's start position in the source text (count newlines before the match). This is stored for Phase 2's line-range-based markdown patching.

### Renderer

The renderer outputs an absolutely positioned `<img>` element:

```html
<img class="art-block"
     src="/images/milk-stable-map.png"
     data-source-line="14"
     style="position: absolute; left: 0.45in; top: 1.2in; width: 3.25in; z-index: -1; pointer-events: none;" />
```

**Style mapping:**

| Property | CSS |
|----------|-----|
| `x`      | `left: <value>` |
| `y`      | `top: <value>` |
| `w`      | `width: <value>` |
| `h`      | `height: <value>` (omitted if not specified) |
| `z: behind` | `z-index: -1` |
| `z: front`  | `z-index: 1000` |

**Fixed styles:** `position: absolute; pointer-events: none;`

- `pointer-events: none` prevents the image from capturing clicks in Phase 1. Phase 2 will remove this to enable selection/dragging.
- `data-source-line` attribute stored for Phase 2 patching.

### Page Containment

Art blocks are absolutely positioned relative to their containing page `<div>`. Each page is rendered separately via `Markdown.render(pageIndex)`, so an art block's coordinates are relative to the page it appears on.

**Requirement:** The page container element must have `position: relative` for absolute positioning to work. Verify this is set in the theme CSS; add it if not.

### Error Handling

- **Missing `src`:** Render nothing. Log a console warning.
- **Unrecognized properties:** Ignore silently.
- **Malformed block (no closing `}}`):** Do not match. The text passes through as raw markdown (standard marked.js behavior for unmatched tokens).
- **Invalid unit values:** Pass through as-is to CSS. The browser will ignore invalid values gracefully.

## Files Modified

1. **`shared/markdown.js`** — Add `artBlock` tokenizer and renderer as a new marked.js extension.

## Files Not Modified

- No theme CSS changes. All positioning is inline styles.
- No editor changes. Phase 1 is manual editing only.
- No preview component changes. The rendered HTML is just an `<img>` tag inside the existing page rendering pipeline.

## Testing

- Unit tests for the tokenizer: valid blocks, missing properties, defaults, malformed blocks, multiple units.
- Unit tests for the renderer: correct HTML output, style mapping, z-index values, missing src handling.
- Manual verification: place art blocks in a test brew, confirm positioning in preview at different zoom levels.

## Phase 2 Preview (Future)

Not in scope for this design, but informing decisions:

- **Interaction model:** Contextual — hover shows dashed border, click selects, drag moves, corner handles resize. Escape deselects.
- **Architecture:** Handlers inside the iframe, events communicated to parent EditPage via callback.
- **Markdown patching:** Use `data-source-line` to locate the block in CodeMirror, regex-replace property values in place.
- **Unit preservation:** Respect the user's original unit. If they wrote `x: 50%`, drag updates in `%`. Default to inches for new blocks.

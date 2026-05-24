# Art Block Phase 2: Interactive Placement — Design

**Date:** 2026-05-24
**Scope:** Phase 2 — Click-to-select, drag-to-move, handle-to-resize with automatic markdown patching
**Depends on:** Phase 1 (parser + static rendering, complete)

## Overview

Make art blocks interactive in the preview. Users hover to discover, click to select, drag to reposition, and resize via corner handles. All changes patch the markdown source on drop — the editor text is the source of truth.

## Interaction Flow

1. **Hover** — Mouse enters an `.art-block` image. A dashed border appears (via CSS class toggle on mouseenter/mouseleave).
2. **Click** — Clicking the image selects it. A solid highlight border and four corner resize handles appear. `e.stopPropagation()` prevents the existing click-to-navigate feature from firing. Clicking a different art block switches selection to it.
3. **Drag (move)** — Mousedown on the selected image + mousemove repositions it via direct DOM manipulation (`style.left`, `style.top`). No markdown updates during drag.
4. **Drop (move end)** — On mouseup, the new pixel position is converted back to the user's original unit. The corresponding `{{art` block in the editor source is located by index and its `x`/`y` values are patched in place.
5. **Resize** — Mousedown on a corner handle + mousemove updates the image's width (and height if originally specified) via direct DOM manipulation. On mouseup, `w` (and `h` if present) are patched in the editor source.
6. **Deselect** — Clicking anywhere outside an art block, or pressing Escape, removes the selection and handles.

## Architecture

### Interaction Module

**File:** `client/homebrew/brewRenderer/artBlockInteraction.js` (new)

Exports a single function: `initArtBlockInteraction(frameDoc, onUpdate)`

- `frameDoc` — the iframe's `document` object (from `react-frame-component`)
- `onUpdate` — callback: `({ artIndex, props }) => void` where `props` is an object of changed property values (e.g., `{ x: '1.5in', y: '2.3in' }`)

The module:
- Queries all `.art-block` elements in `frameDoc`
- Removes `pointer-events: none` from each (Phase 1 sets this; Phase 2 needs pointer events)
- Attaches mouseenter/mouseleave handlers for hover hints (toggles a CSS class)
- Attaches click handler for selection (with `e.stopPropagation()`)
- Attaches mousedown/mousemove/mouseup on the selected image for dragging
- Creates and positions corner resize handles (small squares at each corner of the selected image)
- Attaches mousedown/mousemove/mouseup on handles for resizing
- Listens for Escape key and clicks on non-art-block areas to deselect
- Calls `onUpdate()` once on mouseup after drag or resize

The module must be re-initialized whenever the preview re-renders (new page content). It should clean up any existing event listeners before re-attaching.

### Data Flow

```
User drags art block in iframe
    |
    v
artBlockInteraction.js: direct DOM manipulation during drag
    |
    v (mouseup)
artBlockInteraction.js: read data-art-index, data-art-unit-*, compute new values
    |
    v
onUpdate({ artIndex: 2, props: { x: '1.5in', y: '2.3in' } })
    |
    v
brewRenderer.jsx: props.onArtBlockUpdate(artIndex, props)
    |
    v
editPage.jsx: editorRef.current.patchArtBlock(artIndex, props)
    |
    v
editor.jsx: find Nth {{art block in CodeMirror doc, regex-replace property values
    |
    v
CodeMirror document updated -> React state update -> preview re-renders
```

### Wiring in brewRenderer.jsx

After the iframe mounts (in `frameDidMount` or equivalent), call:

```js
initArtBlockInteraction(frameDoc, ({ artIndex, props }) => {
    props.onArtBlockUpdate?.(artIndex, props);
});
```

Re-call on each re-render of page content to rebind to new DOM elements.

Pass `onArtBlockUpdate` as a new prop from `editPage.jsx`.

### Editor Patching — `patchArtBlock(artIndex, newProps)`

**File:** `client/homebrew/editor/editor.jsx` (new method)

1. Get the full document text from CodeMirror.
2. Find all `{{art` occurrences using a regex. Take the Nth one (matching `artIndex`).
3. From that position, find the closing `}}`.
4. Within that range, for each key in `newProps`:
   - Search for `key: oldValue` using regex `/^(\s*key:\s*).*$/m`
   - Replace with `key: newValue`
   - If the key doesn't exist in the block (e.g., `h` was auto, now explicit after resize), insert a new line before `}}`
5. Apply the edit to CodeMirror via `cm.replaceRange()`.

This produces a single undo-able edit in CodeMirror's history.

## Art Block Index Tracking

**File:** `shared/markdown.js` (modify artBlock extension)

Add a module-level counter:

```js
let artBlockIndex = 0;
```

In the renderer, emit `data-art-index` and increment:

```js
renderer(token) {
    const index = artBlockIndex++;
    return `<img class="art-block" data-art-index="${index}" ...>`;
}
```

Reset the counter when page 0 is rendered. The `Markdown.render(pageText, pageNumber)` function already receives the page number — reset when `pageNumber === 0`:

```js
render: (rawBrewText, pageNumber = 0) => {
    if (pageNumber === 0) artBlockIndex = 0;
    ...
}
```

On the editor side, `patchArtBlock(artIndex, props)` counts `{{art` occurrences in the full source text to find the matching block.

## Unit Preservation

Each rendered art block carries data attributes for the original units:

```html
<img class="art-block"
     data-art-index="0"
     data-art-unit-x="in"
     data-art-unit-y="in"
     data-art-unit-w="in"
     data-art-unit-h=""
     ...>
```

The tokenizer parses the unit from each value (e.g., `0.45in` → value `0.45`, unit `in`). The renderer stores the unit in a data attribute.

On drop/resize, `artBlockInteraction.js` converts the pixel position back to the original unit:

- **inches:** `px / 96`
- **cm:** `px / 96 * 2.54`
- **%:** `px / pageWidthPx * 100` (or `pageHeightPx` for y)
- **px:** no conversion

Page dimensions: 8.5in x 11in at 96 DPI = 816px x 1056px. These are the CSS dimensions of a `.page` element. The module reads the actual page element dimensions to handle zoom correctly.

Values are rounded to 2 decimal places.

## Visual Feedback (CSS)

Styles injected into the iframe (via the interaction module or a small `<style>` tag):

```css
.art-block {
    cursor: default;
}
.art-block.art-hover {
    outline: 2px dashed rgba(0, 120, 255, 0.5);
    cursor: grab;
}
.art-block.art-selected {
    outline: 2px solid rgba(0, 120, 255, 0.8);
    cursor: grab;
}
.art-block.art-dragging {
    cursor: grabbing;
    opacity: 0.8;
}
.art-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: white;
    border: 2px solid rgba(0, 120, 255, 0.8);
    z-index: 10000;
    pointer-events: auto;
}
.art-handle-nw { cursor: nw-resize; }
.art-handle-ne { cursor: ne-resize; }
.art-handle-sw { cursor: sw-resize; }
.art-handle-se { cursor: se-resize; }
```

Handles are absolutely positioned `<div>` elements placed at the four corners of the selected image. They are children of the page container (not the image itself, since images can't have children).

## Interaction with Click-to-Navigate

The existing click-to-navigate feature attaches an `onClick` handler on the `<Frame>` component. When an art block is clicked:

1. The art block's click handler fires first (it's on the element itself).
2. It calls `e.stopPropagation()`.
3. The Frame's onClick handler never receives the event.

The two systems are completely decoupled. Click-to-navigate continues working for all non-art-block content.

## Files Modified

1. **`shared/markdown.js`** — Add `data-art-index` counter, store unit data attributes, remove `pointer-events: none` from renderer output
2. **`client/homebrew/brewRenderer/artBlockInteraction.js`** — New file. All iframe-side interaction logic
3. **`client/homebrew/brewRenderer/brewRenderer.jsx`** — Initialize interaction module after iframe mount, pass `onArtBlockUpdate` callback
4. **`client/homebrew/pages/editPage/editPage.jsx`** — Pass `onArtBlockUpdate` prop to BrewRenderer
5. **`client/homebrew/editor/editor.jsx`** — Add `patchArtBlock(artIndex, newProps)` method

## Testing

- **Unit tests for `patchArtBlock`:** Given source text with N art blocks, verify correct property replacement for each index. Test property insertion when key doesn't exist. Test unit preservation.
- **Unit tests for unit conversion:** Verify px-to-in, px-to-%, px-to-cm conversions with rounding.
- **Manual testing:** Drag art blocks, verify editor updates. Resize, verify w/h updates. Click-to-navigate still works for text. Escape deselects. Multiple art blocks on one page. Art blocks across multiple pages.

## Not in Scope

- Rotation, opacity, captions
- `anchor: column` mode
- Keyboard nudging with arrow keys
- Shift-drag for constrained movement
- Proportional resize (future: hold Shift while resizing)

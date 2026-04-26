# Adventure Generator — Image Generation Lightbox

## Overview

Add image generation buttons to Appendix A code blocks in the starship adventure generator. Each prompt opens a per-prompt gallery lightbox where users can generate images from multiple providers, browse results, and download.

## Image Providers

Three independent image providers (separate from the text generation providers):

| Provider | Model | API Key | Notes |
|----------|-------|---------|-------|
| OpenAI | DALL-E 3 | `OPENAI_API_KEY` | Same key as text generation |
| Gemini | Imagen | `GEMINI_API_KEY` | Same key as text generation |
| ComfyUI | Flux | None (local) | Default URL `http://localhost:8188`, workflow TBD |

## Markdown Renderer Changes

File: `tools/adventure-generator/src/App.jsx` — `renderMarkdown` function.

- Track whether rendering is inside an "APPENDIX A" section (detect `## APPENDIX A` heading, stop at `## APPENDIX B` or end of document).
- Code blocks inside Appendix A render with a **"Generate Image" button** overlaid at the top-right corner, styled to match the sci-fi theme (amber accent, `clip-path` chevron).
- Code blocks outside Appendix A render normally with no button.
- Clicking the button opens the lightbox for that prompt, passing the code block text and its label.

### Prompt Label Extraction

Capture the most recent h3 heading or bold-text line preceding each Appendix A code block:

- `### Master Deckplan Prompt (All Decks)` → label: "Master Deckplan Prompt (All Decks)"
- `**Room 3 — Cargo Bay:**` → label: "Room 3 — Cargo Bay"
- Fallback if no label found: "Image Prompt 1", "Image Prompt 2", etc.

## Lightbox Component

A modal overlay matching the existing dark sci-fi theme.

### Layout

**Header:**
- Title: the prompt label (e.g., "Master Deckplan Prompt" or "Room 3 — Cargo Bay")
- Close button (X)

**Image area (center):**
- Large image display
- Left/right navigation arrows on the sides (hidden when only one image)
- Counter bottom-center ("2 of 5")
- Loading spinner (themed) when a generation is in progress

**Controls bar (bottom):**
- Image provider dropdown — only shows providers reported available by `/api/ai/image-status`
- "Generate" button — fires generation, appends result to gallery
- "Download" button — saves the currently displayed image

### State

- Gallery state lives in the parent `App` component as a map: `{ [promptIndex]: [{ dataUrl, provider, timestamp }, ...] }`
- Lightbox receives the current prompt's gallery array, the prompt text, the label, and an `onGenerate` callback
- Images stored as base64 data URLs — no server persistence

## Server Endpoints

File: `server/ai.api.js`

### `GET /api/ai/image-status`

Returns which image providers are available:

```json
{
  "openai": { "available": true },
  "gemini": { "available": true },
  "comfyui": { "available": false }
}
```

- OpenAI: `!!getOpenaiKey()`
- Gemini: `!!getGeminiKey()`
- ComfyUI: pings configured URL with a short timeout

### `POST /api/ai/generate-image`

Generates an image, returns base64.

**Request:** `{ prompt, provider }` — provider is `"openai"`, `"gemini"`, or `"comfyui"`

**Response:** `{ image: "data:image/png;base64,..." }`

**Provider implementations:**

- **OpenAI:** DALL-E 3, 1024x1024, `response_format: "b64_json"`
- **Gemini:** Imagen via Gemini API, returns b64
- **ComfyUI:** POST workflow JSON to `{comfyui_url}/prompt`, poll for completion, fetch output image. Endpoint structure wired up but workflow details TBD — will need adjustment when Flux workflow is configured.

## Config Changes

File: `config/default.json`

Add: `"comfyui_url": "http://localhost:8188"`

## Files Modified

| File | Change |
|------|--------|
| `tools/adventure-generator/src/App.jsx` | Renderer changes, lightbox component, gallery state, generate button on code blocks |
| `server/ai.api.js` | `GET /api/ai/image-status`, `POST /api/ai/generate-image` |
| `config/default.json` | Add `comfyui_url` |
| `tools/adventure-generator/vite.config.js` | Proxy `/api` already configured |

Rebuild `tools/adventure-generator` after changes (`npm run build`).

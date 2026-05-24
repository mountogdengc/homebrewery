# DOCX Import via Converter Panel

**Date:** 2026-05-23
**Status:** Approved

## Problem

Google Docs exports `.docx` files with generic Word styles that don't match the AL paragraph styles the Homebrewery DOCX export produces. Users need a way to import a `.docx` into the editor with proper DungeonCraftAL formatting, then re-export a clean `.docx`.

## Solution

Add `.docx` import support to the existing Markdown Converter panel using `mammoth.js` (browser build). When a `.docx` file is loaded, mammoth converts it to markdown, which is then piped through the existing DungeonCraftAL format converter.

## Changes

### 1. New dependency

- `mammoth` — converts `.docx` ArrayBuffer to markdown in the browser (~50KB bundle)

### 2. Converter panel (`client/homebrew/components/markdownConverter/converterPanel.jsx`)

- Expand file input `accept` from `.md,.txt,.markdown` to also include `.docx`
- When a `.docx` file is loaded:
  - Read it as `ArrayBuffer` (instead of text)
  - Call `mammoth.convertToMarkdown({ arrayBuffer })` 
  - Place the resulting markdown string into the input textarea
- For `.md/.txt` files, behavior is unchanged (read as text)

### 3. No other changes

No new components, server routes, or endpoints. The existing converter pipeline (markdown → DungeonCraftAL format transform → preview → insert into editor) handles everything downstream.

## User Flow

```
Open converter panel → Load .docx file → mammoth converts to markdown
→ textarea shows markdown → select DungeonCraftAL → Convert
→ preview AL-formatted output → Insert into Editor → Export DOCX
```

## Limitations

- mammoth's markdown output handles headings, bold/italic, lists, tables, and links well but may lose complex formatting (nested tables, embedded images, custom Word styles)
- Users can review and edit the intermediate markdown before converting

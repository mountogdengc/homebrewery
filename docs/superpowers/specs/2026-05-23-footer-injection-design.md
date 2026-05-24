# Footer Injection Feature

**Date:** 2026-05-23
**Status:** Approved

## Problem

AL adventures require a standardized footer on every page containing the "not for resale" notice, adventure code, adventure name, and version. Currently this must be manually copied to each page. Changing the adventure code or version means updating every page by hand.

## Solution

Two changes:

1. Add `adventureCode` and `adventureVersion` fields to the Properties Editor (metadata)
2. Add an "Inject Footers" navbar button that programmatically inserts footer blocks into every page of the markdown

## Design

### New Metadata Fields

Add two text inputs to the Properties Editor (`metadataEditor.jsx`), after the tags field:

- **Adventure Code** -- `metadata.adventureCode`, placeholder `FR-DC-XXX-XX`
- **Adventure Version** -- `metadata.adventureVersion`, placeholder `v1.0`

The adventure name comes from the existing `metadata.title`.

### Inject Footers Navbar Button

A new navbar item (`injectFooters.navitem.jsx`) that appears in the editor toolbar alongside Export DOCX, Export IDTT, etc.

**When clicked:**

1. Reads `adventureCode`, `adventureVersion`, and `title` from the brew's metadata
2. If any of the three are missing, shows an alert identifying which fields need to be filled in the Properties Editor
3. Splits the markdown text on `\page`
4. For each page chunk:
   - Strips any existing `{{footnote ... }}` blocks (regex: `\{\{footnote[\s\S]*?\}\}`)
   - Strips any existing `{{pageNumber,auto}}` lines
   - Trims trailing whitespace
   - Appends the generated footer:

```
{{footnote
Not for resale. Permission granted to print or photocopy this document for personal use only.

CODE TITLE (VERSION)
}}

{{pageNumber,auto}}
```

5. Rejoins pages with `\page` separators
6. Updates the editor content via the existing `onTextChange` prop (or equivalent content update mechanism)

**The footer is identical on every page including the cover.** The DungeonCraftAL theme CSS already handles positioning differences (centered on `{{frontCover}}` pages, left/right alternating on body pages).

### What Does NOT Change

- No server changes
- No rendering changes
- No DOCX export changes (the footer is in the markdown source, so the existing DOCX pipeline picks it up)
- No theme CSS changes

## Files Affected

| File | Change |
|---|---|
| `client/homebrew/editor/metadataEditor/metadataEditor.jsx` | Add adventureCode and adventureVersion fields |
| `client/homebrew/navbar/injectFooters.navitem.jsx` | New navbar button component |
| `client/homebrew/navbar/navbar.jsx` | Import and render the new navbar item |

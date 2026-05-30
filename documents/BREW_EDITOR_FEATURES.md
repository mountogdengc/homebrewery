# Brew Editor Features

This document describes the feature set of the Homebrewery brew editor: the markdown authoring surface, live preview, document metadata, snippets, import/export tools, storage behavior, sharing controls, and embedded content support.

The brew editor is the application area used to create and maintain long-form brew documents. It is distinct from the standalone stat block, character, playtest, procedural image, and system-specific builder tools, although it can embed output from some of those tools.

---

## Feature Summary

The brew editor provides:

- A split-pane document workspace with a CodeMirror source editor and a live rendered preview.
- A tabbed authoring model for brew markdown, custom CSS, reusable snippets, and document metadata.
- V3 and legacy renderer support, with theme selection for V3 brews.
- Homebrewery-specific markdown extensions for pages, columns, styled blocks, inline injectors, variables, art blocks, emojis, stat block embeds, procedural image embeds, and specialized typography.
- Real-time preview rendering in an isolated iframe so broken document HTML is contained.
- Preview navigation tools for zoom, page layout, page range display, page jumping, and optional header navigation.
- Source-to-preview and preview-to-source navigation helpers.
- Autosave, manual save, unsaved-change warnings, version history, and local recent-brew tracking.
- Google Drive storage transfer support when the user account is linked.
- Markdown conversion and DOCX import assistance for bringing external drafts into Homebrewery format.
- Export to Markdown, PDF, flat PDF, DOCX, and IDTT.
- Publishing, share links, cloning, authorship/invitation controls, tags, thumbnail, language, adventure metadata, and deletion controls.
- In-editor D&D 5e stat block insertion and multi-system stat block rendering in the preview.
- Interactive art block positioning and resizing directly from the preview.
- Selected-text AI editing through the editor toolbar.

---

## Workspace Layout

### Split-pane editing

The edit page is divided into two main panes:

- The left pane hosts the editor.
- The right pane hosts either the rendered brew preview or the stat block picker.

The panes are resizable through the shared split-pane component. When the split changes size, the editor refreshes so CodeMirror lays out line wrapping, gutters, and folds correctly.

### Editor tabs

The editor toolbar exposes four primary tabs:

- Brew tab: the main markdown document text.
- Style tab: custom CSS for the current brew.
- Snippet tab: reusable snippet definitions owned by the brew.
- Metadata tab: document properties, sharing/search metadata, authors, theme, language, and privacy settings.

Switching tabs preserves separate CodeMirror documents and undo history for each source view.

---

## Brew Markdown Editing

### Code editor foundation

The text, style, and snippet tabs use CodeMirror with:

- Line numbers.
- Soft tabs with two-space indentation.
- Line wrapping.
- Scroll-past-end behavior.
- Active-line styling support.
- Fold gutters.
- GFM mode for brew and snippet text.
- CSS mode for the Style tab.
- JavaScript mode loaded for editor support.

### Formatting keyboard shortcuts

The editor includes formatting shortcuts for common authoring operations:

- Bold.
- Italic.
- Underline.
- Superscript.
- Subscript.
- Non-breaking spaces.
- Width spacer blocks.
- Inline Homebrewery spans.
- Block Homebrewery divs.
- Markdown comments or CSS comments depending on the active editor.
- Links.
- Ordered and unordered lists.
- Heading levels 1 through 6.
- Page breaks.
- Column breaks.
- Code folding and unfolding.

The shortcuts operate on the current selection when text is selected and insert a useful wrapper or placeholder when no text is selected.

### Page and snippet line highlighting

The editor highlights structural lines to make long brews easier to navigate:

- Page breaks are highlighted and numbered in the source editor.
- Snippet breaks are highlighted and numbered in the snippet editor.
- V3 column breaks receive special source styling.
- Page count state is tracked from both cursor location and visible source scroll position.

### V3 syntax highlighting

For V3 renderer brews, the source editor adds additional visual cues for Homebrewery syntax:

- Definition list terms and descriptions.
- Definition-list separators.
- Superscript and subscript markup.
- Style injector blocks.
- Inline `{{ ... }}` spans.
- Block-level `{{ ... }}` wrappers.
- Emoji tokens.
- Page and column break commands.

This highlighting is editor-only and does not change saved brew text.

### Folding

Code folding is available for both brew markdown and CSS:

- Brew folding uses Homebrewery-specific page/block folding helpers.
- CSS folding uses Homebrewery CSS folding helpers.
- Fold previews use a short source excerpt, usually a heading or first meaningful line.
- Toolbar buttons can fold or unfold all foldable sections.

---

## Search and Replace

The editor overrides the default CodeMirror search behavior with a custom search panel.

The search panel supports:

- Opening with `Ctrl+F` or `Cmd+F`.
- Opening replace mode with `Ctrl+H` or `Cmd+H`.
- Prefilling the search box from the current selection when the selection is short.
- Live match highlighting.
- Match count and current-match position.
- Next and previous match navigation.
- Case-sensitive search toggle.
- Regex search toggle.
- Replace current match.
- Replace all matches.
- Enter for next match.
- Shift+Enter for previous match.
- Escape to close.

---

## Snippets

### Theme snippets

The snippet bar compiles snippets from the active renderer/theme bundle. Supported built-in snippet sources include:

- Legacy 5e PHB.
- V3 5e PHB.
- V3 5e DMG.
- V3 Journal.
- V3 Blank.
- V3 DungeonCraftAL.

Theme snippets are grouped into dropdown menus. Some groups are promoted into the upper editor toolbar for faster access, including:

- Text Editor.
- License.
- Images.
- Fonts.

### User brew snippets

Brews can define reusable snippets in the Snippet tab using `\snippet name` markers. These snippets are compiled into a "Brew Snippets" menu and can be inserted into the main brew text.

If a brew is used as a theme, its snippets can be inherited by child brews through the theme bundle.

### Snippet insertion behavior

When a snippet is inserted:

- The generated snippet text is injected at the current cursor or selection.
- Multi-line block snippets can wrap the selected text when their structure supports it.
- Snippet menus can include nested sub-snippets.
- Snippets can be marked experimental or disabled in the menu display.

---

## Markdown Converter and DOCX Import

The editor includes a Markdown Converter modal in the toolbar.

The converter supports:

- Pasting standard markdown into a conversion input.
- Loading `.md`, `.txt`, `.markdown`, or `.docx` files.
- Converting DOCX files to markdown in the browser before Homebrewery conversion.
- Target formats:
  - 5e PHB.
  - DungeonCraft AL.
  - Legacy.
  - Blank.
- Previewing the converted output.
- Editing the converted output before insertion.
- Inserting the converted text into the active editor.

This is especially useful for taking a plain adventure draft or imported Word document and transforming it into theme-specific Homebrewery markup.

---

## Style Editing

The Style tab lets each brew define custom CSS. The default placeholder explains that any CSS in the tab applies to the document.

Style editing includes:

- CSS syntax mode.
- Code folding.
- Undo and redo.
- Editor theme support.
- Injection into the preview iframe alongside the active theme styles.

The preview combines theme styles with the brew's custom CSS, then sanitizes the combined style payload before rendering it in the iframe.

---

## Metadata and Properties

The Metadata tab is the Properties Editor for a brew.

### Core fields

The properties editor includes:

- Title.
- Description.
- Thumbnail URL.
- Thumbnail preview with show/hide control.
- Tags.
- Adventure code.
- Adventure version.
- Language.
- Renderer.
- Theme.

### Renderer selection

The editor supports:

- Legacy renderer.
- V3 renderer.

Legacy brews use the legacy 5e PHB behavior. V3 brews can choose from available theme bundles.

### Theme selection

For V3 brews, the theme selector supports:

- Built-in themes.
- User themes provided through the app's theme data.
- Brews tagged as themes.
- Pasting a theme share URL or share ID.
- Theme preview imagery and texture thumbnails when available.

### Language selection

The language field sets the rendered page `lang` property. Supported language codes include:

- `en`
- `de`
- `de-ch`
- `fr`
- `ja`
- `es`
- `it`
- `sv`
- `ru`
- `zh-Hans`
- `zh-Hant`

This can affect browser behavior such as hyphenation or spellcheck.

### Tags

The tag editor supports unique tags and recognizes prefixes used elsewhere in the app:

- `type:`
- `system:`
- `group:`
- `meta:`

These prefixes are used for organization and can affect display on user pages or theme discovery.

### Authors and invitations

The metadata editor displays current authors and supports invited authors.

Invited author usernames are case-sensitive. After an invite is added, the invited user can receive the edit link and accept or decline access.

### Privacy

Brews can be published or unpublished.

Published brews are searchable in the Vault and visible on the user's page. Unpublished brews are not indexed in the Vault and are not visible on the user page, but they can still be shared directly and may still be indexed externally if the URL is available.

### Deletion behavior

The delete action adapts to ownership:

- If the current user is the only owner, deleting permanently removes the brew.
- If multiple authors exist, deleting removes the current user's editor access while leaving the brew available to other owners.

Both flows require confirmation.

---

## Live Preview

### Isolated iframe rendering

The preview renders inside an iframe. This protects the application shell from malformed brew content and keeps document styles scoped to the rendered brew.

The iframe loads:

- Core Homebrewery preview styles.
- Header navigation styles.
- Stat block styles.
- Willowlight styles.
- BRP styles.
- Palladium styles.
- The active theme styles.
- The brew's custom CSS.

### Renderer support

The preview supports both renderer modes:

- Legacy renderer: splits pages on legacy page break syntax and renders with the legacy markdown renderer.
- V3 renderer: splits on V3 page break syntax, applies page-level injected tags, renders V3 markdown, and appends a compatibility column break at the end of each page.

### Partial page rendering

For performance, the preview prioritizes:

- The page containing the editor cursor.
- Pages near the current preview position.
- Pages already rendered when the page count is stable.

When the page count changes, the preview rerenders the page collection.

### Render errors and warnings

The edit page validates raw brew text for unmatched or mismatched `div`, `span`, and `a` tags.

When validation errors exist:

- An error bar displays the render problems.
- The preview keeps the last valid rendered pages rather than replacing them with broken output.

The preview also includes render warnings and notification popups.

### Preview click-to-source navigation

Clicking meaningful preview content can jump the source editor to the matching text. The preview tries to identify useful elements such as:

- Paragraphs.
- List items.
- Headings.
- Blockquotes.
- Table cells.
- Definition list terms/descriptions.
- Preformatted blocks.

The editor searches within the clicked page first, then scrolls and flashes the matching source line.

### Source-to-preview navigation

The editor tracks page numbers from:

- Cursor position.
- Top visible editor line.
- Center page in the rendered preview.

When live scroll behavior is active, page changes can synchronize source and preview positions. Dedicated keyboard handling also supports jumping between source and brew page positions.

---

## Preview Toolbar

The preview toolbar provides document viewing controls.

### Visibility and header controls

The toolbar can:

- Hide or show the preview toolbar.
- Hide or show preview header navigation.

Toolbar visibility is persisted in local storage.

### Zoom controls

Zoom supports:

- Fill width.
- Fit entire page.
- Zoom out.
- Slider-based zoom.
- Zoom in.
- A 10 percent minimum.
- A 300 percent maximum.

Display options are saved in local storage.

### Spread controls

The preview can display pages as:

- Single page.
- Facing pages.
- Flowing pages.

Spread options include:

- Column gap.
- Row gap.
- Start first page on the right.
- Page shadow toggle.

### Page navigation

The toolbar displays the current page or visible page range and total page count. It includes:

- Previous page or previous visible page group.
- Editable page number input.
- Next page.
- Scroll-to-page behavior.

---

## Art Blocks

V3 markdown includes an `{{art ...}}` block extension for positioned image art.

An art block can define properties such as:

- `src`
- `x`
- `y`
- `w`
- `h`
- `anchor`
- `z`

The rendered art block becomes an absolutely positioned image with metadata used by the editor.

### Interactive art editing

The preview binds interactions to rendered art blocks:

- Hover outline.
- Click selection.
- Drag to reposition selected art.
- Corner handles to resize selected art.
- Escape to deselect.
- Click outside to deselect.

When the user moves or resizes an art block, the editor patches the corresponding source `{{art ...}}` block with updated `x`, `y`, `w`, and, when applicable, `h` values.

Supported units include:

- Inches.
- Centimeters.
- Pixels.
- Percentages.

---

## Embeds

### Stat block embeds

The V3 markdown renderer recognizes stat block embed syntax and transforms it into preview placeholders. The preview then fetches stat block data and injects rendered stat block HTML.

Supported embed families include:

- `{{statblock:ID}}`
- `{{statblock:ID|wide}}`
- `{{willowlight:ID}}`
- `{{willowlight:ID|bw}}`
- `{{brp:ID}}`
- `{{palladium:ID}}`
- `{{willowlight-sheet:ID|p1}}`
- `{{willowlight-sheet:ID|p2,bw}}`
- `{{brp-sheet:ID|p1}}`
- `{{brp-sheet:ID|p2,bw}}`

The preview batches stat block fetches through the stat block API and caches loaded records for the active preview session.

### In-editor stat block picker

The edit page includes a Stat Blocks toggle that swaps the preview pane for a D&D 5e stat block picker.

The picker supports:

- Fetching saved stat blocks.
- Searching by name or matching text.
- Filtering by creature type.
- Showing CR and creature classification.
- Inserting a narrow embed.
- Inserting a wide embed.
- Returning to preview mode.

Current planned work calls out in-editor pickers for BRP and Willowlight as future enhancements.

### Procedural image embeds

The V3 markdown renderer also recognizes procedural image embed syntax:

- `{{seal:shareId}}`
- `{{seal:shareId|size:large}}`
- `{{insignia:shareId}}`
- `{{icon:shareId}}`
- `{{heraldry:shareId}}`

The preview fetches procedural image metadata, then renders an image from the procedural image render API. Supported display sizes include default, small, and large.

---

## Saving, Autosave, and Version History

### Autosave

Autosave is enabled by default and stored in local storage.

When the brew changes:

- The editor compares the current brew with the last saved brew.
- If autosave is enabled, it schedules a save.
- Saves are debounced with a delay.
- The save button shows `auto-saved` when no unsaved changes remain.

### Manual save

Users can manually save by:

- Clicking `save now`.
- Pressing `Ctrl+S` or `Cmd+S`.

When autosave is disabled, the editor periodically warns if the user has unsaved changes.

### Before-unload protection

If unsaved changes exist, the browser receives a before-unload warning so users do not accidentally leave the page with unsaved work.

### Save payload behavior

The save flow:

- Validates HTML tag structure.
- Updates local version history.
- Runs version-history garbage collection.
- Normalizes brew text to NFC.
- Computes page count.
- Computes patches from the previous saved text.
- Computes a hash of the previous saved text.
- Sends a gzipped JSON payload to the update API.
- Updates `editId`, `shareId`, and `version` from the server response.
- Updates the browser URL to the saved edit route.

### Version history

The snippet bar includes a version history menu when local history exists.

The history menu shows recent saved versions with relative save times. Selecting a history item replaces the current brew text, style, and snippets with that version.

---

## Google Drive Storage

The editor can track whether the brew is stored in Google Drive.

The Google Drive control supports:

- Showing active or inactive Google Drive storage state.
- Prompting signed-out users to sign in before transferring storage.
- Asking for confirmation before moving a brew from Homebrewery storage to Google Drive.
- Asking for confirmation before moving a brew from Google Drive storage back to Homebrewery.
- Warning when a Google Drive brew is currently in the user's Trash folder.

---

## Sharing, Publishing, and Navigation

### Share menu

The share menu supports:

- Opening the public share view.
- Copying the share URL to the clipboard.
- Creating a Reddit submission link with the brew title and share URL.

Google-backed brews use a combined Google/share identifier when needed.

### Clone

The clone action creates a new brew with copied:

- Title, with `(clone)` appended.
- Text.
- Style.
- Snippets.
- Description.
- Tags.
- Systems.
- Language.
- Renderer.
- Theme.

The cloned brew opens in a new edit tab.

### Recent brews

The editor stores recent edit and view entries in local storage.

Recent lists:

- Keep up to eight entries per list.
- Include title, URL, and timestamp.
- Display relative times.
- Allow individual entries to be removed.

---

## Import and Export

### Print

The editor intercepts print shortcuts and print nav actions to print the preview iframe. It forces a reflow after printing to avoid disappearing out-of-view pages caused by print media repaint behavior.

### PDF export

When a brew has a share ID, the navbar can export:

- PDF.
- Flat PDF.

Flat PDF uses the PDF API with a `flatten=true` query parameter.

### Markdown export

Markdown export:

- Converts Homebrewery-specific wrappers toward plain markdown.
- Adds a top-level title.
- Adds the brew description when present.
- Downloads a `.md` file.

The conversion preserves some embed information as HTML comments when direct markdown equivalence is not available.

### DOCX export

DOCX export posts the current brew markdown to `/api/convert/docx` and downloads a `.docx` file.

### IDTT export

IDTT export posts the current brew markdown to `/api/convert/idtt` and downloads a `.txt` file containing InDesign Tagged Text output.

### Footer injection

The editor includes an `Inject Footers` action.

Before injection, it requires:

- Title.
- Adventure code.
- Adventure version.

When those fields are present, it rewrites the markdown with footer content derived from the brew metadata.

---

## Editor Appearance

The editor supports selectable CodeMirror themes.

The theme selector:

- Reads available themes from the built editor theme manifest.
- Applies the selected CodeMirror theme immediately.
- Saves the selected editor theme in local storage.
- Loads the corresponding CodeMirror theme stylesheet.

This setting affects the source editor only, not the rendered brew.

---

## AI Editing

The editor toolbar includes an AI edit action.

The current behavior is selection-based:

- The user selects text in the CodeMirror editor.
- The AI edit modal opens with the selected text.
- The modal returns replacement text.
- The editor replaces the selected text and refocuses CodeMirror.

The feature is scoped to editing selected prose or markup. It is separate from the planned brew content assistant described in the feature backlog.

---

## Supported Homebrewery Markup Highlights

The V3 markdown pipeline includes extensions for:

- GitHub-flavored markdown.
- Extended tables.
- Definition lists.
- Aligned paragraphs.
- Non-breaking spaces.
- Subscript and superscript text.
- Smart punctuation.
- GFM heading IDs.
- Variables and page-aware variables.
- Emoji and icon-font tokens.
- Inline `{{ ... }}` spans.
- Block `{{ ... }}` wrappers.
- Inline and block style injectors.
- Forced blank paragraph breaks using colon-only lines.
- Art blocks.
- Stat block embeds.
- Character sheet embeds.
- Procedural image embeds.
- Page and column break commands.

The legacy renderer remains available for older brews.

---

## Security and Resilience

The editor and preview include several containment and safety behaviors:

- Preview content renders in an iframe.
- Preview HTML and style payloads pass through a safe HTML layer before insertion.
- The editor validates basic HTML tag balance before rendering new output.
- Broken render output does not replace the last valid rendered pages.
- Internal preview anchor links scroll within the iframe instead of opening a new page.
- External preview links use the iframe base target behavior.
- Save payloads are compressed and include patch/hash data for server-side update handling.

---

## Planned or Known Gaps

The current feature backlog identifies the following brew-editor-specific planned work:

- Brew content assistant: a sidebar or slash command for generating boxed text, encounter descriptions, and room descriptions from bullet points.
- In-editor stat block pickers for BRP and Willowlight, matching the existing D&D 5e stat block picker.
- Scene illustration generation for the brew editor.

Adjacent backlog items that may affect the brew editor include:

- BRP and Willowlight stat block embed rendering parity.
- Batch export support from library pages.
- Additional game-system support.
- Additional theme and formatter work.

---

## Implementation Reference

Primary implementation files:

- `client/homebrew/pages/editPage/editPage.jsx`: edit page state, navbar, save flow, autosave, split-pane layout, preview/stat-block-picker toggle.
- `client/homebrew/editor/editor.jsx`: editor tabs, CodeMirror integration wrapper, custom highlighting, preview/source jump logic, AI edit modal, search panel, art-block patching.
- `client/components/codeEditor/codeEditor.jsx`: CodeMirror setup, keyboard shortcuts, folding, formatting commands, editor theme application.
- `client/homebrew/editor/snippetbar/snippetbar.jsx`: snippets, editor toolbar, undo/redo, history menu, converter modal, editor theme selector.
- `client/homebrew/editor/metadataEditor/metadataEditor.jsx`: properties editor, theme/language/tags/authors/privacy/delete controls.
- `client/homebrew/editor/searchPanel/searchPanel.jsx`: custom search and replace UI.
- `client/homebrew/brewRenderer/brewRenderer.jsx`: preview iframe, page rendering, renderer selection, theme/style injection, embed processing, preview click handling, art block interaction binding.
- `client/homebrew/brewRenderer/toolBar/toolBar.jsx`: preview zoom, spread, page navigation, and toolbar visibility controls.
- `client/homebrew/brewRenderer/artBlockInteraction.js`: interactive art block dragging and resizing.
- `client/homebrew/components/markdownConverter/converterPanel.jsx`: markdown and DOCX import/conversion modal.
- `client/homebrew/statblock/statblockPicker.jsx`: in-editor 5e stat block insertion picker.
- `shared/markdown.js`: V3 markdown extensions and embed preprocessing.
- `shared/markdownLegacy.js`: legacy markdown rendering.
- `shared/helpers.js`: theme bundle loading, snippet parsing, markdown export conversion, print handling.
- `client/homebrew/navbar/*.navitem.jsx`: save-adjacent navigation actions, exports, sharing, cloning, recents, footer injection, account/vault/new brew controls.

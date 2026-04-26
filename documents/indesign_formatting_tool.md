---
  md2docx.cjs — Markdown to Word (.docx)

  Converts Homebrewery-flavored Markdown into a .docx file with named Word paragraph styles, designed for importing into InDesign.

  Usage

  node md2docx.cjs input.md [output.docx]

  - If no output path is given, the output is written next to the input file with a .docx extension.
  - Requires the docx npm package (npm install docx).

  InDesign Workflow

  1. In InDesign, use File > Place to import the .docx
  2. In the import dialog, map Word styles to InDesign styles
  3. The mapping saves with the document for future imports

  Word → InDesign Style Mapping

  ┌─────────────────┬────────────────────┐
  │   Word Style    │   InDesign Style   │
  ├─────────────────┼────────────────────┤
  │ Normal          │ CoreBody           │
  ├─────────────────┼────────────────────┤
  │ Heading 1–5     │ Heading1–5         │
  ├─────────────────┼────────────────────┤
  │ List Bullet     │ CoreBulleted       │
  ├─────────────────┼────────────────────┤
  │ List Number     │ CoreNumberedList   │
  ├─────────────────┼────────────────────┤
  │ Sidebar Heading │ SidebarHeading     │
  ├─────────────────┼────────────────────┤
  │ Sidebar Body    │ SidebarBody        │
  ├─────────────────┼────────────────────┤
  │ Sidebar Bullets │ SidebarBodyBullets │
  ├─────────────────┼────────────────────┤
  │ Table Header    │ TABLE_HEADER       │
  ├─────────────────┼────────────────────┤
  │ Table Cell      │ TABLE_CELL         │
  └─────────────────┴────────────────────┘

  ---
  md2idtt.cjs — Markdown to InDesign Tagged Text

  Converts Homebrewery-flavored Markdown directly into InDesign Tagged Text (.txt), which preserves paragraph and character styles natively — no style mapping step needed.

  Usage

  node md2idtt.cjs input.md [output.txt]

  - If no output path is given, the output is written next to the input file with a .txt extension.
  - No external dependencies required (only fs and path).

  InDesign Workflow

  1. In InDesign, use File > Place and select the .txt file
  2. InDesign auto-detects the Tagged Text format and applies styles directly
  3. Paragraph and character styles must already exist in the InDesign document (or will be auto-created)

  Style Names (group:style format)

  ┌──────────────────┬───────────────────────────────────────┐
  │     Markdown     │            Paragraph Style            │
  ├──────────────────┼───────────────────────────────────────┤
  │ Body text        │ Body Text:CoreBody                    │
  ├──────────────────┼───────────────────────────────────────┤
  │ # – #####        │ Headings:Heading1 – Headings:Heading5 │
  ├──────────────────┼───────────────────────────────────────┤
  │ - item           │ Body Text:CoreBulleted                │
  ├──────────────────┼───────────────────────────────────────┤
  │ 1. item          │ Body Text:CoreNumberedList            │
  ├──────────────────┼───────────────────────────────────────┤
  │ {{note}} heading │ Sidebars:SidebarHeading               │
  ├──────────────────┼───────────────────────────────────────┤
  │ {{note}} body    │ Sidebars:SidebarBody                  │
  ├──────────────────┼───────────────────────────────────────┤
  │ {{note}} bullet  │ Sidebars:SidebarBodyBullets           │
  ├──────────────────┼───────────────────────────────────────┤
  │ Table header row │ Table:TABLE_HEADER                    │
  ├──────────────────┼───────────────────────────────────────┤
  │ Table body row   │ Table:TABLE_CELL                      │
  └──────────────────┴───────────────────────────────────────┘

  Character styles: Bold, Italic, BoldItalic, Code

  ---
  What Both Tools Handle

  ┌───────────────────────────────────────────────┬────────────────────────────────────────────┐
  │               Markdown Feature                │                  Behavior                  │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ \page                                         │ Page break                                 │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ \column                                       │ Column break (IDTT) / page break (docx)    │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ {{note}}, {{warning}}, {{example}}            │ Rendered as sidebar styles                 │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Other {{ }} blocks (e.g. {{pagenumber}})      │ Skipped                                    │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ ![image](...)                                 │ Skipped                                    │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ HTML comments <!-- -->                        │ Skipped                                    │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Horizontal rules ---                          │ Skipped                                    │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ **bold**, *italic*, `code`, ***bold-italic*** │ Inline formatting preserved                │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ [NPC:...] / [STAT...] placeholders            │ Emitted as placeholder text                │
  ├───────────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Tables                                        │ Each cell becomes its own styled paragraph │
  └───────────────────────────────────────────────┴────────────────────────────────────────────┘

  When to Use Which

  - md2idtt.cjs — Preferred. Styles apply automatically on import, no manual mapping. Output is a plain text file with IDTT tags. Unicode characters are auto-escaped to IDTT
  hex format.
  - md2docx.cjs — Use when you need a .docx for review/editing in Word before placing into InDesign, or if your workflow already uses Word-based style mapping.
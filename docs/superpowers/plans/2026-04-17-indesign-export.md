# InDesign Export (DOCX + IDTT) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing md2docx and md2idtt CLI converters as server API endpoints, accessible from both the landing page (standalone file upload) and the brew editor navbar (export current brew).

**Architecture:** Two POST endpoints (`/api/convert/docx` and `/api/convert/idtt`) accept `{ markdown, filename }` JSON and return binary files. The landing page gets a new tool card with two upload buttons. The brew editor gets two new navbar export items. The conversion logic is extracted from the existing `.cjs` scripts into ES module helpers that the API calls.

**Tech Stack:** Express router, `docx` npm package (already installed), plain string processing for IDTT, React components following existing navbar patterns.

---

### Task 1: Extract DOCX conversion logic into an ES module

**Files:**
- Create: `server/convert-docx.js`
- Reference: `md2docx.cjs`

- [ ] **Step 1: Create `server/convert-docx.js`**

This module exports a single function that takes a markdown string and returns a Buffer (the .docx file contents). It's a direct extraction of the logic from `md2docx.cjs`, converted from CommonJS to ESM.

```javascript
// server/convert-docx.js
// Markdown to .docx conversion — extracted from md2docx.cjs

import docx from 'docx';

const { Document, Packer, Paragraph, TextRun, PageBreak } = docx;

const HEADING_MAP = {
  1: 'Heading 1',
  2: 'Heading 2',
  3: 'Heading 3',
  4: 'Heading 4',
  5: 'Heading 5',
};

const RENDER_CALLOUTS = {
  note:    { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Bullets' },
  warning: { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Bullets' },
  example: { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Bullets' },
};

function parseInline(rawText) {
  if (!rawText) return [new TextRun('')];
  const runs = [];
  const pattern = /(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/gs;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(rawText)) !== null) {
    if (match.index > lastIndex)
      runs.push(new TextRun(rawText.slice(lastIndex, match.index)));
    if (match[1].startsWith('***'))
      runs.push(new TextRun({ text: match[2] || '', bold: true, italics: true }));
    else if (match[1].startsWith('**'))
      runs.push(new TextRun({ text: match[3] || '', bold: true }));
    else if (match[1].startsWith('*'))
      runs.push(new TextRun({ text: match[4] || '', italics: true }));
    else if (match[1].startsWith('`'))
      runs.push(new TextRun({ text: match[5] || '', font: 'Courier New' }));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length)
    runs.push(new TextRun(rawText.slice(lastIndex)));
  if (runs.length === 0)
    runs.push(new TextRun(''));

  return runs;
}

function styledPara(styleId, rawText) {
  return new Paragraph({ style: styleId, children: parseInline(rawText) });
}

export async function convertMarkdownToDocx(markdown) {
  const lines = markdown.split('\n');
  const paragraphs = [];

  let inCallout    = false;
  let calloutStyle = null;
  let skipBlock    = false;
  let inTable      = false;
  let firstRow     = true;
  let i            = 0;

  while (i < lines.length) {
    const raw     = lines[i];
    const trimmed = raw.trim();

    if (/^\\page\b/.test(trimmed)) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      i++; continue;
    }
    if (/^\\column\b/.test(trimmed)) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      i++; continue;
    }
    if (/^<!--/.test(trimmed)) { i++; continue; }
    if (/^!\[/.test(trimmed)) { i++; continue; }

    if (/^\{\{/.test(trimmed) && !inCallout && !skipBlock) {
      const tagMatch = trimmed.match(/^\{\{(\w+)/);
      const tag      = tagMatch ? tagMatch[1].toLowerCase() : '';
      if (tag === 'pagenumber') { i++; continue; }
      if (RENDER_CALLOUTS[tag]) { inCallout = true; calloutStyle = RENDER_CALLOUTS[tag]; }
      else                      { skipBlock = true; }
      i++; continue;
    }

    if (trimmed === '}}') {
      if (inCallout) { inCallout = false; calloutStyle = null; }
      if (skipBlock) { skipBlock = false; }
      i++; continue;
    }

    if (skipBlock) { i++; continue; }

    if (inCallout) {
      if (trimmed === '') { i++; continue; }
      if (trimmed.startsWith('|')) {
        if (!inTable) { inTable = true; firstRow = true; }
        if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
        trimmed.split('|').map(c => c.trim()).filter(Boolean)
          .forEach(cell => paragraphs.push(styledPara(firstRow ? 'SidebarHeading' : 'SidebarBody', cell)));
        i++; continue;
      } else { inTable = false; firstRow = true; }
      const hm = trimmed.match(/^(#+)\s+(.*)/);
      if (hm)                           paragraphs.push(styledPara(calloutStyle.heading, hm[2]));
      else if (/^[-*]\s/.test(trimmed)) paragraphs.push(styledPara(calloutStyle.bullet, trimmed.slice(2)));
      else                              paragraphs.push(styledPara(calloutStyle.body, trimmed));
      i++; continue;
    }

    const hm = trimmed.match(/^(#+)\s+(.*)/);
    if (hm) {
      const level = Math.min(hm[1].length, 5);
      paragraphs.push(styledPara(HEADING_MAP[level], hm[2]));
      i++; continue;
    }

    if (/^[-*]{3,}$/.test(trimmed)) { i++; continue; }

    if (trimmed.startsWith('|')) {
      if (!inTable) { inTable = true; firstRow = true; }
      if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
      trimmed.split('|').map(c => c.trim()).filter(Boolean)
        .forEach(cell => paragraphs.push(styledPara(firstRow ? 'Table Header' : 'Table Cell', cell)));
      i++; continue;
    } else { inTable = false; firstRow = true; }

    if (/^[-*]\s/.test(trimmed)) {
      paragraphs.push(styledPara('List Bullet', trimmed.slice(2)));
      i++; continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      paragraphs.push(styledPara('List Number', trimmed.replace(/^\d+\.\s/, '')));
      i++; continue;
    }

    if (/^\[NPC:|^\[STAT/.test(trimmed)) {
      paragraphs.push(styledPara('Normal', `[[ STAT BLOCK: ${trimmed} ]]`));
      i++; continue;
    }

    if (trimmed === '') { i++; continue; }

    paragraphs.push(styledPara('Normal', trimmed));
    i++;
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: 'Normal',           name: 'Normal' },
        { id: 'Heading 1',       name: 'Heading 1',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 36 } },
        { id: 'Heading 2',       name: 'Heading 2',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 28 } },
        { id: 'Heading 3',       name: 'Heading 3',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 24 } },
        { id: 'Heading 4',       name: 'Heading 4',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 22 } },
        { id: 'Heading 5',       name: 'Heading 5',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 20 } },
        { id: 'List Bullet',     name: 'List Bullet',     basedOn: 'Normal' },
        { id: 'List Number',     name: 'List Number',     basedOn: 'Normal' },
        { id: 'Sidebar Heading', name: 'Sidebar Heading', basedOn: 'Normal', run: { bold: true } },
        { id: 'Sidebar Body',    name: 'Sidebar Body',    basedOn: 'Normal' },
        { id: 'Sidebar Bullets', name: 'Sidebar Bullets', basedOn: 'Normal' },
        { id: 'Table Header',    name: 'Table Header',    basedOn: 'Normal', run: { bold: true } },
        { id: 'Table Cell',      name: 'Table Cell',      basedOn: 'Normal' },
      ],
    },
    sections: [{ children: paragraphs }],
  });

  return Packer.toBuffer(doc);
}
```

- [ ] **Step 2: Verify the module loads**

Run: `node -e "import('./server/convert-docx.js').then(m => console.log(typeof m.convertMarkdownToDocx))"`
Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add server/convert-docx.js
git commit -m "feat: extract DOCX conversion logic into ES module"
```

---

### Task 2: Extract IDTT conversion logic into an ES module

**Files:**
- Create: `server/convert-idtt.js`
- Reference: `md2idtt.cjs`

- [ ] **Step 1: Create `server/convert-idtt.js`**

This module exports a single function that takes a markdown string and returns a Buffer (the IDTT file contents in latin1 encoding).

```javascript
// server/convert-idtt.js
// Markdown to InDesign Tagged Text — extracted from md2idtt.cjs

const HEADING_MAP = {
  1: 'Headings:Heading1',
  2: 'Headings:Heading2',
  3: 'Headings:Heading3',
  4: 'Headings:Heading4',
  5: 'Headings:Heading5',
};

const RENDER_CALLOUTS = {
  note:    { heading: 'Sidebars:SidebarHeading', body: 'Sidebars:SidebarBody', bullet: 'Sidebars:SidebarBodyBullets' },
  warning: { heading: 'Sidebars:SidebarHeading', body: 'Sidebars:SidebarBody', bullet: 'Sidebars:SidebarBodyBullets' },
  example: { heading: 'Sidebars:SidebarHeading', body: 'Sidebars:SidebarBody', bullet: 'Sidebars:SidebarBodyBullets' },
};

function encodeForIDTT(text) {
  if (text == null) return '';
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp === 0x3C) {
      out += '<0x003C>';
    } else if (cp > 0xFF) {
      out += `<0x${cp.toString(16).toUpperCase().padStart(4, '0')}>`;
    } else {
      out += ch;
    }
  }
  return out;
}

function processInline(rawText) {
  if (!rawText) return '';
  const result  = [];
  const pattern = /(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/gs;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(rawText)) !== null) {
    if (match.index > lastIndex)
      result.push(encodeForIDTT(rawText.slice(lastIndex, match.index)));
    if (match[1].startsWith('***'))
      result.push(`<CharStyle:BoldItalic>${encodeForIDTT(match[2])}<CharStyle:>`);
    else if (match[1].startsWith('**'))
      result.push(`<CharStyle:Bold>${encodeForIDTT(match[3])}<CharStyle:>`);
    else if (match[1].startsWith('*'))
      result.push(`<CharStyle:Italic>${encodeForIDTT(match[4])}<CharStyle:>`);
    else if (match[1].startsWith('`'))
      result.push(`<CharStyle:Code>${encodeForIDTT(match[5])}<CharStyle:>`);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < rawText.length)
    result.push(encodeForIDTT(rawText.slice(lastIndex)));
  return result.join('');
}

function para(style, rawText) {
  return `<ParaStyle:${style}>${processInline(rawText)}`;
}

export function convertMarkdownToIdtt(markdown) {
  const lines  = markdown.split('\n');
  const output = [];

  output.push('<ANSI-WIN>');
  output.push('<Version:8><FeatureSet:InDesign-Roman>');

  let inCallout    = false;
  let calloutStyle = null;
  let skipBlock    = false;
  let inTable      = false;
  let firstRow     = true;
  let i            = 0;

  while (i < lines.length) {
    const raw     = lines[i];
    const trimmed = raw.trim();

    if (/^\\page\b/.test(trimmed))   { output.push('<ParaStyle:Body Text:CoreBody><0x000C>'); i++; continue; }
    if (/^\\column\b/.test(trimmed)) { output.push('<ParaStyle:Body Text:CoreBody><0x000E>'); i++; continue; }
    if (/^<!--/.test(trimmed)) { i++; continue; }
    if (/^!\[/.test(trimmed)) { i++; continue; }

    if (/^\{\{/.test(trimmed) && !inCallout && !skipBlock) {
      const tagMatch = trimmed.match(/^\{\{(\w+)/);
      const tag      = tagMatch ? tagMatch[1].toLowerCase() : '';
      if (tag === 'pagenumber') { i++; continue; }
      if (RENDER_CALLOUTS[tag]) { inCallout = true; calloutStyle = RENDER_CALLOUTS[tag]; }
      else                      { skipBlock = true; }
      i++; continue;
    }

    if (trimmed === '}}') {
      if (inCallout) { inCallout = false; calloutStyle = null; }
      if (skipBlock) { skipBlock = false; }
      i++; continue;
    }

    if (skipBlock) { i++; continue; }

    if (inCallout) {
      if (trimmed === '') { i++; continue; }
      if (trimmed.startsWith('|')) {
        if (!inTable) { inTable = true; firstRow = true; }
        if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
        trimmed.split('|').map(c => c.trim()).filter(Boolean)
          .forEach(cell => output.push(para(firstRow ? 'SidebarHeading' : 'SidebarBody', cell)));
        i++; continue;
      } else { inTable = false; firstRow = true; }
      const hm = trimmed.match(/^(#+)\s+(.*)/);
      if (hm)                           output.push(para(calloutStyle.heading, hm[2]));
      else if (/^[-*]\s/.test(trimmed)) output.push(para(calloutStyle.bullet, trimmed.slice(2)));
      else                              output.push(para(calloutStyle.body, trimmed));
      i++; continue;
    }

    const hm = trimmed.match(/^(#+)\s+(.*)/);
    if (hm) {
      output.push(para(HEADING_MAP[Math.min(hm[1].length, 5)], hm[2]));
      i++; continue;
    }

    if (/^[-*]{3,}$/.test(trimmed)) { i++; continue; }

    if (trimmed.startsWith('|')) {
      if (!inTable) { inTable = true; firstRow = true; }
      if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
      trimmed.split('|').map(c => c.trim()).filter(Boolean)
        .forEach(cell => output.push(para(firstRow ? 'Table:TABLE_HEADER' : 'Table:TABLE_CELL', cell)));
      i++; continue;
    } else { inTable = false; firstRow = true; }

    if (/^[-*]\s/.test(trimmed)) {
      output.push(para('Body Text:CoreBulleted', trimmed.slice(2)));
      i++; continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      output.push(para('Body Text:CoreNumberedList', trimmed.replace(/^\d+\.\s/, '')));
      i++; continue;
    }

    if (/^\[NPC:|^\[STAT/.test(trimmed)) {
      output.push(`<ParaStyle:Body Text:CoreBody>[[ STAT BLOCK: ${encodeForIDTT(trimmed)} ]]`);
      i++; continue;
    }

    if (trimmed === '') { i++; continue; }

    output.push(para('Body Text:CoreBody', trimmed));
    i++;
  }

  const joined = output.join('\r\n') + '\r\n';
  return Buffer.from(joined, 'latin1');
}
```

- [ ] **Step 2: Verify the module loads**

Run: `node -e "import('./server/convert-idtt.js').then(m => console.log(typeof m.convertMarkdownToIdtt))"`
Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add server/convert-idtt.js
git commit -m "feat: extract IDTT conversion logic into ES module"
```

---

### Task 3: Create the convert API router

**Files:**
- Create: `server/convert.api.js`
- Modify: `server/app.js:177-190` (register the router)

- [ ] **Step 1: Create `server/convert.api.js`**

```javascript
// server/convert.api.js
// API endpoints for Markdown → DOCX and Markdown → IDTT conversion

import express      from 'express';
import asyncHandler from 'express-async-handler';
import { convertMarkdownToDocx } from './convert-docx.js';
import { convertMarkdownToIdtt } from './convert-idtt.js';

const router = express.Router();

router.post('/api/convert/docx', asyncHandler(async (req, res) => {
  const { markdown, filename = 'export' } = req.body;
  if (!markdown) return res.status(400).json({ error: 'markdown field is required' });

  const buffer = await convertMarkdownToDocx(markdown);
  res.set({
    'Content-Type'        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition' : `attachment; filename="${encodeURIComponent(filename)}.docx"`,
    'Content-Length'      : buffer.length,
    'Cache-Control'       : 'no-cache'
  });
  res.status(200).end(buffer);
}));

router.post('/api/convert/idtt', asyncHandler(async (req, res) => {
  const { markdown, filename = 'export' } = req.body;
  if (!markdown) return res.status(400).json({ error: 'markdown field is required' });

  const buffer = convertMarkdownToIdtt(markdown);
  res.set({
    'Content-Type'        : 'text/plain; charset=windows-1252',
    'Content-Disposition' : `attachment; filename="${encodeURIComponent(filename)}.txt"`,
    'Content-Length'      : buffer.length,
    'Cache-Control'       : 'no-cache'
  });
  res.status(200).end(buffer);
}));

export default router;
```

- [ ] **Step 2: Register the router in `server/app.js`**

Add the import at the top with the other API imports (around line 31):

```javascript
import convertApi from './convert.api.js';
```

Add the router registration after line 190 (`app.use(pdfApi);`):

```javascript
app.use(convertApi);
```

- [ ] **Step 3: Test the endpoints with curl**

Start the dev server, then in another terminal:

```bash
curl -X POST http://localhost:8000/api/convert/docx \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello\n\nThis is a test.", "filename": "test"}' \
  -o test-output.docx

curl -X POST http://localhost:8000/api/convert/idtt \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello\n\nThis is a test.", "filename": "test"}' \
  -o test-output.txt
```

Expected: Both files download successfully. `test-output.docx` opens in Word. `test-output.txt` starts with `<ANSI-WIN>`.

- [ ] **Step 4: Commit**

```bash
git add server/convert.api.js server/app.js
git commit -m "feat: add /api/convert/docx and /api/convert/idtt endpoints"
```

---

### Task 4: Add the InDesign Export card to the landing page

**Files:**
- Modify: `client/homebrew/pages/landingPage/landingPage.jsx`
- Modify: `client/homebrew/pages/landingPage/landingPage.less`

- [ ] **Step 1: Add the tool card to `landingPage.jsx`**

Add `useState` to the React import at line 2:

```javascript
import React, { useState, useRef } from 'react';
```

Add the converter logic and card inside the `LandingPage` component. Replace the entire component body (lines 8-161) with:

```jsx
const LandingPage = ()=>{
	const [converting, setConverting] = useState(false);
	const docxInputRef = useRef(null);
	const idttInputRef = useRef(null);

	const handleConvert = async (file, format)=>{
		if(converting || !file) return;
		setConverting(true);
		try {
			const markdown = await file.text();
			const basename = file.name.replace(/\.[^.]+$/, '');
			const res = await fetch(`/api/convert/${format}`, {
				method  : 'POST',
				headers : { 'Content-Type': 'application/json' },
				body    : JSON.stringify({ markdown, filename: basename })
			});
			if(!res.ok) throw new Error(`Conversion failed: ${res.status}`);
			const blob = await res.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = `${basename}.${format === 'docx' ? 'docx' : 'txt'}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error('Conversion failed:', err);
			alert(`Conversion failed: ${err.message}`);
		} finally {
			setConverting(false);
		}
	};

	return (
		<div className="landingPage">
			<Navbar>
				<Nav.section>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="landingContent">
				<div className="landingTitle">
					<h1><strong>Mount Ogden</strong> Gaming Company Toolkit</h1>
					<p>Build characters, stat blocks, and adventures for any tabletop RPG</p>
				</div>

				{/* ── Game Systems (alphabetical) ──────────────────────── */}
				<div className="toolRow">
					<h2 className="rowTitle">Game Systems</h2>
					<div className="toolCards">
						{/* ... existing game system cards unchanged ... */}
					</div>
				</div>

				{/* ── Tools (alphabetical) ─────────────────────────────── */}
				<div className="toolRow">
					<h2 className="rowTitle">Tools</h2>
					<div className="toolCards">
						{/* ... existing tool cards ... */}

						{/* NEW — InDesign Export card, inserted alphabetically after Handout Generator */}
						<div className="toolCard indesignCard">
							<div className="toolIcon">
								<i className="fas fa-file-export" />
							</div>
							<h3 className="toolName">InDesign Export</h3>
							<p className="toolDesc">
								Convert Markdown files to Word (.docx) or InDesign
								Tagged Text for professional print layout.
							</p>
							<div className="convertButtons">
								<button
									className="convertBtn"
									disabled={converting}
									onClick={()=>docxInputRef.current?.click()}
								>
									<i className="fas fa-file-word" /> {converting ? 'Converting...' : 'Upload .docx'}
								</button>
								<button
									className="convertBtn"
									disabled={converting}
									onClick={()=>idttInputRef.current?.click()}
								>
									<i className="fas fa-file-alt" /> {converting ? 'Converting...' : 'Upload IDTT'}
								</button>
							</div>
							<input
								ref={docxInputRef}
								type="file"
								accept=".md,.txt,.markdown"
								style={{ display: 'none' }}
								onChange={(e)=>{
									handleConvert(e.target.files[0], 'docx');
									e.target.value = '';
								}}
							/>
							<input
								ref={idttInputRef}
								type="file"
								accept=".md,.txt,.markdown"
								style={{ display: 'none' }}
								onChange={(e)=>{
									handleConvert(e.target.files[0], 'idtt');
									e.target.value = '';
								}}
							/>
						</div>

						{/* ... remaining tool cards ... */}
					</div>
				</div>

				{/* ... quick links unchanged ... */}
			</div>
		</div>
	);
};
```

Note: The existing Game Systems cards and other Tool cards stay exactly as-is. The InDesign Export card is inserted alphabetically in the Tools section (after Handout Generator, before Map Generator).

- [ ] **Step 2: Add styles for the convert buttons in `landingPage.less`**

Add inside the `.toolCard` rule block (after the `.toolDesc` rule, around line 109):

```less
&.indesignCard {
    cursor: default;

    &:hover {
        transform: translateY(-4px);
        border-color: #8B1A1A;
        box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    }
}

.convertButtons {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    width: 100%;
}

.convertBtn {
    flex: 1;
    padding: 8px 12px;
    background: #1a1a2e;
    border: 1px solid #3a3a54;
    border-radius: 6px;
    color: #f5e6c8;
    font-family: 'Segoe UI', sans-serif;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;

    i { margin-right: 4px; }

    &:hover {
        background: #2a2a44;
        border-color: #8B1A1A;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}
```

- [ ] **Step 3: Verify the landing page renders**

Start the dev server, navigate to `http://localhost:8000/`. The InDesign Export card should appear in the Tools row with two buttons. Clicking each should open a file picker for `.md` files.

- [ ] **Step 4: Commit**

```bash
git add client/homebrew/pages/landingPage/landingPage.jsx client/homebrew/pages/landingPage/landingPage.less
git commit -m "feat: add InDesign Export card to landing page with upload buttons"
```

---

### Task 5: Add DOCX and IDTT export nav items to the brew editor

**Files:**
- Create: `client/homebrew/navbar/exportDocx.navitem.jsx`
- Create: `client/homebrew/navbar/exportIdtt.navitem.jsx`
- Modify: `client/homebrew/pages/editPage/editPage.jsx:25,375-378`

- [ ] **Step 1: Create `client/homebrew/navbar/exportDocx.navitem.jsx`**

```jsx
import React, { useState } from 'react';
import Nav from './nav.jsx';

const ExportDocxNavItem = ({ markdown, name = 'export' })=>{
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async ()=>{
		if(isExporting || !markdown) return;
		setIsExporting(true);

		try {
			const res = await fetch('/api/convert/docx', {
				method  : 'POST',
				headers : { 'Content-Type': 'application/json' },
				body    : JSON.stringify({ markdown, filename: name })
			});
			if(!res.ok) throw new Error(`Export failed: ${res.status}`);

			const blob = await res.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = `${name}.docx`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error('DOCX export failed:', err);
			alert(`DOCX export failed: ${err.message}`);
		} finally {
			setIsExporting(false);
		}
	};

	if(!markdown) return null;

	return <Nav.item
		icon={isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-word'}
		color='blue'
		onClick={handleExport}
	>
		{isExporting ? 'Exporting...' : 'Export DOCX'}
	</Nav.item>;
};

export default ExportDocxNavItem;
```

- [ ] **Step 2: Create `client/homebrew/navbar/exportIdtt.navitem.jsx`**

```jsx
import React, { useState } from 'react';
import Nav from './nav.jsx';

const ExportIdttNavItem = ({ markdown, name = 'export' })=>{
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async ()=>{
		if(isExporting || !markdown) return;
		setIsExporting(true);

		try {
			const res = await fetch('/api/convert/idtt', {
				method  : 'POST',
				headers : { 'Content-Type': 'application/json' },
				body    : JSON.stringify({ markdown, filename: name })
			});
			if(!res.ok) throw new Error(`Export failed: ${res.status}`);

			const blob = await res.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = `${name}.txt`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error('IDTT export failed:', err);
			alert(`IDTT export failed: ${err.message}`);
		} finally {
			setIsExporting(false);
		}
	};

	if(!markdown) return null;

	return <Nav.item
		icon={isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-file-alt'}
		color='green'
		onClick={handleExport}
	>
		{isExporting ? 'Exporting...' : 'Export IDTT'}
	</Nav.item>;
};

export default ExportIdttNavItem;
```

- [ ] **Step 3: Wire the nav items into `editPage.jsx`**

Add imports alongside the existing ExportPdfNavItem import (around line 25):

```javascript
import ExportDocxNavItem from '@navbar/exportDocx.navitem.jsx';
import ExportIdttNavItem from '@navbar/exportIdtt.navitem.jsx';
```

Add the nav items right after the ExportPdfNavItem (after line 378):

```jsx
<ExportDocxNavItem
    markdown={currentBrew.text}
    name={currentBrew.title || 'brew-export'}
/>
<ExportIdttNavItem
    markdown={currentBrew.text}
    name={currentBrew.title || 'brew-export'}
/>
```

- [ ] **Step 4: Verify in the brew editor**

Start the dev server, navigate to `http://localhost:8000/new`, type some markdown, then check the navbar. The Export DOCX and Export IDTT buttons should appear. Clicking each should download the converted file.

- [ ] **Step 5: Commit**

```bash
git add client/homebrew/navbar/exportDocx.navitem.jsx client/homebrew/navbar/exportIdtt.navitem.jsx client/homebrew/pages/editPage/editPage.jsx
git commit -m "feat: add DOCX and IDTT export buttons to brew editor navbar"
```

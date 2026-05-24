# Footer Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users define adventure code and version in brew properties, then press a button to inject standardized AL footers and page numbers across all pages.

**Architecture:** Add `adventureCode` and `adventureVersion` metadata fields to the Properties Editor. Create a pure function that takes markdown text + metadata and returns markdown with footers injected. Wire it up via a new navbar button that reads the current brew state and updates the text.

**Tech Stack:** React, existing Homebrewery component patterns

---

## File Structure

| File | Responsibility |
|---|---|
| `client/homebrew/editor/metadataEditor/metadataEditor.jsx` | Add adventureCode + adventureVersion fields (modify) |
| `client/homebrew/navbar/injectFooters.js` | Pure function: takes markdown + metadata, returns markdown with footers (create) |
| `client/homebrew/navbar/injectFooters.spec.js` | Tests for the pure function (create) |
| `client/homebrew/navbar/injectFooters.navitem.jsx` | Navbar button component (create) |
| `client/homebrew/pages/editPage/editPage.jsx` | Import and render the navbar item (modify) |

---

### Task 1: Add metadata fields to Properties Editor

**Files:**
- Modify: `client/homebrew/editor/metadataEditor/metadataEditor.jsx:353-355`

- [ ] **Step 1: Add the adventure code and version fields**

In `metadataEditor.jsx`, after the closing `</div>` of the `tags` field (line 353) and before `{this.renderLanguageDropdown()}` (line 356), add:

```jsx
			<div className='field adventureCode'>
				<label>adventure code</label>
				<input type='text' className='value'
					defaultValue={this.props.metadata.adventureCode}
					placeholder='FR-DC-XXX-XX'
					onChange={(e)=>this.handleFieldChange('adventureCode', e)} />
			</div>
			<div className='field adventureVersion'>
				<label>adventure version</label>
				<input type='text' className='value'
					defaultValue={this.props.metadata.adventureVersion}
					placeholder='v1.0'
					onChange={(e)=>this.handleFieldChange('adventureVersion', e)} />
			</div>
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/homebrew/editor/metadataEditor/metadataEditor.jsx
git commit -m "feat: add adventureCode and adventureVersion metadata fields"
```

---

### Task 2: Create the footer injection function (TDD)

**Files:**
- Create: `client/homebrew/navbar/injectFooters.js`
- Test: `client/homebrew/navbar/injectFooters.spec.js`

- [ ] **Step 1: Write the failing tests**

Create `client/homebrew/navbar/injectFooters.spec.js`:

```js
import { injectFooters } from './injectFooters.js';

describe('injectFooters', ()=>{
	const metadata = {
		title            : 'The Lost Temple',
		adventureCode    : 'FR-DC-ABC-01',
		adventureVersion : 'v1.0',
	};

	const footer = `{{footnote\nNot for resale. Permission granted to print or photocopy this document for personal use only.\n\nFR-DC-ABC-01 The Lost Temple (v1.0)\n}}\n\n{{pageNumber,auto}}`;

	it('appends footer to a single page with no existing footer', ()=>{
		const input = '# Chapter 1\n\nSome text.';
		const result = injectFooters(input, metadata);
		expect(result).toBe(`# Chapter 1\n\nSome text.\n\n${footer}`);
	});

	it('appends footer to each page in a multi-page document', ()=>{
		const input = '# Page 1\n\nText.\n\n\\page\n\n# Page 2\n\nMore text.';
		const result = injectFooters(input, metadata);
		expect(result).toBe(`# Page 1\n\nText.\n\n${footer}\n\n\\page\n\n# Page 2\n\nMore text.\n\n${footer}`);
	});

	it('replaces existing {{footnote}} and {{pageNumber,auto}} blocks', ()=>{
		const input = '# Chapter 1\n\nText.\n\n{{footnote\nOld footer content.\n}}\n\n{{pageNumber,auto}}';
		const result = injectFooters(input, metadata);
		expect(result).toBe(`# Chapter 1\n\nText.\n\n${footer}`);
	});

	it('replaces existing footers on multiple pages', ()=>{
		const page1 = '# Page 1\n\nText.\n\n{{footnote\nOld.\n}}\n\n{{pageNumber,auto}}';
		const page2 = '# Page 2\n\nMore.\n\n{{footnote\nAlso old.\n}}\n\n{{pageNumber,auto}}';
		const input = `${page1}\n\n\\page\n\n${page2}`;
		const result = injectFooters(input, metadata);
		expect(result).toBe(`# Page 1\n\nText.\n\n${footer}\n\n\\page\n\n# Page 2\n\nMore.\n\n${footer}`);
	});

	it('returns null with missing title', ()=>{
		const result = injectFooters('text', { ...metadata, title: '' });
		expect(result).toBeNull();
	});

	it('returns null with missing adventureCode', ()=>{
		const result = injectFooters('text', { ...metadata, adventureCode: '' });
		expect(result).toBeNull();
	});

	it('returns null with missing adventureVersion', ()=>{
		const result = injectFooters('text', { ...metadata, adventureVersion: '' });
		expect(result).toBeNull();
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest client/homebrew/navbar/injectFooters.spec.js --verbose
```

Expected: FAIL — `Cannot find module './injectFooters.js'`

- [ ] **Step 3: Write the implementation**

Create `client/homebrew/navbar/injectFooters.js`:

```js
const FOOTNOTE_RE = /\n*\{\{footnote[\s\S]*?\}\}\s*/g;
const PAGENUM_RE = /\n*\{\{pageNumber,auto\}\}\s*/g;

export function injectFooters(markdown, metadata) {
	const { title, adventureCode, adventureVersion } = metadata;
	if(!title || !adventureCode || !adventureVersion) return null;

	const footer =
		`{{footnote\n` +
		`Not for resale. Permission granted to print or photocopy this document for personal use only.\n` +
		`\n` +
		`${adventureCode} ${title} (${adventureVersion})\n` +
		`}}\n\n` +
		`{{pageNumber,auto}}`;

	const pages = markdown.split(/\n\n\\page\n\n/);

	const processed = pages.map((page)=>{
		let cleaned = page
			.replace(FOOTNOTE_RE, '')
			.replace(PAGENUM_RE, '')
			.trimEnd();
		return `${cleaned}\n\n${footer}`;
	});

	return processed.join('\n\n\\page\n\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest client/homebrew/navbar/injectFooters.spec.js --verbose
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add client/homebrew/navbar/injectFooters.js client/homebrew/navbar/injectFooters.spec.js
git commit -m "feat: add injectFooters pure function with tests"
```

---

### Task 3: Create the Inject Footers navbar button

**Files:**
- Create: `client/homebrew/navbar/injectFooters.navitem.jsx`

- [ ] **Step 1: Create the navbar item component**

Create `client/homebrew/navbar/injectFooters.navitem.jsx`:

```jsx
import React from 'react';
import Nav from './nav.jsx';
import { injectFooters } from './injectFooters.js';

const InjectFootersNavItem = ({ markdown, metadata, onTextChange })=>{
	const handleClick = ()=>{
		if(!markdown) return;

		const missing = [];
		if(!metadata.title) missing.push('title');
		if(!metadata.adventureCode) missing.push('adventure code');
		if(!metadata.adventureVersion) missing.push('adventure version');

		if(missing.length) {
			alert(`Please fill in the following fields in the Properties Editor first:\n\n${missing.join('\n')}`);
			return;
		}

		const result = injectFooters(markdown, metadata);
		if(result) onTextChange(result);
	};

	if(!markdown) return null;

	return <Nav.item
		icon='fas fa-shoe-prints'
		color='green'
		onClick={handleClick}
	>
		Inject Footers
	</Nav.item>;
};

export default InjectFootersNavItem;
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds (component is created but not yet rendered anywhere).

- [ ] **Step 3: Commit**

```bash
git add client/homebrew/navbar/injectFooters.navitem.jsx
git commit -m "feat: add InjectFootersNavItem component"
```

---

### Task 4: Wire up the navbar button in editPage

**Files:**
- Modify: `client/homebrew/pages/editPage/editPage.jsx`

- [ ] **Step 1: Add the import**

In `editPage.jsx`, after line 27 (`import ExportIdttNavItem`), add:

```jsx
import InjectFootersNavItem      from '@navbar/injectFooters.navitem.jsx';
```

- [ ] **Step 2: Add the component to the navbar**

In `editPage.jsx`, after the `ExportIdttNavItem` block (after line 388), add:

```jsx
				<InjectFootersNavItem
					markdown={currentBrew.text}
					metadata={currentBrew}
					onTextChange={handleBrewChange('text')}
				/>
```

- [ ] **Step 3: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/homebrew/pages/editPage/editPage.jsx
git commit -m "feat: wire InjectFootersNavItem into edit page navbar"
```

---

### Task 5: Manual integration test

- [ ] **Step 1: Start the dev server**

```bash
npm run start
```

- [ ] **Step 2: Test metadata fields**

1. Open `http://localhost:8000`, create or open a brew
2. Open the Properties Editor
3. Verify the "adventure code" and "adventure version" fields appear after tags
4. Enter `FR-DC-TEST-01` and `v1.0`

- [ ] **Step 3: Test footer injection**

1. Write a multi-page brew with `\page` breaks and no footers
2. Click "Inject Footers" in the navbar
3. Verify each page now has the footer block with correct code, title, and version
4. Verify `{{pageNumber,auto}}` appears on each page

- [ ] **Step 4: Test footer replacement**

1. Click "Inject Footers" again (footers already exist)
2. Verify footers are replaced cleanly, not duplicated

- [ ] **Step 5: Test missing fields**

1. Clear the adventure code field in Properties Editor
2. Click "Inject Footers"
3. Verify an alert appears listing "adventure code" as missing

- [ ] **Step 6: Test DOCX export**

1. Re-fill the adventure code and inject footers
2. Click "Export DOCX"
3. Open the exported `.docx` and verify the footer text appears in the document

- [ ] **Step 7: Commit any fixes if needed**

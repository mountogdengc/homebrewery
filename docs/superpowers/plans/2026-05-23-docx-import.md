# DOCX Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to load `.docx` files (e.g. from Google Docs) into the Markdown Converter panel, converting them to markdown so they can be transformed into DungeonCraftAL format and re-exported as a properly styled `.docx`.

**Architecture:** Add `mammoth` as a dependency for client-side `.docx`-to-markdown conversion. Modify the converter panel's file handler to detect `.docx` files and route them through mammoth before placing the markdown in the textarea. No server changes.

**Tech Stack:** mammoth.js (browser build), React

---

### Task 1: Install mammoth dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install mammoth**

```bash
npm install mammoth
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('mammoth'); console.log('mammoth OK')"
```

Expected: `mammoth OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add mammoth dependency for docx import"
```

---

### Task 2: Add docx-to-markdown helper

**Files:**
- Create: `client/homebrew/components/markdownConverter/docxToMarkdown.js`
- Test: `client/homebrew/components/markdownConverter/docxToMarkdown.spec.js`

- [ ] **Step 1: Write the failing test**

Create `client/homebrew/components/markdownConverter/docxToMarkdown.spec.js`:

```js
import { docxToMarkdown } from './docxToMarkdown.js';

// mammoth is mocked — we're testing our wrapper logic, not mammoth itself
jest.mock('mammoth', ()=>({
	convertToMarkdown: jest.fn()
}));
import mammoth from 'mammoth';

describe('docxToMarkdown', ()=>{
	beforeEach(()=>{
		jest.resetAllMocks();
	});

	it('passes arrayBuffer to mammoth and returns the markdown value', async ()=>{
		mammoth.convertToMarkdown.mockResolvedValue({ value: '# Hello\n\nWorld' });
		const buf = new ArrayBuffer(8);
		const result = await docxToMarkdown(buf);
		expect(mammoth.convertToMarkdown).toHaveBeenCalledWith({ arrayBuffer: buf });
		expect(result).toBe('# Hello\n\nWorld');
	});

	it('throws when mammoth rejects', async ()=>{
		mammoth.convertToMarkdown.mockRejectedValue(new Error('bad file'));
		const buf = new ArrayBuffer(8);
		await expect(docxToMarkdown(buf)).rejects.toThrow('bad file');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest client/homebrew/components/markdownConverter/docxToMarkdown.spec.js --verbose
```

Expected: FAIL — `Cannot find module './docxToMarkdown.js'`

- [ ] **Step 3: Write the implementation**

Create `client/homebrew/components/markdownConverter/docxToMarkdown.js`:

```js
import mammoth from 'mammoth';

export async function docxToMarkdown(arrayBuffer) {
	const result = await mammoth.convertToMarkdown({ arrayBuffer });
	return result.value;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest client/homebrew/components/markdownConverter/docxToMarkdown.spec.js --verbose
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add client/homebrew/components/markdownConverter/docxToMarkdown.js client/homebrew/components/markdownConverter/docxToMarkdown.spec.js
git commit -m "feat: add docxToMarkdown helper wrapping mammoth"
```

---

### Task 3: Update converter panel to accept .docx files

**Files:**
- Modify: `client/homebrew/components/markdownConverter/converterPanel.jsx`

- [ ] **Step 1: Add the import**

At the top of `converterPanel.jsx`, after the existing imports (line 3), add:

```jsx
import { docxToMarkdown } from './docxToMarkdown.js';
```

- [ ] **Step 2: Replace the handleFileLoad function**

Replace the `handleFileLoad` function (lines 31-41) with:

```jsx
const handleFileLoad = async (e)=>{
	const file = e.target.files[0];
	if(!file) return;

	if(file.name.endsWith('.docx')) {
		const arrayBuffer = await file.arrayBuffer();
		const md = await docxToMarkdown(arrayBuffer);
		setInput(md);
		setMode('input');
		setPreview('');
	} else {
		const reader = new FileReader();
		reader.onload = (ev)=>{
			setInput(ev.target.result);
			setMode('input');
			setPreview('');
		};
		reader.readAsText(file);
	}
};
```

- [ ] **Step 3: Update the file input accept attribute**

Change line 74 from:

```jsx
accept=".md,.txt,.markdown"
```

to:

```jsx
accept=".md,.txt,.markdown,.docx"
```

- [ ] **Step 4: Update the hint text**

Change line 81 from:

```jsx
Paste standard markdown below, or load a .md file. The converter will transform it to Homebrewery format.
```

to:

```jsx
Paste standard markdown below, or load a .md or .docx file. The converter will transform it to Homebrewery format.
```

- [ ] **Step 5: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add client/homebrew/components/markdownConverter/converterPanel.jsx
git commit -m "feat: converter panel accepts .docx files via mammoth"
```

---

### Task 4: Manual integration test

- [ ] **Step 1: Start the dev server**

```bash
npm run start
```

- [ ] **Step 2: Test the full flow**

1. Open `http://localhost:8000` in a browser
2. Open or create a brew
3. Open the Markdown Converter panel
4. Click "Load File" and select a `.docx` file exported from Google Docs
5. Verify the textarea populates with markdown (headings, bold, lists, etc.)
6. Select "DungeonCraft AL" as the target format
7. Click "Convert"
8. Verify the preview shows AL-formatted markdown (`{{CoreBody}}`, `{{CoreHanging}}`, etc.)
9. Click "Insert into Editor"
10. Verify the content appears in the editor with correct AL preview styling
11. Click "Export DOCX"
12. Open the exported `.docx` and verify it has proper Word paragraph styles

- [ ] **Step 3: Test that .md files still work**

1. Open the converter panel again
2. Load a plain `.md` file
3. Verify it loads as text and converts normally

- [ ] **Step 4: Commit any fixes if needed**

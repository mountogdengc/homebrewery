# Art Block Phase 2: Interactive Placement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make art blocks interactive in the preview — hover to discover, click to select, drag to move, corner handles to resize — with automatic markdown patching on drop.

**Architecture:** A new `artBlockInteraction.js` module handles all iframe-side interaction (hover, select, drag, resize). It communicates changes via a callback to `brewRenderer.jsx`, which passes them up to `editPage.jsx`, which calls `editor.jsx`'s new `patchArtBlock()` method to update the CodeMirror document. The art block index (`data-art-index`) identifies which `{{art` block in the source corresponds to the interacted element.

**Tech Stack:** Vanilla DOM events (mousedown/mousemove/mouseup), CodeMirror 5 API (`replaceRange`), React callback props

---

### Task 1: Update artBlock renderer — add data-art-index and unit attributes

**Files:**
- Modify: `shared/markdown.js:331-388`
- Modify: `tests/markdown/art-block.test.js`

- [ ] **Step 1: Add test for data-art-index**

Add this test to `tests/markdown/art-block.test.js` inside the `describe('Tokenizer', ...)` block, after the existing tests:

```js
it('Assigns sequential data-art-index to multiple art blocks', function() {
	const source = dedent`{{art
		src: /images/a.png
		x: 0in
		}}

		{{art
		src: /images/b.png
		x: 1in
		}}`;
	const rendered = Markdown.render(source).trimReturns();
	expect(rendered).toContain('data-art-index="0"');
	expect(rendered).toContain('data-art-index="1"');
});

it('Stores original units in data attributes', function() {
	const source = dedent`{{art
		src: /images/map.png
		x: 0.45in
		y: 20%
		w: 3.25in
		h: 2cm
		}}`;
	const rendered = Markdown.render(source).trimReturns();
	expect(rendered).toContain('data-art-unit-x="in"');
	expect(rendered).toContain('data-art-unit-y="%"');
	expect(rendered).toContain('data-art-unit-w="in"');
	expect(rendered).toContain('data-art-unit-h="cm"');
});

it('Stores empty unit for properties using defaults', function() {
	const source = dedent`{{art
		src: /images/map.png
		}}`;
	const rendered = Markdown.render(source).trimReturns();
	expect(rendered).toContain('data-art-unit-x="in"');
	expect(rendered).toContain('data-art-unit-y="in"');
	expect(rendered).toContain('data-art-unit-w="%"');
	expect(rendered).not.toContain('data-art-unit-h');
});

it('Resets art-index counter on page 0', function() {
	// First render at page 0
	const source1 = dedent`{{art
		src: /images/a.png
		}}`;
	Markdown.render(source1, 0);
	// Second render at page 1
	const source2 = dedent`{{art
		src: /images/b.png
		}}`;
	const rendered2 = Markdown.render(source2, 1);
	expect(rendered2).toContain('data-art-index="1"');
	// Third render at page 0 again — should reset
	const rendered3 = Markdown.render(source1, 0);
	expect(rendered3).toContain('data-art-index="0"');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/markdown/art-block.test.js --verbose`

Expected: The 4 new tests FAIL (no `data-art-index` or `data-art-unit-*` attributes exist yet).

- [ ] **Step 3: Update the artBlock extension in markdown.js**

In `shared/markdown.js`, add a module-level counter before the `artBlock` const (around line 330):

```js
let artBlockIndex = 0;
```

Update the tokenizer to parse units from values. Replace the token return block (lines 357-368) with:

```js
			const parseUnit = (val)=>{
				if(!val) return '';
				const match = val.match(/(%|in|cm|px)$/);
				return match ? match[1] : '';
			};

			return {
				type       : 'artBlock',
				raw        : raw,
				src        : props.src || null,
				x          : props.x || '0in',
				y          : props.y || '0in',
				w          : props.w || '100%',
				h          : props.h || null,
				anchor     : props.anchor || 'page',
				z          : props.z || 'front',
				sourceLine : sourceLine,
				unitX      : parseUnit(props.x || '0in'),
				unitY      : parseUnit(props.y || '0in'),
				unitW      : parseUnit(props.w || '100%'),
				unitH      : props.h ? parseUnit(props.h) : null
			};
```

Update the renderer (lines 371-387) to include new data attributes and remove `pointer-events: none`:

```js
	renderer(token) {
		if(!token.src) {
			console.warn('Art block missing required "src" property');
			return '';
		}

		const index = artBlockIndex++;
		const zIndex = token.z === 'behind' ? '-1' : '1000';

		let style = `position:absolute; left:${token.x}; top:${token.y}; width:${token.w}; z-index:${zIndex};`;
		if(token.h) {
			style += ` height:${token.h};`;
		}

		const escapedSrc = escape(token.src);

		let attrs = `class="art-block" src="${escapedSrc}" data-art-index="${index}"`;
		attrs += ` data-art-unit-x="${token.unitX}" data-art-unit-y="${token.unitY}" data-art-unit-w="${token.unitW}"`;
		if(token.unitH !== null) {
			attrs += ` data-art-unit-h="${token.unitH}"`;
		}
		attrs += ` style="${style}"`;

		return `<img ${attrs}>`;
	}
```

In the `Markdown.render` function (around line 545), add the counter reset. Find the line:

```js
	if(pageNumber==0) MarkedGFMResetHeadingIDs();
```

Add after it:

```js
	if(pageNumber==0) artBlockIndex = 0;
```

- [ ] **Step 4: Run tests**

Run: `npx jest tests/markdown/art-block.test.js --verbose`

Expected: All tests PASS (including the 4 new ones).

- [ ] **Step 5: Run full test suite for regressions**

Run: `npx jest --runInBand`

Expected: No new failures (pre-existing failures in safeHTML.test.js and convert-docx.spec.js are unrelated).

- [ ] **Step 6: Commit**

```bash
git add shared/markdown.js tests/markdown/art-block.test.js
git commit -m "feat: add data-art-index and unit data attributes to art blocks"
```

---

### Task 2: Editor patchArtBlock method

**Files:**
- Modify: `client/homebrew/editor/editor.jsx`

- [ ] **Step 1: Add the patchArtBlock method**

In `client/homebrew/editor/editor.jsx`, add the `patchArtBlock` method to the `createReactClass` object. Place it after the `jumpToText` method (after line 535):

```js
	patchArtBlock : function(artIndex, newProps) {
		const cm = this.codeEditor.current?.codeMirror;
		if(!cm) return;

		const fullText = cm.getValue();
		const artRegex = /{{art *\r?\n/g;
		let match;
		let count = 0;

		while ((match = artRegex.exec(fullText)) !== null) {
			if(count === artIndex) {
				// Find the closing }}
				const blockStart = match.index;
				const closingIdx = fullText.indexOf('\n}}', blockStart);
				if(closingIdx === -1) return;
				const blockEnd = closingIdx + 3;
				const blockText = fullText.substring(blockStart, blockEnd);

				let newBlockText = blockText;

				for(const [key, value] of Object.entries(newProps)) {
					const propRegex = new RegExp(`^(\\s*${key}:\\s*).*$`, 'm');
					if(propRegex.test(newBlockText)) {
						newBlockText = newBlockText.replace(propRegex, `$1${value}`);
					} else {
						// Insert new property before closing }}
						newBlockText = newBlockText.replace(/\n\s*}}$/, `\n${key}: ${value}\n}}`);
					}
				}

				if(newBlockText !== blockText) {
					// Convert string offsets to CodeMirror {line, ch} positions
					const startPos = cm.posFromIndex(blockStart);
					const endPos = cm.posFromIndex(blockEnd);
					cm.replaceRange(newBlockText, startPos, endPos);
				}
				return;
			}
			count++;
		}
	},
```

- [ ] **Step 2: Run full test suite to check no regressions**

Run: `npx jest --runInBand`

Expected: No new failures.

- [ ] **Step 3: Commit**

```bash
git add client/homebrew/editor/editor.jsx
git commit -m "feat: add patchArtBlock method for interactive art placement"
```

---

### Task 3: Art block interaction module

**Files:**
- Create: `client/homebrew/brewRenderer/artBlockInteraction.js`

- [ ] **Step 1: Create the interaction module**

Create `client/homebrew/brewRenderer/artBlockInteraction.js`:

```js
const ART_INTERACTION_STYLES = `
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
	box-sizing: border-box;
}
.art-handle-nw { cursor: nw-resize; }
.art-handle-ne { cursor: ne-resize; }
.art-handle-sw { cursor: sw-resize; }
.art-handle-se { cursor: se-resize; }
`;

// Unit conversion: pixels to the given unit
function pxToUnit(px, unit, pageDimPx) {
	switch (unit) {
		case 'in': return (px / 96).toFixed(2) + 'in';
		case 'cm': return (px / 96 * 2.54).toFixed(2) + 'cm';
		case '%':  return (px / pageDimPx * 100).toFixed(2) + '%';
		case 'px': return Math.round(px) + 'px';
		default:   return (px / 96).toFixed(2) + 'in';
	}
}

// Unit conversion: a CSS value string to pixels
function unitToPx(value, pageDimPx) {
	const num = parseFloat(value);
	if(value.endsWith('%'))  return num / 100 * pageDimPx;
	if(value.endsWith('cm')) return num / 2.54 * 96;
	if(value.endsWith('px')) return num;
	// Default: inches
	return num * 96;
}

export function initArtBlockInteraction(frameDoc, onUpdate) {
	// Inject styles if not already present
	if(!frameDoc.getElementById('art-interaction-styles')) {
		const styleEl = frameDoc.createElement('style');
		styleEl.id = 'art-interaction-styles';
		styleEl.textContent = ART_INTERACTION_STYLES;
		frameDoc.head.appendChild(styleEl);
	}

	let selectedImg = null;
	let handles = [];
	let isDragging = false;
	let isResizing = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartLeft = 0;
	let dragStartTop = 0;
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeStartW = 0;
	let resizeStartH = 0;
	let resizeCorner = '';

	function getPageElement(el) {
		let page = el.parentElement;
		while (page && !page.classList?.contains('page')) {
			page = page.parentElement;
		}
		return page;
	}

	function removeHandles() {
		handles.forEach((h)=>h.remove());
		handles = [];
	}

	function positionHandles(img) {
		const page = getPageElement(img);
		if(!page) return;

		const left = parseFloat(img.style.left) || 0;
		const top = parseFloat(img.style.top) || 0;
		// Use offsetWidth/offsetHeight for rendered size
		const w = img.offsetWidth;
		const h = img.offsetHeight;

		// Convert left/top from CSS units to px for handle positioning
		const pageRect = page.querySelector('.columnWrapper')?.getBoundingClientRect() || page.getBoundingClientRect();
		const imgRect = img.getBoundingClientRect();
		const relLeft = imgRect.left - pageRect.left;
		const relTop = imgRect.top - pageRect.top;

		const positions = [
			{ cls: 'art-handle-nw', x: relLeft - 5,     y: relTop - 5 },
			{ cls: 'art-handle-ne', x: relLeft + w - 5,  y: relTop - 5 },
			{ cls: 'art-handle-sw', x: relLeft - 5,     y: relTop + h - 5 },
			{ cls: 'art-handle-se', x: relLeft + w - 5,  y: relTop + h - 5 },
		];

		// Ensure we have 4 handles
		if(handles.length !== 4) {
			removeHandles();
			const container = page.querySelector('.columnWrapper') || page;
			positions.forEach((pos)=>{
				const handle = frameDoc.createElement('div');
				handle.className = `art-handle ${pos.cls}`;
				handle.style.position = 'absolute';
				handle.style.left = pos.x + 'px';
				handle.style.top = pos.y + 'px';
				container.appendChild(handle);
				handles.push(handle);

				handle.addEventListener('mousedown', (e)=>{
					e.stopPropagation();
					e.preventDefault();
					startResize(e, pos.cls.replace('art-handle-', ''));
				});
			});
		} else {
			positions.forEach((pos, i)=>{
				handles[i].style.left = pos.x + 'px';
				handles[i].style.top = pos.y + 'px';
			});
		}
	}

	function selectArt(img) {
		deselectArt();
		selectedImg = img;
		img.classList.add('art-selected');
		positionHandles(img);
	}

	function deselectArt() {
		if(selectedImg) {
			selectedImg.classList.remove('art-selected');
			selectedImg = null;
		}
		removeHandles();
	}

	// --- Drag logic ---
	function startDrag(e) {
		if(!selectedImg || isResizing) return;
		isDragging = true;
		selectedImg.classList.add('art-dragging');

		const page = getPageElement(selectedImg);
		const pageW = page?.offsetWidth || 816;
		const pageH = page?.offsetHeight || 1056;

		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragStartLeft = unitToPx(selectedImg.style.left || '0in', pageW);
		dragStartTop = unitToPx(selectedImg.style.top || '0in', pageH);

		frameDoc.addEventListener('mousemove', onDragMove);
		frameDoc.addEventListener('mouseup', onDragEnd);
	}

	function onDragMove(e) {
		if(!isDragging || !selectedImg) return;
		e.preventDefault();
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;
		selectedImg.style.left = (dragStartLeft + dx) + 'px';
		selectedImg.style.top = (dragStartTop + dy) + 'px';
		positionHandles(selectedImg);
	}

	function onDragEnd(e) {
		if(!isDragging || !selectedImg) return;
		isDragging = false;
		selectedImg.classList.remove('art-dragging');
		frameDoc.removeEventListener('mousemove', onDragMove);
		frameDoc.removeEventListener('mouseup', onDragEnd);

		// Convert pixel position back to original unit
		const page = getPageElement(selectedImg);
		const pageW = page?.offsetWidth || 816;
		const pageH = page?.offsetHeight || 1056;
		const unitX = selectedImg.getAttribute('data-art-unit-x') || 'in';
		const unitY = selectedImg.getAttribute('data-art-unit-y') || 'in';

		const newX = pxToUnit(parseFloat(selectedImg.style.left), unitX, pageW);
		const newY = pxToUnit(parseFloat(selectedImg.style.top), unitY, pageH);
		const artIndex = parseInt(selectedImg.getAttribute('data-art-index'), 10);

		onUpdate({ artIndex, props: { x: newX, y: newY } });
	}

	// --- Resize logic ---
	function startResize(e, corner) {
		if(!selectedImg) return;
		isResizing = true;
		resizeCorner = corner;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizeStartW = selectedImg.offsetWidth;
		resizeStartH = selectedImg.offsetHeight;

		frameDoc.addEventListener('mousemove', onResizeMove);
		frameDoc.addEventListener('mouseup', onResizeEnd);
	}

	function onResizeMove(e) {
		if(!isResizing || !selectedImg) return;
		e.preventDefault();
		const dx = e.clientX - resizeStartX;
		const dy = e.clientY - resizeStartY;

		let newW = resizeStartW;
		let newH = resizeStartH;

		if(resizeCorner === 'se') {
			newW = resizeStartW + dx;
			newH = resizeStartH + dy;
		} else if(resizeCorner === 'sw') {
			newW = resizeStartW - dx;
			newH = resizeStartH + dy;
		} else if(resizeCorner === 'ne') {
			newW = resizeStartW + dx;
			newH = resizeStartH - dy;
		} else if(resizeCorner === 'nw') {
			newW = resizeStartW - dx;
			newH = resizeStartH - dy;
		}

		newW = Math.max(20, newW);
		newH = Math.max(20, newH);

		selectedImg.style.width = newW + 'px';
		selectedImg.style.height = newH + 'px';

		// For nw/sw corners, also adjust left position
		if(resizeCorner === 'nw' || resizeCorner === 'sw') {
			const page = getPageElement(selectedImg);
			const pageW = page?.offsetWidth || 816;
			const origLeft = unitToPx(selectedImg.getAttribute('data-orig-left') || selectedImg.style.left || '0', pageW);
			selectedImg.style.left = (origLeft + (resizeStartW - newW)) + 'px';
		}
		// For nw/ne corners, also adjust top position
		if(resizeCorner === 'nw' || resizeCorner === 'ne') {
			const page = getPageElement(selectedImg);
			const pageH = page?.offsetHeight || 1056;
			const origTop = unitToPx(selectedImg.getAttribute('data-orig-top') || selectedImg.style.top || '0', pageH);
			selectedImg.style.top = (origTop + (resizeStartH - newH)) + 'px';
		}

		positionHandles(selectedImg);
	}

	function onResizeEnd(e) {
		if(!isResizing || !selectedImg) return;
		isResizing = false;
		frameDoc.removeEventListener('mousemove', onResizeMove);
		frameDoc.removeEventListener('mouseup', onResizeEnd);

		const page = getPageElement(selectedImg);
		const pageW = page?.offsetWidth || 816;
		const pageH = page?.offsetHeight || 1056;
		const unitW = selectedImg.getAttribute('data-art-unit-w') || 'in';
		const unitX = selectedImg.getAttribute('data-art-unit-x') || 'in';
		const unitY = selectedImg.getAttribute('data-art-unit-y') || 'in';
		const artIndex = parseInt(selectedImg.getAttribute('data-art-index'), 10);

		const newProps = {
			w: pxToUnit(selectedImg.offsetWidth, unitW, pageW)
		};

		// Only update position if it changed (nw/sw/ne corners)
		if(resizeCorner === 'nw' || resizeCorner === 'sw') {
			newProps.x = pxToUnit(parseFloat(selectedImg.style.left), unitX, pageW);
		}
		if(resizeCorner === 'nw' || resizeCorner === 'ne') {
			newProps.y = pxToUnit(parseFloat(selectedImg.style.top), unitY, pageH);
		}

		// Only patch h if it was originally specified
		const unitH = selectedImg.getAttribute('data-art-unit-h');
		if(unitH !== null && unitH !== undefined) {
			newProps.h = pxToUnit(selectedImg.offsetHeight, unitH, pageH);
		}

		onUpdate({ artIndex, props: newProps });
	}

	// --- Bind to all art blocks ---
	const artBlocks = frameDoc.querySelectorAll('.art-block');

	artBlocks.forEach((img)=>{
		img.addEventListener('mouseenter', ()=>{
			if(!isDragging && !isResizing && img !== selectedImg) {
				img.classList.add('art-hover');
			}
		});

		img.addEventListener('mouseleave', ()=>{
			img.classList.remove('art-hover');
		});

		img.addEventListener('click', (e)=>{
			e.stopPropagation();
			e.preventDefault();
			img.classList.remove('art-hover');
			selectArt(img);
		});

		img.addEventListener('mousedown', (e)=>{
			if(img === selectedImg && !isResizing) {
				e.stopPropagation();
				e.preventDefault();
				// Store original position for resize corner adjustments
				img.setAttribute('data-orig-left', img.style.left);
				img.setAttribute('data-orig-top', img.style.top);
				startDrag(e);
			}
		});
	});

	// Deselect on click outside
	frameDoc.addEventListener('click', (e)=>{
		if(!e.target.classList?.contains('art-block') && !e.target.classList?.contains('art-handle')) {
			deselectArt();
		}
	});

	// Deselect on Escape
	frameDoc.addEventListener('keydown', (e)=>{
		if(e.key === 'Escape') {
			deselectArt();
		}
	});

	// Return cleanup function
	return function cleanup() {
		deselectArt();
		frameDoc.removeEventListener('click', deselectArt);
	};
}
```

- [ ] **Step 2: Commit**

```bash
git add client/homebrew/brewRenderer/artBlockInteraction.js
git commit -m "feat: add art block interaction module for drag/resize"
```

---

### Task 4: Wire interaction module into brewRenderer and editPage

**Files:**
- Modify: `client/homebrew/brewRenderer/brewRenderer.jsx`
- Modify: `client/homebrew/pages/editPage/editPage.jsx`

- [ ] **Step 1: Add import and initialization in brewRenderer.jsx**

In `client/homebrew/brewRenderer/brewRenderer.jsx`, add the import after the existing imports (around line 31):

```js
import { initArtBlockInteraction } from './artBlockInteraction.js';
```

Add `onArtBlockUpdate` to the default props (after line 134, after `onPreviewClick`):

```js
		onArtBlockUpdate           : null,
```

Add a `useEffect` to initialize the interaction module after renders. Place it after the `processProceduralImageEmbeds` useEffect (around line 501), before the `return` statement:

```js
	// Initialize art block interaction after content renders
	useEffect(()=>{
		if(!state.isMounted || !props.onArtBlockUpdate) return;

		const iframeDoc = document.getElementById('BrewRenderer')?.contentDocument;
		if(!iframeDoc) return;

		// Delay slightly to ensure DOM is fully rendered
		const timer = setTimeout(()=>{
			const cleanup = initArtBlockInteraction(iframeDoc, ({ artIndex, props: newProps })=>{
				props.onArtBlockUpdate(artIndex, newProps);
			});
			return ()=>cleanup?.();
		}, 300);

		return ()=>clearTimeout(timer);
	}, [renderedPages, state.isMounted]);
```

- [ ] **Step 2: Add onArtBlockUpdate prop in editPage.jsx**

In `client/homebrew/pages/editPage/editPage.jsx`, find the `<BrewRenderer` JSX (around line 435). Add the `onArtBlockUpdate` prop after `onPreviewClick`:

```js
							onPreviewClick={(text, pageNum)=>{editorRef.current?.jumpToText(text, pageNum);}}
							onArtBlockUpdate={(artIndex, newProps)=>{editorRef.current?.patchArtBlock(artIndex, newProps);}}
```

- [ ] **Step 3: Run full test suite**

Run: `npx jest --runInBand`

Expected: No new failures.

- [ ] **Step 4: Commit**

```bash
git add client/homebrew/brewRenderer/brewRenderer.jsx client/homebrew/pages/editPage/editPage.jsx
git commit -m "feat: wire art block interaction into brew renderer and edit page"
```

---

### Task 5: Build, manual test, and fix

**Files:**
- Potentially any of the files from Tasks 1-4

- [ ] **Step 1: Build the project**

```bash
rm -rf build && npm run build
```

- [ ] **Step 2: Start the dev server**

```bash
npm start
```

- [ ] **Step 3: Test hover behavior**

Open a brew with an art block:
```
{{art
src: https://i.imgur.com/hMna6G0.png
x: 1in
y: 2in
w: 3in
z: behind
}}
```

Hover over the image — should show dashed blue outline and grab cursor.

- [ ] **Step 4: Test click-to-select**

Click the art block image — should show solid blue outline and 4 corner handles (small white squares with blue borders).

Verify click-to-navigate still works for text elements on the same page.

- [ ] **Step 5: Test drag-to-move**

Click to select, then drag the image. It should move smoothly. On mouse release, check the editor — `x` and `y` values should update to the new position in the original unit.

- [ ] **Step 6: Test resize**

Drag the bottom-right corner handle. The image should resize. On release, check the editor — `w` should update. If `h` was originally specified, it should also update.

- [ ] **Step 7: Test deselect**

Click outside the art block — handles should disappear. Press Escape — same behavior.

- [ ] **Step 8: Test edge cases**

- Multiple art blocks on one page — each should be independently selectable/draggable
- Art blocks on different pages — indices should be correct
- Undo (Ctrl+Z) after a drag — should revert the position change in the editor

- [ ] **Step 9: Commit any fixes**

```bash
git add -A
git commit -m "fix: art block interaction adjustments from manual testing"
```

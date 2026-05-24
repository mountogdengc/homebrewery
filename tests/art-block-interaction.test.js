/**
 * @jest-environment jsdom
 */
import { initArtBlockInteraction } from '../client/homebrew/brewRenderer/artBlockInteraction.js';

function createArtBlock(doc, { index = 0, left = '1in', top = '2in', width = '3in' } = {}) {
	const img = doc.createElement('img');
	img.className = 'art-block';
	img.setAttribute('data-art-index', index);
	img.setAttribute('data-art-unit-x', 'in');
	img.setAttribute('data-art-unit-y', 'in');
	img.setAttribute('data-art-unit-w', 'in');
	img.style.position = 'absolute';
	img.style.left = left;
	img.style.top = top;
	img.style.width = width;
	img.src = 'test.png';
	return img;
}

function createPageWithArt(doc, artBlocks) {
	const page = doc.createElement('div');
	page.className = 'page';
	const colWrapper = doc.createElement('div');
	colWrapper.className = 'columnWrapper';
	artBlocks.forEach((ab)=>colWrapper.appendChild(ab));
	page.appendChild(colWrapper);
	doc.body.appendChild(page);
	return page;
}

describe('Art Block Interaction', ()=>{
	let onUpdate;

	beforeEach(()=>{
		document.body.innerHTML = '';
		onUpdate = jest.fn();
	});

	it('selects art block on click', ()=>{
		const art = createArtBlock(document);
		createPageWithArt(document, [art]);

		initArtBlockInteraction(document, onUpdate);

		art.click();
		expect(art.classList.contains('art-selected')).toBe(true);
	});

	it('deselects on Escape key', ()=>{
		const art = createArtBlock(document);
		createPageWithArt(document, [art]);

		initArtBlockInteraction(document, onUpdate);

		art.click();
		expect(art.classList.contains('art-selected')).toBe(true);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(art.classList.contains('art-selected')).toBe(false);
	});

	it('deselects on click outside art block', ()=>{
		const art = createArtBlock(document);
		createPageWithArt(document, [art]);

		initArtBlockInteraction(document, onUpdate);

		art.click();
		expect(art.classList.contains('art-selected')).toBe(true);

		document.body.click();
		expect(art.classList.contains('art-selected')).toBe(false);
	});

	it('shows hover state on mouseenter and removes on mouseleave', ()=>{
		const art = createArtBlock(document);
		createPageWithArt(document, [art]);

		initArtBlockInteraction(document, onUpdate);

		art.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
		expect(art.classList.contains('art-hover')).toBe(true);

		art.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
		expect(art.classList.contains('art-hover')).toBe(false);
	});

	it('creates resize handles on selection', ()=>{
		const art = createArtBlock(document);
		createPageWithArt(document, [art]);

		initArtBlockInteraction(document, onUpdate);

		art.click();
		const handles = document.querySelectorAll('.art-handle');
		expect(handles.length).toBe(4);
	});

	it('removes handles on deselect', ()=>{
		const art = createArtBlock(document);
		createPageWithArt(document, [art]);

		initArtBlockInteraction(document, onUpdate);

		art.click();
		expect(document.querySelectorAll('.art-handle').length).toBe(4);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(document.querySelectorAll('.art-handle').length).toBe(0);
	});

	it('cleanup removes event listeners and handles', ()=>{
		const art = createArtBlock(document);
		createPageWithArt(document, [art]);

		const cleanup = initArtBlockInteraction(document, onUpdate);

		art.click();
		expect(art.classList.contains('art-selected')).toBe(true);

		cleanup();
		expect(document.querySelectorAll('.art-handle').length).toBe(0);
	});

	it('rebinding after cleanup works on new DOM elements (re-render scenario)', ()=>{
		// Phase 1: initial bind
		const art1 = createArtBlock(document);
		const page = createPageWithArt(document, [art1]);

		const cleanup1 = initArtBlockInteraction(document, onUpdate);
		art1.click();
		expect(art1.classList.contains('art-selected')).toBe(true);

		// Simulate React re-render: cleanup old, replace DOM, rebind
		cleanup1();
		page.remove();

		const art2 = createArtBlock(document);
		createPageWithArt(document, [art2]);

		const cleanup2 = initArtBlockInteraction(document, onUpdate);

		// Key test: new element should be selectable
		art2.click();
		expect(art2.classList.contains('art-selected')).toBe(true);
		expect(document.querySelectorAll('.art-handle').length).toBe(4);

		cleanup2();
	});

	it('injects interaction styles only once', ()=>{
		const art = createArtBlock(document);
		createPageWithArt(document, [art]);

		initArtBlockInteraction(document, onUpdate);
		initArtBlockInteraction(document, onUpdate);

		const styles = document.querySelectorAll('#art-interaction-styles');
		expect(styles.length).toBe(1);
	});

	it('calls onUpdate with correct artIndex after drag', ()=>{
		const art = createArtBlock(document, { index: 2 });
		createPageWithArt(document, [art]);

		// Mock offsetWidth/offsetHeight
		Object.defineProperty(art, 'offsetWidth', { value: 288, configurable: true });
		Object.defineProperty(art, 'offsetHeight', { value: 200, configurable: true });

		initArtBlockInteraction(document, onUpdate);

		// Select
		art.click();

		// Start drag (mousedown on selected)
		art.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100, bubbles: true }));

		// Move
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 120, bubbles: true }));

		// End drag
		document.dispatchEvent(new MouseEvent('mouseup', { clientX: 150, clientY: 120, bubbles: true }));

		expect(onUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				artIndex: 2,
				props: expect.objectContaining({
					x: expect.any(String),
					y: expect.any(String)
				})
			})
		);
	});
});

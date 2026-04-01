/**
 * Core conversion pipeline.
 * parse -> insertPageBreaks -> transform -> wrapPages -> emit
 */

import { parse } from './parser.js';
import { emit } from './emitter.js';

/**
 * Convert standard markdown to Homebrewery format.
 * @param {string} input - Raw markdown text
 * @param {Object} format - Format definition object
 * @returns {string} Homebrewery-formatted markdown
 */
export function convert(input, format) {
	// 1. Parse into block tokens
	let blocks = parse(input);

	// 2. Insert page breaks
	blocks = format.insertPageBreaks(blocks);

	// 3. Transform each block
	const pages = [[]]; // array of pages, each page is array of strings

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];

		// Page break starts a new page
		if (block.type === 'page_break') {
			pages.push([]);
			continue;
		}

		// Build context for the transformer
		const ctx = {
			prevBlock: findPrev(blocks, i),
			nextBlock: findNext(blocks, i),
			pageIndex: pages.length - 1,
			blockIndex: i
		};

		// Get the transformer for this token type
		const transformer = format[block.type];
		if (typeof transformer === 'function') {
			const result = transformer.call(format, block, ctx);
			if (result !== null && result !== undefined) {
				pages[pages.length - 1].push(result);
			}
		} else {
			// Unknown type — pass through raw content with review marker
			const raw = block.raw || block.text || '';
			pages[pages.length - 1].push(
				format.reviewMarker(`Unknown block type: ${block.type}`) + '\n' + raw
			);
		}
	}

	// 4. Post-process: merge consecutive epigraph blocks
	for (let p = 0; p < pages.length; p++) {
		pages[p] = mergeConsecutiveEpigraphs(pages[p]);
	}

	// 5. Wrap each page with furniture and emit
	const pageStrings = pages.map((pageBlocks, idx) => {
		const content = emit(pageBlocks);
		// Skip page furniture on first page if it's empty
		if (idx === 0 && content.trim() === '') return '';
		return format.wrapPage(content);
	}).filter(p => p.trim() !== '');

	return pageStrings.join('\n\n\\page\n\n');
}

/**
 * Merge consecutive {{Epigraph}} blocks into a single block.
 * This handles the common case of multi-paragraph italic openings.
 */
function mergeConsecutiveEpigraphs(blocks) {
	const result = [];
	let i = 0;

	while (i < blocks.length) {
		const block = blocks[i];

		if (typeof block === 'string' && block.startsWith('{{Epigraph\n') && block.endsWith('\n}}')) {
			// Collect consecutive epigraphs
			const epigraphContents = [];
			while (i < blocks.length
				&& typeof blocks[i] === 'string'
				&& blocks[i].startsWith('{{Epigraph\n')
				&& blocks[i].endsWith('\n}}')) {
				// Extract content between {{Epigraph\n and \n}}
				const content = blocks[i].slice('{{Epigraph\n'.length, -'\n}}'.length);
				epigraphContents.push(content);
				i++;
			}

			// Check if the last one is actually an EpigraphAuthor pair
			// (the format emitter produces "{{Epigraph\n...\n}}\n{{EpigraphAuthor\n...\n}}")
			// Those come as a single string, so they won't be split here

			if (epigraphContents.length > 1) {
				result.push(`{{Epigraph\n${epigraphContents.join('\n\n')}\n}}`);
			} else {
				result.push(`{{Epigraph\n${epigraphContents[0]}\n}}`);
			}
		} else {
			result.push(block);
			i++;
		}
	}

	return result;
}

/** Find previous non-page-break block */
function findPrev(blocks, i) {
	for (let j = i - 1; j >= 0; j--) {
		if (blocks[j].type !== 'page_break') return blocks[j];
	}
	return null;
}

/** Find next non-page-break block */
function findNext(blocks, i) {
	for (let j = i + 1; j < blocks.length; j++) {
		if (blocks[j].type !== 'page_break') return blocks[j];
	}
	return null;
}

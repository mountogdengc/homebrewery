/**
 * Browser-compatible markdown-to-Homebrewery converter.
 * Self-contained — no Node.js dependencies.
 */

// ── Parser ──────────────────────────────────────────────────────────────

const HEADING_RE    = /^(#{1,6})\s+(.+)$/;
const HR_RE         = /^(---+|___+|\*\*\*+)\s*$/;
const BLOCKQUOTE_RE = /^>\s?(.*)$/;
const UL_RE         = /^(\s*)([-*+])\s+(.+)$/;
const OL_RE         = /^(\s*)(\d+)[.)]\s+(.+)$/;
const FENCE_RE      = /^(`{3,}|~{3,})(.*)$/;
const TABLE_SEP_RE  = /^\|[\s:|-]+\|$/;
const EMPTY_RE      = /^\s*$/;
const DEFINITION_RE = /^\*\*[^*]+[.:]\*\*\s+/;
const EPIGRAPH_RE   = /^\*["\u201C]/;
const ITALIC_BLOCK_RE = /^\*[^*]/;

function parse(input) {
	const lines = input.split(/\r?\n/);
	const blocks = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (EMPTY_RE.test(line)) { i++; continue; }

		const headingMatch = line.match(HEADING_RE);
		if (headingMatch) {
			blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2], raw: line });
			i++; continue;
		}

		if (HR_RE.test(line)) {
			blocks.push({ type: 'horizontal_rule', raw: line });
			i++; continue;
		}

		const fenceMatch = line.match(FENCE_RE);
		if (fenceMatch) {
			const fence = fenceMatch[1];
			const lang = fenceMatch[2].trim();
			const contentLines = [];
			i++;
			while (i < lines.length && !lines[i].startsWith(fence.charAt(0).repeat(fence.length))) {
				contentLines.push(lines[i]); i++;
			}
			if (i < lines.length) i++;
			blocks.push({ type: 'code_block', lang, content: contentLines.join('\n'), raw: line + '\n' + contentLines.join('\n') + '\n' + fence });
			continue;
		}

		if (line.includes('|')) {
			const tableLines = [];
			let j = i; let hasSep = false;
			while (j < lines.length && (lines[j].includes('|') || EMPTY_RE.test(lines[j]))) {
				if (EMPTY_RE.test(lines[j])) break;
				if (TABLE_SEP_RE.test(lines[j].trim())) hasSep = true;
				tableLines.push(lines[j]); j++;
			}
			if (hasSep && tableLines.length >= 2) {
				blocks.push({ type: 'table', rows: tableLines, raw: tableLines.join('\n') });
				i = j; continue;
			}
		}

		if (BLOCKQUOTE_RE.test(line)) {
			const quoteLines = [];
			while (i < lines.length && BLOCKQUOTE_RE.test(lines[i])) {
				quoteLines.push(lines[i].replace(BLOCKQUOTE_RE, '$1')); i++;
			}
			blocks.push({ type: 'blockquote', content: quoteLines.join('\n'), raw: quoteLines.map(l => `> ${l}`).join('\n') });
			continue;
		}

		if (UL_RE.test(line) || OL_RE.test(line)) {
			const ordered = OL_RE.test(line);
			const listLines = [];
			const listRe = ordered ? OL_RE : UL_RE;
			while (i < lines.length) {
				if (listRe.test(lines[i])) { listLines.push(lines[i]); i++; }
				else if (/^\s{2,}/.test(lines[i]) && !EMPTY_RE.test(lines[i])) { listLines.push(lines[i]); i++; }
				else if (EMPTY_RE.test(lines[i]) && i + 1 < lines.length && (listRe.test(lines[i + 1]) || /^\s{2,}/.test(lines[i + 1]))) { listLines.push(lines[i]); i++; }
				else break;
			}
			blocks.push({ type: 'list', ordered, items: listLines, raw: listLines.join('\n') });
			continue;
		}

		{
			const paraLines = [];
			while (i < lines.length
				&& !EMPTY_RE.test(lines[i])
				&& !HEADING_RE.test(lines[i])
				&& !HR_RE.test(lines[i])
				&& !FENCE_RE.test(lines[i])
				&& !BLOCKQUOTE_RE.test(lines[i])
				&& !(lines[i].includes('|') && i + 1 < lines.length && TABLE_SEP_RE.test((lines[i + 1] || '').trim()))
			) { paraLines.push(lines[i]); i++; }

			if (paraLines.length > 0) {
				const text = paraLines.join('\n');
				let subtype = 'plain';
				if (DEFINITION_RE.test(text)) subtype = 'definition';
				else if (EPIGRAPH_RE.test(text.trim())) subtype = 'epigraph';
				else if (ITALIC_BLOCK_RE.test(text.trim()) && text.trim().endsWith('*')) subtype = 'italic_block';
				blocks.push({ type: 'paragraph', subtype, text, raw: text });
			}
		}
	}
	return blocks;
}

// ── Formats ─────────────────────────────────────────────────────────────

const base = {
	name: 'base',
	pageBreakBeforeHeadings: [1],
	hrBecomesPageBreak: true,
	pageNumbering: '{{pageNumber,auto}}',
	footer: null,

	heading(token)        { return `${'#'.repeat(token.level)} ${token.text}`; },
	paragraph(token)      { return token.text; },
	blockquote(token)     { return token.content.split('\n').map(l => `> ${l}`).join('\n'); },
	horizontal_rule()     { return '---'; },
	code_block(token)     { return `\`\`\`${token.lang}\n${token.content}\n\`\`\``; },
	table(token)          { return token.rows.join('\n'); },
	list(token)           { return token.items.join('\n'); },

	insertPageBreaks(blocks) {
		const result = [];
		let isFirst = true;
		for (let i = 0; i < blocks.length; i++) {
			const block = blocks[i];
			if (block.type === 'heading' && this.pageBreakBeforeHeadings.includes(block.level)) {
				if (!isFirst) result.push({ type: 'page_break' });
				isFirst = false;
			}
			if (block.type === 'horizontal_rule' && this.hrBecomesPageBreak) {
				const prev = result.length > 0 ? result[result.length - 1] : null;
				const next = blocks.slice(i + 1, i + 6).find(b => b.type !== 'empty');
				if ((prev && prev.type === 'heading') || (next && next.type === 'heading')) {
					result.push({ type: 'page_break' });
					continue;
				}
			}
			result.push(block);
		}
		return result;
	},

	wrapPage(content) {
		const parts = [content];
		if (this.footer) parts.push(this.footer);
		if (this.pageNumbering) parts.push(this.pageNumbering);
		return parts.join('\n\n');
	},

	reviewMarker(msg) { return `<!-- REVIEW: ${msg} -->`; }
};

const formats = {
	'5ePHB': {
		...base,
		name: '5ePHB',
		blockquote(token, ctx) {
			const content = token.content.trim();
			if (content.startsWith('#####')) return `{{note\n${content}\n}}`;
			return `{{descriptive\n${content}\n}}`;
		},
		paragraph(token) {
			if (token.subtype === 'epigraph' || token.subtype === 'italic_block') {
				return `> ${token.text.split('\n').join('\n> ')}`;
			}
			return token.text;
		},
	},

	'DungeonCraftAL': {
		...base,
		name: 'DungeonCraftAL',
		footer: '{{footnote\nNot for resale. Permission granted to print or photocopy this document for personal use only.\n}}',
		paragraph(token, ctx) {
			const text = token.text.trim();
			if (token.subtype === 'epigraph') {
				const lines = text.split('\n');
				const lastLine = lines[lines.length - 1].trim();
				if (lastLine.startsWith('\u2014') || lastLine.startsWith('--')) {
					return `{{Epigraph\n${lines.slice(0, -1).join('\n')}\n}}\n{{EpigraphAuthor\n${lastLine}\n}}`;
				}
				return `{{Epigraph\n${text}\n}}`;
			}
			if (token.subtype === 'italic_block') return `{{Epigraph\n${text}\n}}`;
			if (token.subtype === 'definition') return `{{CoreHanging\n${text}\n}}`;
			if (text.split('\n').length === 1 && text.length < 60 && ctx.nextBlock && ctx.nextBlock.type === 'table') {
				return `{{TableTitle\n${text}\n}}`;
			}
			return `{{CoreBody\n${text}\n}}`;
		},
		blockquote(token) {
			const content = token.content.trim();
			if (content.startsWith('#####')) {
				const lines = content.split('\n');
				const heading = lines[0].replace(/^#+\s*/, '');
				const body = lines.slice(1).join('\n').trim();
				if (body) return `{{note\n{{SidebarHeading\n${heading}\n}}\n{{SidebarBody\n${body}\n}}\n}}`;
				return `{{note\n##### ${heading}\n}}`;
			}
			return `{{BoxedText\n${content}\n}}`;
		},
		list(token, ctx) {
			const raw = token.items.join('\n');
			if (ctx.prevBlock && ctx.prevBlock.type === 'paragraph' && ctx.prevBlock.subtype === 'definition') {
				return `{{HangingBullet\n${raw}\n}}`;
			}
			return `{{CoreBulleted\n${raw}\n}}`;
		},
	},

	'Legacy': {
		...base,
		name: 'Legacy',
		pageNumbering: "<div class='pageNumber auto'></div>",
		footer: "<div class='footnote'>PART 1 | CHAPTER NAME</div>",
		blockquote(token) {
			const content = token.content.trim();
			if (content.startsWith('#####')) return content.split('\n').map(l => `> ${l}`).join('\n');
			return `<div class='descriptive'>\n${content}\n</div>`;
		},
		paragraph(token) {
			if (token.subtype === 'epigraph' || token.subtype === 'italic_block') {
				return `> ${token.text.split('\n').join('\n> ')}`;
			}
			return token.text;
		},
	},

	'Blank': {
		...base,
		name: 'Blank',
		blockquote(token) {
			const content = token.content.trim();
			if (content.startsWith('#####')) return `{{note\n${content}\n}}`;
			return content.split('\n').map(l => `> ${l}`).join('\n');
		},
	},
};

// ── Converter Pipeline ──────────────────────────────────────────────────

function mergeConsecutiveEpigraphs(blocks) {
	const result = [];
	let i = 0;
	while (i < blocks.length) {
		const block = blocks[i];
		if (typeof block === 'string' && block.startsWith('{{Epigraph\n') && block.endsWith('\n}}')) {
			const contents = [];
			while (i < blocks.length && typeof blocks[i] === 'string'
				&& blocks[i].startsWith('{{Epigraph\n') && blocks[i].endsWith('\n}}')) {
				contents.push(blocks[i].slice('{{Epigraph\n'.length, -'\n}}'.length));
				i++;
			}
			result.push(`{{Epigraph\n${contents.join('\n\n')}\n}}`);
		} else {
			result.push(block); i++;
		}
	}
	return result;
}

function findPrev(blocks, i) {
	for (let j = i - 1; j >= 0; j--) if (blocks[j].type !== 'page_break') return blocks[j];
	return null;
}

function findNext(blocks, i) {
	for (let j = i + 1; j < blocks.length; j++) if (blocks[j].type !== 'page_break') return blocks[j];
	return null;
}

export function convert(input, formatName) {
	const format = formats[formatName] || formats['5ePHB'];

	let blocks = parse(input);
	blocks = format.insertPageBreaks(blocks);

	const pages = [[]];

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		if (block.type === 'page_break') { pages.push([]); continue; }

		const ctx = {
			prevBlock: findPrev(blocks, i),
			nextBlock: findNext(blocks, i),
			pageIndex: pages.length - 1,
			blockIndex: i
		};

		const transformer = format[block.type];
		if (typeof transformer === 'function') {
			const result = transformer.call(format, block, ctx);
			if (result != null) pages[pages.length - 1].push(result);
		} else {
			pages[pages.length - 1].push(
				format.reviewMarker(`Unknown block type: ${block.type}`) + '\n' + (block.raw || block.text || '')
			);
		}
	}

	for (let p = 0; p < pages.length; p++) {
		pages[p] = mergeConsecutiveEpigraphs(pages[p]);
	}

	const pageStrings = pages.map((pageBlocks, idx) => {
		const content = pageBlocks.filter(b => b.trim()).join('\n\n');
		if (idx === 0 && !content.trim()) return '';
		return format.wrapPage(content);
	}).filter(p => p.trim());

	return pageStrings.join('\n\n\\page\n\n');
}

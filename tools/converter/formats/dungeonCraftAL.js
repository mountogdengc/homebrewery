/**
 * V3/DungeonCraftAL format — Adventurers League official format.
 *
 * The most transformation-heavy format. Body text gets wrapped in
 * {{CoreBody}}, definition paragraphs in {{CoreHanging}}, etc.
 */

import base from './base.js';

export default {
	...base,
	name: 'DungeonCraftAL',

	pageBreakBeforeHeadings: [1],

	footer: `{{footnote\nNot for resale. Permission granted to print or photocopy this document for personal use only.\n}}`,

	paragraph(token, ctx) {
		const text = token.text.trim();

		// Epigraph: italic quote opening
		if (token.subtype === 'epigraph') {
			const lines = text.split('\n');
			const lastLine = lines[lines.length - 1].trim();
			if (lastLine.startsWith('—') || lastLine.startsWith('--')) {
				const quote = lines.slice(0, -1).join('\n');
				return `{{Epigraph\n${quote}\n}}\n{{EpigraphAuthor\n${lastLine}\n}}`;
			}
			return `{{Epigraph\n${text}\n}}`;
		}

		// Italic block (full italic paragraph — flavor text)
		if (token.subtype === 'italic_block') {
			return `{{Epigraph\n${text}\n}}`;
		}

		// Definition: **Label.** description
		if (token.subtype === 'definition') {
			return `{{CoreHanging\n${text}\n}}`;
		}

		// Short single-line that looks like a table title
		if (text.split('\n').length === 1 && text.length < 60
			&& ctx.nextBlock && ctx.nextBlock.type === 'table') {
			return `{{TableTitle\n${text}\n}}`;
		}

		// Default body text
		return `{{CoreBody\n${text}\n}}`;
	},

	blockquote(token, ctx) {
		const content = token.content.trim();

		// Sidebar: starts with heading
		if (content.startsWith('#####') || content.startsWith('##### ')) {
			// Split into heading and body
			const lines = content.split('\n');
			const heading = lines[0].replace(/^#+\s*/, '');
			const body = lines.slice(1).join('\n').trim();
			if (body) {
				return `{{note\n{{SidebarHeading\n${heading}\n}}\n{{SidebarBody\n${body}\n}}\n}}`;
			}
			return `{{note\n##### ${heading}\n}}`;
		}

		// Default: read-aloud boxed text
		return `{{BoxedText\n${content}\n}}`;
	},

	list(token, ctx) {
		const raw = token.items.join('\n');

		// If previous block was a definition (CoreHanging), these are sub-bullets
		if (ctx.prevBlock && ctx.prevBlock.type === 'paragraph' && ctx.prevBlock.subtype === 'definition') {
			return `{{HangingBullet\n${raw}\n}}`;
		}

		// Default bulleted list
		return `{{CoreBulleted\n${raw}\n}}`;
	},

	table(token, ctx) {
		// Table title was handled in paragraph() via nextBlock lookahead
		return token.rows.join('\n');
	},

	heading(token, _ctx) {
		return `${'#'.repeat(token.level)} ${token.text}`;
	}
};

/**
 * V3/5ePHB format — D&D 5e Player's Handbook style.
 *
 * Close to standard markdown. Blockquotes become notes,
 * {{descriptive}} is used for read-aloud text.
 */

import base from './base.js';

export default {
	...base,
	name: '5ePHB',

	pageBreakBeforeHeadings: [1],

	footer: null, // 5ePHB typically uses {{footnote PART | CHAPTER}}

	// Notes use blockquote syntax in 5ePHB
	blockquote(token, ctx) {
		const content = token.content.trim();

		// If it starts with ##### it's a sidebar/note — use {{note}}
		if (content.startsWith('#####')) {
			return `{{note\n${content}\n}}`;
		}

		// If preceded by an area heading (#### or "Area", "Room", "Chamber")
		// treat as read-aloud / descriptive
		if (ctx.prevBlock && ctx.prevBlock.type === 'heading' && ctx.prevBlock.level === 4) {
			return `{{descriptive\n${content}\n}}`;
		}

		// Default: treat as descriptive read-aloud
		return `{{descriptive\n${content}\n}}`;
	},

	paragraph(token, ctx) {
		// Epigraph detection
		if (token.subtype === 'epigraph') {
			const text = token.text.trim();
			// Check if there's an attribution (line starting with — or --)
			const lines = text.split('\n');
			const lastLine = lines[lines.length - 1].trim();
			if (lastLine.startsWith('—') || lastLine.startsWith('--')) {
				const quote = lines.slice(0, -1).join('\n');
				return `> ${quote.split('\n').join('\n> ')}\n>\n> ${lastLine}`;
			}
			// Simple blockquote for epigraph in 5ePHB
			return `> ${text.split('\n').join('\n> ')}`;
		}

		return token.text;
	},

	// 5ePHB uses standard markdown headings - no wrapping needed
	heading(token, _ctx) {
		return `${'#'.repeat(token.level)} ${token.text}`;
	},

	table(token, ctx) {
		// If previous block looks like a table title (short single line, bold or caps)
		let prefix = '';
		if (ctx.prevBlock && ctx.prevBlock.type === 'paragraph'
			&& ctx.prevBlock.text.split('\n').length === 1
			&& ctx.prevBlock.text.length < 60) {
			// The table title was already emitted as a paragraph, that's fine for 5ePHB
		}
		return prefix + token.rows.join('\n');
	}
};

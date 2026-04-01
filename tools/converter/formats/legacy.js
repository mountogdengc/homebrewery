/**
 * Legacy/5ePHB format — Older Homebrewery format.
 *
 * Uses HTML <div> syntax for some elements, blockquote-based notes.
 */

import base from './base.js';

export default {
	...base,
	name: 'Legacy',

	pageBreakBeforeHeadings: [1],

	pageNumbering: "<div class='pageNumber auto'></div>",
	footer:        "<div class='footnote'>PART 1 | CHAPTER NAME</div>",

	blockquote(token, ctx) {
		const content = token.content.trim();

		// Sidebar note: starts with heading
		if (content.startsWith('#####')) {
			return content.split('\n').map(l => `> ${l}`).join('\n');
		}

		// Read-aloud: use descriptive div
		return `<div class='descriptive'>\n${content}\n</div>`;
	},

	paragraph(token, _ctx) {
		// Legacy doesn't use wrapper classes — plain markdown
		if (token.subtype === 'epigraph' || token.subtype === 'italic_block') {
			return `> ${token.text.split('\n').join('\n> ')}`;
		}
		return token.text;
	},

	heading(token, _ctx) {
		return `${'#'.repeat(token.level)} ${token.text}`;
	},

	table(token, _ctx) {
		return token.rows.join('\n');
	},

	list(token, _ctx) {
		return token.items.join('\n');
	}
};

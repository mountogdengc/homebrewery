/**
 * V3/Blank format — Minimal base theme.
 *
 * Adds page structure (breaks, numbering) but no theme-specific wrappers.
 * Body text stays as plain markdown.
 */

import base from './base.js';

export default {
	...base,
	name: 'Blank',

	pageBreakBeforeHeadings: [1],
	footer: null,

	blockquote(token, _ctx) {
		const content = token.content.trim();
		// Use {{note}} for anything that looks like a sidebar
		if (content.startsWith('#####')) {
			return `{{note\n${content}\n}}`;
		}
		// Otherwise keep as blockquote
		return content.split('\n').map(l => `> ${l}`).join('\n');
	},

	paragraph(token, _ctx) {
		return token.text;
	},

	heading(token, _ctx) {
		return `${'#'.repeat(token.level)} ${token.text}`;
	}
};

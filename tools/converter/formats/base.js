/**
 * Base format definition.
 * All theme-specific formats extend this with overrides.
 */

export default {
	name: 'base',

	// Heading levels that trigger a \page before them (except the very first)
	pageBreakBeforeHeadings: [1],

	// Whether --- horizontal rules between sections become \page
	hrBecomesPageBreak: true,

	// Page furniture added to each page
	pageNumbering: '{{pageNumber,auto}}',
	footer:        null,

	// ── Token transformers ──────────────────────────────────────────────
	// Each receives (token, context) and returns a string (or null to skip).

	heading(token, _ctx) {
		return `${'#'.repeat(token.level)} ${token.text}`;
	},

	paragraph(token, _ctx) {
		return token.text;
	},

	blockquote(token, _ctx) {
		// Default: preserve as blockquote
		return token.content.split('\n').map(l => `> ${l}`).join('\n');
	},

	horizontal_rule(_token, _ctx) {
		return '---';
	},

	code_block(token, _ctx) {
		const fence = '```';
		return `${fence}${token.lang}\n${token.content}\n${fence}`;
	},

	table(token, _ctx) {
		return token.rows.join('\n');
	},

	list(token, _ctx) {
		return token.items.join('\n');
	},

	// ── Structural helpers ──────────────────────────────────────────────

	/**
	 * Decide where page breaks go based on token stream.
	 * Returns a new array with 'page_break' tokens inserted.
	 */
	insertPageBreaks(blocks) {
		const result = [];
		let isFirst = true;

		for (let i = 0; i < blocks.length; i++) {
			const block = blocks[i];

			// Page break before certain heading levels
			if (block.type === 'heading' && this.pageBreakBeforeHeadings.includes(block.level)) {
				if (!isFirst) {
					result.push({ type: 'page_break' });
				}
				isFirst = false;
			}

			// HR handling when hrBecomesPageBreak is enabled
			if (block.type === 'horizontal_rule' && this.hrBecomesPageBreak) {
				// Check context: preceded by heading OR followed by heading within 5 blocks
				const prev = result.length > 0 ? result[result.length - 1] : null;
				const next = blocks.slice(i + 1, i + 6).find(b => b.type !== 'empty');
				const prevIsHeading = prev && prev.type === 'heading';
				const nextIsHeading = next && next.type === 'heading';

				if (prevIsHeading || nextIsHeading) {
					// HR between sections → page break
					result.push({ type: 'page_break' });
					continue;
				}
				// Standalone HR between body content → keep as separator
			}

			result.push(block);
		}

		return result;
	},

	/**
	 * Add page furniture (page number, footer) to each page.
	 */
	wrapPage(pageContent) {
		const parts = [pageContent];
		if (this.footer) parts.push(this.footer);
		if (this.pageNumbering) parts.push(this.pageNumbering);
		return parts.join('\n\n');
	},

	/**
	 * Generate a review comment for ambiguous content.
	 */
	reviewMarker(message) {
		return `<!-- REVIEW: ${message} -->`;
	}
};

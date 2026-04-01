/**
 * Line-based markdown block tokenizer.
 * Produces an array of typed block tokens for the converter pipeline.
 */

// Patterns
const HEADING_RE    = /^(#{1,6})\s+(.+)$/;
const HR_RE         = /^(---+|___+|\*\*\*+)\s*$/;
const BLOCKQUOTE_RE = /^>\s?(.*)$/;
const UL_RE         = /^(\s*)([-*+])\s+(.+)$/;
const OL_RE         = /^(\s*)(\d+)[.)]\s+(.+)$/;
const FENCE_RE      = /^(`{3,}|~{3,})(.*)$/;
const TABLE_SEP_RE  = /^\|[\s:|-]+\|$/;
const EMPTY_RE      = /^\s*$/;
const DEFINITION_RE = /^\*\*[^*]+[.:]\*\*\s+/; // **Label.** or **Label:** text
const EPIGRAPH_RE   = /^\*[""\u201C]/;          // *" or *\u201C (smart quote)
const ITALIC_BLOCK_RE = /^\*[^*]/;              // starts with single * (italic)

/**
 * Parse markdown text into block tokens.
 * @param {string} input - Raw markdown text
 * @returns {Array<Object>} Array of block tokens
 */
export function parse(input) {
	const lines = input.split(/\r?\n/);
	const blocks = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		// Empty line
		if (EMPTY_RE.test(line)) {
			i++;
			continue;
		}

		// Heading
		const headingMatch = line.match(HEADING_RE);
		if (headingMatch) {
			blocks.push({
				type:  'heading',
				level: headingMatch[1].length,
				text:  headingMatch[2],
				raw:   line
			});
			i++;
			continue;
		}

		// Horizontal rule
		if (HR_RE.test(line)) {
			blocks.push({ type: 'horizontal_rule', raw: line });
			i++;
			continue;
		}

		// Fenced code block
		const fenceMatch = line.match(FENCE_RE);
		if (fenceMatch) {
			const fence = fenceMatch[1];
			const lang = fenceMatch[2].trim();
			const contentLines = [];
			i++;
			while (i < lines.length && !lines[i].startsWith(fence.charAt(0).repeat(fence.length))) {
				contentLines.push(lines[i]);
				i++;
			}
			if (i < lines.length) i++; // skip closing fence
			blocks.push({
				type:    'code_block',
				lang,
				content: contentLines.join('\n'),
				raw:     line + '\n' + contentLines.join('\n') + '\n' + fence
			});
			continue;
		}

		// Table (look ahead for separator row)
		if (line.includes('|')) {
			const tableLines = [];
			let j = i;
			let hasSep = false;
			while (j < lines.length && (lines[j].includes('|') || EMPTY_RE.test(lines[j]))) {
				if (EMPTY_RE.test(lines[j])) break;
				if (TABLE_SEP_RE.test(lines[j].trim())) hasSep = true;
				tableLines.push(lines[j]);
				j++;
			}
			if (hasSep && tableLines.length >= 2) {
				blocks.push({
					type: 'table',
					rows: tableLines,
					raw:  tableLines.join('\n')
				});
				i = j;
				continue;
			}
		}

		// Blockquote
		if (BLOCKQUOTE_RE.test(line)) {
			const quoteLines = [];
			while (i < lines.length && BLOCKQUOTE_RE.test(lines[i])) {
				quoteLines.push(lines[i].replace(BLOCKQUOTE_RE, '$1'));
				i++;
			}
			blocks.push({
				type:    'blockquote',
				content: quoteLines.join('\n'),
				raw:     quoteLines.map(l => `> ${l}`).join('\n')
			});
			continue;
		}

		// List (unordered or ordered)
		if (UL_RE.test(line) || OL_RE.test(line)) {
			const ordered = OL_RE.test(line);
			const listLines = [];
			const listRe = ordered ? OL_RE : UL_RE;
			while (i < lines.length) {
				if (listRe.test(lines[i])) {
					listLines.push(lines[i]);
					i++;
				} else if (/^\s{2,}/.test(lines[i]) && !EMPTY_RE.test(lines[i])) {
					// continuation line (indented)
					listLines.push(lines[i]);
					i++;
				} else if (EMPTY_RE.test(lines[i]) && i + 1 < lines.length && (listRe.test(lines[i + 1]) || /^\s{2,}/.test(lines[i + 1]))) {
					// blank line within list
					listLines.push(lines[i]);
					i++;
				} else {
					break;
				}
			}
			blocks.push({
				type:    'list',
				ordered,
				items:   listLines,
				raw:     listLines.join('\n')
			});
			continue;
		}

		// Paragraph (accumulate until blank line, heading, HR, fence, or list)
		{
			const paraLines = [];
			while (i < lines.length
				&& !EMPTY_RE.test(lines[i])
				&& !HEADING_RE.test(lines[i])
				&& !HR_RE.test(lines[i])
				&& !FENCE_RE.test(lines[i])
				&& !BLOCKQUOTE_RE.test(lines[i])
				&& !(lines[i].includes('|') && i + 1 < lines.length && TABLE_SEP_RE.test((lines[i + 1] || '').trim()))
			) {
				paraLines.push(lines[i]);
				i++;
			}

			if (paraLines.length > 0) {
				const text = paraLines.join('\n');
				// Sub-classify paragraphs
				let subtype = 'plain';
				if (DEFINITION_RE.test(text)) {
					subtype = 'definition';
				} else if (EPIGRAPH_RE.test(text.trim())) {
					subtype = 'epigraph';
				} else if (ITALIC_BLOCK_RE.test(text.trim()) && text.trim().endsWith('*')) {
					subtype = 'italic_block';
				}

				blocks.push({
					type:    'paragraph',
					subtype,
					text,
					raw:     text
				});
			}
		}
	}

	return blocks;
}

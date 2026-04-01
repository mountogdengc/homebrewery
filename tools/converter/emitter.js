/**
 * Output serializer.
 * Takes an array of transformed block strings and joins them
 * with proper spacing.
 */

/**
 * Join block strings with appropriate blank-line spacing.
 * @param {string[]} blocks - Array of transformed block strings
 * @returns {string} Serialized output
 */
export function emit(blocks) {
	if (blocks.length === 0) return '';

	const result = [];

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i].trim();
		if (!block) continue;

		// Collapse multiple blank lines
		result.push(block);
	}

	// Join blocks with a single blank line between them
	return result.join('\n\n');
}

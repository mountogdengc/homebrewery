const FOOTNOTE_RE = /\n*\{\{footnote[\s\S]*?\}\}\s*/g;
const PAGENUM_RE = /\n*\{\{pageNumber,auto\}\}\s*/g;

export function injectFooters(markdown, metadata) {
	const { title, adventureCode, adventureVersion } = metadata;
	if(!title || !adventureCode || !adventureVersion) return null;

	const footer =
		`{{footnote\n` +
		`Not for resale. Permission granted to print or photocopy this document for personal use only.\n` +
		`\n` +
		`${adventureCode} ${title} (${adventureVersion})\n` +
		`}}\n\n` +
		`{{pageNumber,auto}}`;

	const pages = markdown.split(/\n\n\\page\n\n/);

	const processed = pages.map((page)=>{
		let cleaned = page
			.replace(FOOTNOTE_RE, '')
			.replace(PAGENUM_RE, '')
			.trimEnd();
		return `${cleaned}\n\n${footer}`;
	});

	return processed.join('\n\n\\page\n\n');
}

import dedent from 'dedent';

// Map each actual page to its footer label, accounting for skips or numbering resets
const mapPages = (pages)=>{
	let actualPage = 0;
	let mappedPage = 0;
	const pageMap  = [];

	pages.forEach((page)=>{
		actualPage++;
		const doSkip  = page.querySelector('.skipCounting');
		const doReset = page.querySelector('.resetCounting');

		if(doReset)
			mappedPage = 1;
		if(!doSkip && !doReset)
			mappedPage++;

		pageMap[actualPage] = {
			mappedPage : mappedPage,
			showPage   : !doSkip
		};
	});
	return pageMap;
};

const getMarkdown = (headings, pageMap)=>{
	const levelPad    = ['- ###', '  - ####', '    -', '      -', '        -', '          -'];

	const allMarkdown = [];
	const depthChain  = [0];

	headings.forEach((heading)=>{
		const page       = parseInt(heading.closest('.page').id?.replace(/^p/, ''));
		const mappedPage = pageMap[page].mappedPage;
		const showPage   = pageMap[page].showPage;
		const title      = heading.textContent.trim();
		const ToCExclude = getComputedStyle(heading).getPropertyValue('--TOC');
		const depth      = parseInt(heading.tagName.substring(1));

		if(!title || !showPage || ToCExclude == 'exclude')
			return;

		if(depth !== depthChain[depthChain.length - 1]) {
			while (depth <= depthChain[depthChain.length - 1]) {
				depthChain.pop();
			}
			depthChain.push(depth);
		}

		const markdown = `${levelPad[depthChain.length - 2]} [{{ ${title}}}{{ ${mappedPage}}}](#p${page})`;
		allMarkdown.push(markdown);
	});
	return allMarkdown;
};

const getTOC = ()=>{
	const iframe = document.getElementById('BrewRenderer');
	const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
	const headings = iframeDocument.querySelectorAll('h1, h2, h3, h4, h5, h6');
	const pages    = iframeDocument.querySelectorAll('.page');

	const pageMap = mapPages(pages);
	return getMarkdown(headings, pageMap);
};

// Split ToC entries into pages. Each page gets its own {{toc,wide}} block
// separated by \page so the ToC can span multiple brew pages.
// Splits only at top-level heading boundaries (### or ####) to avoid
// orphaned sub-entries at the start of a page.
const ENTRIES_PER_PAGE = 80;

function isHeadingEntry(entry) {
	return entry.trimStart().startsWith('- ###') || entry.trimStart().startsWith('- ####');
}

export default function(props) {
	const entries = getTOC();

	if(entries.length === 0) {
		return dedent`
			{{toc,wide
			# Contents

			*No headings found.*
			}}
			\n`;
	}

	// Split into chunks, breaking only at heading entries
	const chunks = [];
	let current = [];

	for (let i = 0; i < entries.length; i++) {
		current.push(entries[i]);
		if(current.length >= ENTRIES_PER_PAGE && i + 1 < entries.length) {
			// Look ahead for the next heading to split at
			for (let j = i + 1; j < entries.length; j++) {
				if(isHeadingEntry(entries[j])) {
					chunks.push(current);
					current = [];
					break;
				}
				// Include trailing sub-entries in the current chunk
				current.push(entries[++i]);
			}
		}
	}
	if(current.length > 0) chunks.push(current);

	const pages = chunks.map((chunk, idx)=>{
		const title = idx === 0 ? '# Contents\n\n' : '';
		return `{{toc,wide\n${title}${chunk.join('\n')}\n}}`;
	});

	return `\n${pages.join('\n\n\\\\page\n\n')}\n`;
};

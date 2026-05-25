/* eslint-disable max-lines */
// convert-docx.js - Markdown to .docx conversion (ES module)
// Takes Homebrewery-flavored markdown and returns a styled DOCX Buffer.

import {
	AlignmentType,
	BorderStyle,
	Document,
	Footer,
	Packer,
	PageBreak,
	Paragraph,
	ShadingType,
	TextRun,
} from 'docx';

const HEADING_MAP = {
	1 : 'Heading1',
	2 : 'Heading2',
	3 : 'Heading3',
	4 : 'Heading4',
	5 : 'Heading5',
};

const CALLOUT_STYLES = {
	note    : { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Body Bullets' },
	warning : { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Body Bullets' },
	example : { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Body Bullets' },
};

const BLOCK_STYLES = {
	corebody        : 'CoreBody',
	corehanging     : 'CoreHanging',
	hangingcontinue : 'HangingContinue',
	corebulleted    : 'CoreBulleted',
	hangingbullet   : 'HangingBullet',
	coremetadata    : 'CoreMetadata',
	boxedtext       : 'Boxed Text',
	epigraph        : 'CoreEpigraph',
	epigraphauthor  : 'EpigraphAuthor',
	listheading     : 'List Heading',
	listheader      : 'List Header',
	listitem        : 'List Item',
	creditlegal     : 'CreditLegal',
	tabletitle      : 'TableTitle',
	sidebarheading  : 'Sidebar Heading',
	sidebarbody     : 'Sidebar Body',
	sidebarbulleted : 'Sidebar Body Bullets',
	legal           : 'CreditLegal',
};

const DROP_BLOCKS = new Set([
	'pagenumber',
	'toc',
	'tableofcontents',
]);

const FOOTER_BLOCKS = new Set([
	'footnote',
	'pagefooter',
]);

const BULLET_STYLES = new Set([
	'CoreBulleted',
	'HangingBullet',
	'Sidebar Body Bullets',
]);

function normalizeTag(tag) {
	return (tag || '').toLowerCase().replace(/[-_]/g, '');
}

function getBlockOpen(trimmed) {
	const match = trimmed.match(/^\{\{\s*([A-Za-z][\w-]*)(.*)$/);
	if(!match) return null;

	const tag = normalizeTag(match[1]);
	const isClosed = /\}\}\s*$/.test(trimmed);
	let rest = match[2] || '';

	if(isClosed)
		rest = rest.replace(/\}\}\s*$/, '');

	rest = rest.trim();
	if(rest.startsWith(','))
		rest = '';

	return { tag, isClosed, content: rest };
}

function parseInline(rawText) {
	if(!rawText) return [new TextRun('')];

	const runs = [];
	const pattern = /(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/gs;
	let lastIndex = 0;
	let match;

	while ((match = pattern.exec(rawText)) !== null) {
		if(match.index > lastIndex)
			runs.push(new TextRun(rawText.slice(lastIndex, match.index)));

		if(match[1].startsWith('***'))
			runs.push(new TextRun({ text: match[2] || '', bold: true, italics: true }));
		else if(match[1].startsWith('**'))
			runs.push(new TextRun({ text: match[3] || '', bold: true }));
		else if(match[1].startsWith('*'))
			runs.push(new TextRun({ text: match[4] || '', italics: true }));
		else if(match[1].startsWith('`'))
			runs.push(new TextRun({ text: match[5] || '', font: 'Courier New' }));

		lastIndex = match.index + match[0].length;
	}

	if(lastIndex < rawText.length)
		runs.push(new TextRun(rawText.slice(lastIndex)));

	return runs.length ? runs : [new TextRun('')];
}

function styledPara(styleId, rawText) {
	return new Paragraph({ style: styleId, children: parseInline(rawText) });
}

function topActive(stack, type) {
	for (let i = stack.length - 1; i >= 0; i--) {
		if(stack[i].type === type) return stack[i];
	}
	return null;
}

function tableRowText(trimmed) {
	return trimmed.split('|').map((cell)=>cell.trim()).filter(Boolean).join('\t');
}

function pushStyledContent(paragraphs, style, trimmed) {
	if(trimmed === '') return;

	const heading = trimmed.match(/^(#+)\s+(.*)/);
	if(heading && style.startsWith('Sidebar')) {
		paragraphs.push(styledPara('Sidebar Heading', heading[2]));
		return;
	}

	if(/^[-*]\s/.test(trimmed) && (BULLET_STYLES.has(style) || style === 'CoreBody')) {
		paragraphs.push(styledPara(BULLET_STYLES.has(style) ? style : 'CoreBulleted', trimmed.slice(2)));
		return;
	}

	if(/^\d+\.\s/.test(trimmed) && style === 'CoreBody') {
		paragraphs.push(styledPara('CoreNumberedList', trimmed.replace(/^\d+\.\s/, '')));
		return;
	}

	paragraphs.push(styledPara(style, trimmed));
}

function pushCalloutContent(paragraphs, callout, trimmed, tableState) {
	if(trimmed === '') return;

	if(trimmed.startsWith('|')) {
		if(!tableState.inTable) {
			tableState.inTable = true;
			tableState.firstRow = true;
		}
		if(/^\|[\|\-\s:]+\|$/.test(trimmed)) {
			tableState.firstRow = false;
			return;
		}
		paragraphs.push(styledPara(tableState.firstRow ? callout.heading : callout.body, tableRowText(trimmed)));
		return;
	}

	tableState.inTable = false;
	tableState.firstRow = true;

	const heading = trimmed.match(/^(#+)\s+(.*)/);
	if(heading)
		paragraphs.push(styledPara(callout.heading, heading[2]));
	else if(/^[-*]\s/.test(trimmed))
		paragraphs.push(styledPara(callout.bullet, trimmed.slice(2)));
	else
		paragraphs.push(styledPara(callout.body, trimmed));
}

function createDocument(paragraphs, footerLines) {
	const footerChildren = footerLines.map((line)=>
		new Paragraph({ children: parseInline(line), style: 'Footnote', alignment: AlignmentType.LEFT })
	);

	const sectionProps = { children: paragraphs };
	if(footerChildren.length) {
		sectionProps.footers = {
			default: new Footer({ children: footerChildren }),
		};
	}

	return new Document({
		styles : {
			paragraphStyles : [
				// Fonts and sizes from ALStyles.txt (InDesign AL template)
				// docx size = half-points (9pt = 18), indent/spacing in twips (1440/inch)
				{ id: 'Normal', name: 'Normal', run: { font: 'Times New Roman', size: 18 }, paragraph: { spacing: { after: 90 } } },
				{ id: 'CoreBody', name: 'CoreBody', basedOn: 'Normal', paragraph: { spacing: { after: 90 } } },
				{ id: 'CoreHanging', name: 'CoreHanging', run: { font: 'Times New Roman', size: 18 }, paragraph: { indent: { left: 180, hanging: 180 }, spacing: { after: 0 } } },
				{ id: 'HangingContinue', name: 'HangingContinue', basedOn: 'CoreBody', paragraph: { indent: { left: 180 }, spacing: { after: 90 } } },
				{ id: 'CoreBulleted', name: 'CoreBulleted', basedOn: 'CoreBody', paragraph: { indent: { left: 360, hanging: 180 }, spacing: { after: 90 } } },
				{ id: 'HangingBullet', name: 'HangingBullet', basedOn: 'CoreBulleted', paragraph: { indent: { left: 540, hanging: 180 }, spacing: { after: 90 } } },
				{ id: 'CoreNumberedList', name: 'CoreNumberedList', basedOn: 'CoreBody', paragraph: { indent: { left: 360, hanging: 180 }, spacing: { after: 90 } } },
				{ id: 'CoreMetadata', name: 'CoreMetadata', basedOn: 'CoreBody', run: { italics: true }, paragraph: { spacing: { after: 90 } } },
				{ id: 'Boxed Text', name: 'Boxed Text', basedOn: 'CoreBody', paragraph: { indent: { left: 180 }, spacing: { before: 90, after: 90 }, border: { top: { style: BorderStyle.SINGLE, size: 1, space: 4 }, bottom: { style: BorderStyle.SINGLE, size: 1, space: 4 }, left: { style: BorderStyle.SINGLE, size: 1, space: 4 }, right: { style: BorderStyle.SINGLE, size: 1, space: 4 } } } },
				{ id: 'CoreEpigraph', name: 'CoreEpigraph', basedOn: 'CoreBody', run: { italics: true }, paragraph: { indent: { left: 180, right: 180 }, spacing: { before: 90, after: 90 } } },
				{ id: 'EpigraphAuthor', name: 'EpigraphAuthor', basedOn: 'CoreBody', run: { italics: true }, paragraph: { alignment: AlignmentType.RIGHT, indent: { right: 180 }, spacing: { after: 90 } } },
				{ id: 'List Heading', name: 'List Heading', run: { font: 'Cambria', size: 24 }, paragraph: { spacing: { after: 0 } } },
				{ id: 'List Header', name: 'List Header', basedOn: 'List Item', run: { bold: true }, paragraph: { spacing: { before: 90, after: 90 } } },
				{ id: 'List Item', name: 'List Item', run: { font: 'Cambria', size: 20 }, paragraph: { indent: { left: 187, firstLine: 180 }, spacing: { after: 240 } } },
				{ id: 'CreditLegal', name: 'CreditLegal', basedOn: 'Normal', run: { size: 12 }, paragraph: { spacing: { after: 40 } } },
				{ id: 'Footnote', name: 'Footnote', basedOn: 'Normal', run: { size: 14 }, paragraph: { spacing: { after: 40 } } },
				{ id: 'TableTitle', name: 'TableTitle', basedOn: 'CoreBody', run: { bold: true, smallCaps: true }, paragraph: { spacing: { before: 90, after: 40 } } },
				{ id: 'TABLE HEADER', name: 'TABLE HEADER', basedOn: 'TABLE CELL', run: { bold: true }, paragraph: { spacing: { after: 40 } } },
				{ id: 'TABLE CELL', name: 'TABLE CELL', basedOn: 'CoreBody', paragraph: { spacing: { after: 40 } } },
				{ id: 'Sidebar Heading', name: 'Sidebar Heading', run: { font: 'Times New Roman', size: 24 }, paragraph: { spacing: { before: 90, after: 0 }, shading: { type: ShadingType.CLEAR, fill: 'E8D9B0' } } },
				{ id: 'Sidebar Body', name: 'Sidebar Body', run: { font: 'Times New Roman', size: 18 }, paragraph: { spacing: { after: 90 }, shading: { type: ShadingType.CLEAR, fill: 'E8D9B0' } } },
				{ id: 'Sidebar Body Bullets', name: 'Sidebar Body Bullets', run: { font: 'Times New Roman', size: 18 }, paragraph: { indent: { left: 90 }, spacing: { after: 90 }, shading: { type: ShadingType.CLEAR, fill: 'E8D9B0' } } },
				{ id: 'Heading1', name: 'Heading1', next: 'CoreBody', run: { font: 'Montserrat', size: 36 }, paragraph: { spacing: { before: 90, after: 90 } } },
				{ id: 'Heading2', name: 'Heading2', basedOn: 'Heading1', next: 'CoreBody', run: { font: 'Montserrat', size: 28 }, paragraph: { spacing: { before: 90, after: 180 } } },
				{ id: 'Heading3', name: 'Heading3', basedOn: 'Heading1', next: 'CoreBody', run: { font: 'Times New Roman', size: 24 }, paragraph: { spacing: { before: 90, after: 90 } } },
				{ id: 'Heading4', name: 'Heading4', basedOn: 'Heading1', next: 'CoreBody', run: { font: 'Times New Roman', size: 22, bold: true, italics: true }, paragraph: { spacing: { before: 90, after: 90 } } },
				{ id: 'Heading5', name: 'Heading5', basedOn: 'Heading1', next: 'CoreBody', run: { font: 'Times New Roman', size: 20, bold: true, smallCaps: true }, paragraph: { spacing: { before: 90, after: 40 } } },
			],
		},
		sections : [sectionProps],
	});
}

export async function convertMarkdownToDocx(markdown) {
	const lines = markdown.split('\n');
	const paragraphs = [];
	const footerLines = [];
	const stack = [];
	const tableState = { inTable: false, firstRow: true };

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();

		if(trimmed === '}}') {
			stack.pop();
			continue;
		}

		if(topActive(stack, 'drop'))
			continue;

		if(topActive(stack, 'footer')) {
			if(trimmed !== '') footerLines.push(trimmed);
			continue;
		}

		if(/^\\page\b/.test(trimmed) || /^\\column\b/.test(trimmed)) {
			paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
			continue;
		}

		if(/^<!--/.test(trimmed) || /^!\[/.test(trimmed) || /^:+$/.test(trimmed))
			continue;

		const blockOpen = getBlockOpen(trimmed);
		if(blockOpen) {
			const callout = CALLOUT_STYLES[blockOpen.tag];
			const style = BLOCK_STYLES[blockOpen.tag];

			if(DROP_BLOCKS.has(blockOpen.tag)) {
				if(!blockOpen.isClosed)
					stack.push({ type: 'drop' });
				continue;
			}

			if(FOOTER_BLOCKS.has(blockOpen.tag)) {
				if(blockOpen.content)
					footerLines.push(blockOpen.content);
				if(!blockOpen.isClosed)
					stack.push({ type: 'footer' });
				continue;
			}

			if(callout) {
				if(blockOpen.content)
					pushCalloutContent(paragraphs, callout, blockOpen.content, tableState);
				if(!blockOpen.isClosed)
					stack.push({ type: 'callout', styles: callout });
				continue;
			}

			if(style) {
				if(blockOpen.content)
					pushStyledContent(paragraphs, style, blockOpen.content);
				if(!blockOpen.isClosed)
					stack.push({ type: 'style', style });
				continue;
			}

			if(!blockOpen.isClosed)
				stack.push({ type: 'passthrough' });
			continue;
		}

		const activeStyle = topActive(stack, 'style');
		if(activeStyle) {
			pushStyledContent(paragraphs, activeStyle.style, trimmed);
			continue;
		}

		const activeCallout = topActive(stack, 'callout');
		if(activeCallout) {
			pushCalloutContent(paragraphs, activeCallout.styles, trimmed, tableState);
			continue;
		}

		const heading = trimmed.match(/^(#+)\s+(.*)/);
		if(heading) {
			paragraphs.push(styledPara(HEADING_MAP[Math.min(heading[1].length, 5)], heading[2]));
			continue;
		}

		if(/^[-*]{3,}$/.test(trimmed) || trimmed === '')
			continue;

		if(trimmed.startsWith('|')) {
			if(!tableState.inTable) {
				tableState.inTable = true;
				tableState.firstRow = true;
			}
			if(/^\|[\|\-\s:]+\|$/.test(trimmed)) {
				tableState.firstRow = false;
				continue;
			}
			paragraphs.push(styledPara(tableState.firstRow ? 'TABLE HEADER' : 'TABLE CELL', tableRowText(trimmed)));
			continue;
		}

		tableState.inTable = false;
		tableState.firstRow = true;

		if(/^[-*]\s/.test(trimmed)) {
			paragraphs.push(styledPara('CoreBulleted', trimmed.slice(2)));
			continue;
		}

		if(/^\d+\.\s/.test(trimmed)) {
			paragraphs.push(styledPara('CoreNumberedList', trimmed.replace(/^\d+\.\s/, '')));
			continue;
		}

		if(/^\[NPC:|^\[STAT/.test(trimmed)) {
			paragraphs.push(styledPara('CoreBody', `[[ STAT BLOCK: ${trimmed} ]]`));
			continue;
		}

		paragraphs.push(styledPara('CoreBody', trimmed));
	}

	return Packer.toBuffer(createDocument(paragraphs, footerLines));
}

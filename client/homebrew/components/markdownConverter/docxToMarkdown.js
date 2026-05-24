import mammoth from 'mammoth';
import TurndownService from 'turndown';

const turndown = new TurndownService({
	headingStyle    : 'atx',
	bulletListMarker: '-',
	codeBlockStyle  : 'fenced',
	emDelimiter     : '*',
});

// Skip images entirely
turndown.addRule('skipImages', {
	filter: 'img',
	replacement: ()=>''
});

export async function docxToMarkdown(arrayBuffer) {
	const result = await mammoth.convertToHtml({
		arrayBuffer,
		convertImage: mammoth.images.imgElement(()=>Promise.resolve({ src: '' })),
	});
	const markdown = turndown.turndown(result.value);
	return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

import mammoth from 'mammoth';

export async function docxToMarkdown(arrayBuffer) {
	const result = await mammoth.convertToMarkdown({ arrayBuffer });
	return result.value;
}

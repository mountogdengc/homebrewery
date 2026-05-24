import { docxToMarkdown } from './docxToMarkdown.js';

// mammoth is mocked — we're testing our wrapper logic, not mammoth itself
const imgElementSentinel = { _sentinel: 'imgElement' };
jest.mock('mammoth', ()=>({
	convertToHtml: jest.fn(),
	images: { imgElement: jest.fn(()=>imgElementSentinel) }
}));

// turndown is NOT mocked — we test the real HTML-to-markdown pipeline
import mammoth from 'mammoth';

describe('docxToMarkdown', ()=>{
	beforeEach(()=>{
		jest.resetAllMocks();
		mammoth.images.imgElement.mockReturnValue(imgElementSentinel);
	});

	it('converts HTML from mammoth into markdown', async ()=>{
		mammoth.convertToHtml.mockResolvedValue({ value: '<h1>Hello</h1><p>World</p>' });
		const buf = new ArrayBuffer(8);
		const result = await docxToMarkdown(buf);
		expect(mammoth.convertToHtml).toHaveBeenCalledWith({
			arrayBuffer: buf,
			convertImage: imgElementSentinel,
		});
		expect(result).toBe('# Hello\n\nWorld');
	});

	it('preserves bold and italic formatting', async ()=>{
		mammoth.convertToHtml.mockResolvedValue({ value: '<p><strong>Bold</strong> and <em>italic</em></p>' });
		const buf = new ArrayBuffer(8);
		const result = await docxToMarkdown(buf);
		expect(result).toBe('**Bold** and *italic*');
	});

	it('converts lists to markdown', async ()=>{
		mammoth.convertToHtml.mockResolvedValue({ value: '<ul><li>First</li><li>Second</li></ul>' });
		const buf = new ArrayBuffer(8);
		const result = await docxToMarkdown(buf);
		expect(result).toBe('-   First\n-   Second');
	});

	it('strips images from output', async ()=>{
		mammoth.convertToHtml.mockResolvedValue({ value: '<p>Text</p><img src="data:image/png;base64,abc"/><p>More</p>' });
		const buf = new ArrayBuffer(8);
		const result = await docxToMarkdown(buf);
		expect(result).toBe('Text\n\nMore');
	});

	it('throws when mammoth rejects', async ()=>{
		mammoth.convertToHtml.mockRejectedValue(new Error('bad file'));
		const buf = new ArrayBuffer(8);
		await expect(docxToMarkdown(buf)).rejects.toThrow('bad file');
	});
});

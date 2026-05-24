import { docxToMarkdown } from './docxToMarkdown.js';

// mammoth is mocked — we're testing our wrapper logic, not mammoth itself
jest.mock('mammoth', ()=>({
	convertToMarkdown: jest.fn()
}));
import mammoth from 'mammoth';

describe('docxToMarkdown', ()=>{
	beforeEach(()=>{
		jest.resetAllMocks();
	});

	it('passes arrayBuffer to mammoth and returns the markdown value', async ()=>{
		mammoth.convertToMarkdown.mockResolvedValue({ value: '# Hello\n\nWorld' });
		const buf = new ArrayBuffer(8);
		const result = await docxToMarkdown(buf);
		expect(mammoth.convertToMarkdown).toHaveBeenCalledWith({ arrayBuffer: buf });
		expect(result).toBe('# Hello\n\nWorld');
	});

	it('throws when mammoth rejects', async ()=>{
		mammoth.convertToMarkdown.mockRejectedValue(new Error('bad file'));
		const buf = new ArrayBuffer(8);
		await expect(docxToMarkdown(buf)).rejects.toThrow('bad file');
	});
});

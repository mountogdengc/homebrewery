import { injectFooters } from './injectFooters.js';

describe('injectFooters', ()=>{
	const metadata = {
		title            : 'The Lost Temple',
		adventureCode    : 'FR-DC-ABC-01',
		adventureVersion : 'v1.0',
	};

	const footer = `{{footnote\nNot for resale. Permission granted to print or photocopy this document for personal use only.\n\nFR-DC-ABC-01 The Lost Temple (v1.0)\n}}\n\n{{pageNumber,auto}}`;

	it('appends footer to a single page with no existing footer', ()=>{
		const input = '# Chapter 1\n\nSome text.';
		const result = injectFooters(input, metadata);
		expect(result).toBe(`# Chapter 1\n\nSome text.\n\n${footer}`);
	});

	it('appends footer to each page in a multi-page document', ()=>{
		const input = '# Page 1\n\nText.\n\n\\page\n\n# Page 2\n\nMore text.';
		const result = injectFooters(input, metadata);
		expect(result).toBe(`# Page 1\n\nText.\n\n${footer}\n\n\\page\n\n# Page 2\n\nMore text.\n\n${footer}`);
	});

	it('replaces existing {{footnote}} and {{pageNumber,auto}} blocks', ()=>{
		const input = '# Chapter 1\n\nText.\n\n{{footnote\nOld footer content.\n}}\n\n{{pageNumber,auto}}';
		const result = injectFooters(input, metadata);
		expect(result).toBe(`# Chapter 1\n\nText.\n\n${footer}`);
	});

	it('replaces existing footers on multiple pages', ()=>{
		const page1 = '# Page 1\n\nText.\n\n{{footnote\nOld.\n}}\n\n{{pageNumber,auto}}';
		const page2 = '# Page 2\n\nMore.\n\n{{footnote\nAlso old.\n}}\n\n{{pageNumber,auto}}';
		const input = `${page1}\n\n\\page\n\n${page2}`;
		const result = injectFooters(input, metadata);
		expect(result).toBe(`# Page 1\n\nText.\n\n${footer}\n\n\\page\n\n# Page 2\n\nMore.\n\n${footer}`);
	});

	it('returns null with missing title', ()=>{
		const result = injectFooters('text', { ...metadata, title: '' });
		expect(result).toBeNull();
	});

	it('returns null with missing adventureCode', ()=>{
		const result = injectFooters('text', { ...metadata, adventureCode: '' });
		expect(result).toBeNull();
	});

	it('returns null with missing adventureVersion', ()=>{
		const result = injectFooters('text', { ...metadata, adventureVersion: '' });
		expect(result).toBeNull();
	});
});

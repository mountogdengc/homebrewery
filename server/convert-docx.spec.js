import { unzipSync } from 'fflate';

import { convertMarkdownToDocx } from './convert-docx.js';

function readDocxPart(buffer, partName) {
	const files = unzipSync(new Uint8Array(buffer));
	return new TextDecoder().decode(files[partName]);
}

describe('convertMarkdownToDocx', ()=>{
	test('preserves Homebrewery AL block styles as Word paragraph styles', async ()=>{
		const buffer = await convertMarkdownToDocx(`
# Chapter Title

{{CoreHanging
**Light.** The room is dim.
}}

{{BoxedText
Read this aloud.
}}

{{TableTitle
Encounter Adjustments
}}

| Party | Adjustment |
|:--|:--|
| Weak | Remove one guard |

{{note
##### DM Tip
Keep the scene moving.
- Use simple DCs.
}}

{{footnote
Footer text
}}

{{pageNumber,auto}}
`);

		const stylesXml = readDocxPart(buffer, 'word/styles.xml');
		const documentXml = readDocxPart(buffer, 'word/document.xml');

		expect(stylesXml).toContain('w:styleId="CoreHanging"');
		expect(stylesXml).toContain('w:styleId="Boxed Text"');
		expect(stylesXml).toContain('w:styleId="TableTitle"');
		expect(stylesXml).toContain('w:styleId="Sidebar Body"');
		expect(stylesXml).toContain('w:name w:val="Heading1"');
		expect(stylesXml).toContain('w:name w:val="Boxed Text"');
		expect(stylesXml).toContain('w:name w:val="Sidebar Body Bullets"');
		expect(stylesXml).toContain('w:name w:val="TABLE HEADER"');
		expect(stylesXml).toContain('w:name w:val="TABLE CELL"');
		expect(documentXml).toContain('w:pStyle w:val="Heading1"');
		expect(documentXml).toContain('w:pStyle w:val="CoreHanging"');
		expect(documentXml).toContain('w:pStyle w:val="Boxed Text"');
		expect(documentXml).toContain('w:pStyle w:val="TableTitle"');
		expect(documentXml).toContain('w:pStyle w:val="TABLE HEADER"');
		expect(documentXml).toContain('w:pStyle w:val="TABLE CELL"');
		expect(documentXml).toContain('w:pStyle w:val="Sidebar Heading"');
		expect(documentXml).toContain('w:pStyle w:val="Sidebar Body"');
		expect(documentXml).toContain('w:pStyle w:val="Sidebar Body Bullets"');
		expect(documentXml).toContain('w:pStyle w:val="Footnote"');
		expect(documentXml).not.toContain('{{pageNumber');
	});
});

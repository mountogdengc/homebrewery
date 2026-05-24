import dedent from 'dedent';
import Markdown from '../../shared/markdown.js';

String.prototype.trimReturns = function(){
	return this.replace(/\r?\n|\r/g, '');
};

describe('Art Block: {{art}} syntax', ()=>{
	describe('Tokenizer', ()=>{
		it('Renders a basic art block with src, x, y, w', function() {
			const source = dedent`{{art
				src: /images/map.png
				x: 0.45in
				y: 1.2in
				w: 3.25in
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('<img');
			expect(rendered).toContain('class="art-block"');
			expect(rendered).toContain('src="/images/map.png"');
			expect(rendered).toContain('left:0.45in');
			expect(rendered).toContain('top:1.2in');
			expect(rendered).toContain('width:3.25in');
		});

		it('Renders an art block with only src (uses defaults)', function() {
			const source = dedent`{{art
				src: /images/map.png
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('src="/images/map.png"');
			expect(rendered).toContain('left:0in');
			expect(rendered).toContain('top:0in');
			expect(rendered).toContain('width:100%');
		});

		it('Renders an art block with z: behind', function() {
			const source = dedent`{{art
				src: /images/map.png
				z: behind
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('z-index:-1');
		});

		it('Renders an art block with z: front', function() {
			const source = dedent`{{art
				src: /images/map.png
				z: front
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('z-index:1000');
		});

		it('Renders an art block with explicit height', function() {
			const source = dedent`{{art
				src: /images/map.png
				w: 3in
				h: 2in
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('width:3in');
			expect(rendered).toContain('height:2in');
		});

		it('Does not render height when h is not specified', function() {
			const source = dedent`{{art
				src: /images/map.png
				w: 3in
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).not.toContain('height:');
		});

		it('Renders nothing when src is missing', function() {
			const source = dedent`{{art
				x: 1in
				y: 1in
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).not.toContain('<img');
		});

		it('Supports percentage units', function() {
			const source = dedent`{{art
				src: /images/map.png
				x: 10%
				y: 20%
				w: 50%
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('left:10%');
			expect(rendered).toContain('top:20%');
			expect(rendered).toContain('width:50%');
		});

		it('Supports cm and px units', function() {
			const source = dedent`{{art
				src: /images/map.png
				x: 2cm
				w: 200px
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('left:2cm');
			expect(rendered).toContain('width:200px');
		});

		it('Ignores unrecognized properties', function() {
			const source = dedent`{{art
				src: /images/map.png
				opacity: 0.5
				rotation: 15deg
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('src="/images/map.png"');
			expect(rendered).not.toContain('opacity');
			expect(rendered).not.toContain('rotation');
		});

		it('Does not match malformed block without closing }}', function() {
			const source = dedent`{{art
				src: /images/map.png
				x: 1in`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).not.toContain('<img');
			expect(rendered).toContain('{{art');
		});

		it('Includes data-art-index attribute', function() {
			const source = dedent`{{art
				src: /images/map.png
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toMatch(/data-art-index="\d+"/);
		});

		it('Does not interfere with regular mustache divs', function() {
			const source = dedent`{{note
				This is a note.
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('class="block note"');
			expect(rendered).not.toContain('art-block');
		});

		it('Renders art block alongside other content', function() {
			const source = dedent`# Title

				{{art
				src: /images/map.png
				x: 1in
				y: 2in
				w: 3in
				}}

				Some paragraph text.`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('<h1');
			expect(rendered).toContain('<img');
			expect(rendered).toContain('class="art-block"');
			expect(rendered).toContain('<p>Some paragraph text.</p>');
		});

		it('Handles extra whitespace in property values', function() {
			const source = dedent`{{art
				src:   /images/map.png
				x:  0.5in
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('src="/images/map.png"');
			expect(rendered).toContain('left:0.5in');
		});

		it('Handles URLs with query parameters', function() {
			const source = dedent`{{art
				src: https://example.com/image.png?w=400&h=300
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('src="https://example.com/image.png?w=400&amp;h=300"');
		});

		it('Assigns sequential data-art-index to multiple art blocks', function() {
			const source = dedent`{{art
				src: /images/a.png
				x: 0in
				}}

				{{art
				src: /images/b.png
				x: 1in
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('data-art-index="0"');
			expect(rendered).toContain('data-art-index="1"');
		});

		it('Stores original units in data attributes', function() {
			const source = dedent`{{art
				src: /images/map.png
				x: 0.45in
				y: 20%
				w: 3.25in
				h: 2cm
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('data-art-unit-x="in"');
			expect(rendered).toContain('data-art-unit-y="%"');
			expect(rendered).toContain('data-art-unit-w="in"');
			expect(rendered).toContain('data-art-unit-h="cm"');
		});

		it('Stores empty unit for properties using defaults', function() {
			const source = dedent`{{art
				src: /images/map.png
				}}`;
			const rendered = Markdown.render(source).trimReturns();
			expect(rendered).toContain('data-art-unit-x="in"');
			expect(rendered).toContain('data-art-unit-y="in"');
			expect(rendered).toContain('data-art-unit-w="%"');
			expect(rendered).not.toContain('data-art-unit-h');
		});

		it('Resets art-index counter on page 0', function() {
			// First render at page 0
			const source1 = dedent`{{art
				src: /images/a.png
				}}`;
			Markdown.render(source1, 0);
			// Second render at page 1
			const source2 = dedent`{{art
				src: /images/b.png
				}}`;
			const rendered2 = Markdown.render(source2, 1);
			expect(rendered2).toContain('data-art-index="1"');
			// Third render at page 0 again — should reset
			const rendered3 = Markdown.render(source1, 0);
			expect(rendered3).toContain('data-art-index="0"');
		});
	});
});

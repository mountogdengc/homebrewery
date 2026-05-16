// Quick test to verify the markdown converter works
import { convertToMarkdown } from './helpers.js';

// Test cases with various homebrewery syntax
const testCases = [
	{
		name: 'Inline styling with class and text',
		input: 'This is {{ my-class text content }} in markdown',
		expected: 'This is text content in markdown'
	},
	{
		name: 'Inline styling with multiple classes',
		input: '{{class1,class2 styled text}}',
		expected: 'styled text'
	},
	{
		name: 'Inline with style properties',
		input: '{{color:red bold text}}',
		expected: 'bold text'
	},
	{
		name: 'Block div with class',
		input: '{{ container\nThis is block content\n}}',
		expected: 'This is block content'
	},
	{
		name: 'Statblock embed',
		input: 'Here is a {{statblock:abc123}} embed',
		expected: 'Here is a <!-- Embed: statblock:abc123 --> embed'
	},
	{
		name: 'BESM statblock embed',
		input: '{{besm-statblock:xyz789}}',
		expected: '<!-- Embed: besm-statblock:xyz789 -->'
	},
	{
		name: 'Table of contents',
		input: '{{tableofcontents}}',
		expected: '<!-- Embed: tableofcontents -->'
	},
	{
		name: 'Plain text without styling',
		input: 'This is plain text with no styling',
		expected: 'This is plain text with no styling'
	}
];

console.log('Testing markdown converter...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
	const result = convertToMarkdown(testCase.input);
	const testPassed = result.trim() === testCase.expected.trim() || result.includes(testCase.expected);
	
	console.log(`Test: ${testCase.name}`);
	console.log(`  Input:    "${testCase.input}"`);
	console.log(`  Expected: "${testCase.expected}"`);
	console.log(`  Got:      "${result}"`);
	console.log(`  Status:   ${testPassed ? '✓ PASS' : '✗ FAIL'}\n`);
	
	if(testPassed) passed++;
	else failed++;
});

console.log(`\n${passed}/${passed + failed} tests passed`);

#!/usr/bin/env node

/**
 * Markdown-to-Homebrewery Converter CLI
 *
 * Usage:
 *   node tools/converter/index.js --input <file> --format <name> [--output <file>]
 *
 * Formats: 5ePHB, DungeonCraftAL, Legacy, Blank
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { convert } from './converter.js';

const FORMATS = {
	'5ephb':          () => import('./formats/5ePHB.js'),
	'dungeoncraftal': () => import('./formats/dungeonCraftAL.js'),
	'legacy':         () => import('./formats/legacy.js'),
	'blank':          () => import('./formats/blank.js'),
};

const FORMAT_NAMES = ['5ePHB', 'DungeonCraftAL', 'Legacy', 'Blank'];

function usage() {
	console.log(`
Markdown-to-Homebrewery Converter

Usage:
  node tools/converter/index.js --input <file> --format <name> [--output <file>]

Options:
  --input, -i    Input markdown file (required)
  --format, -f   Target format: ${FORMAT_NAMES.join(', ')} (default: 5ePHB)
  --output, -o   Output file (default: stdout)
  --help, -h     Show this help

Examples:
  node tools/converter/index.js -i adventure.md -f DungeonCraftAL -o adventure-hb.md
  node tools/converter/index.js -i notes.md -f 5ePHB > output.md
  node tools/converter/index.js -i chapter.md -f Legacy
`);
}

function parseArgs(argv) {
	const args = { input: null, format: '5ePHB', output: null };

	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case '--input': case '-i':
				args.input = argv[++i];
				break;
			case '--format': case '-f':
				args.format = argv[++i];
				break;
			case '--output': case '-o':
				args.output = argv[++i];
				break;
			case '--help': case '-h':
				usage();
				process.exit(0);
			default:
				// Treat first positional arg as input if no flag
				if (!args.input && !arg.startsWith('-')) {
					args.input = arg;
				} else {
					console.error(`Unknown option: ${arg}`);
					usage();
					process.exit(1);
				}
		}
	}

	return args;
}

async function main() {
	const args = parseArgs(process.argv);

	if (!args.input) {
		console.error('Error: --input is required');
		usage();
		process.exit(1);
	}

	// Resolve format
	const formatKey = args.format.toLowerCase();
	if (!FORMATS[formatKey]) {
		console.error(`Error: Unknown format "${args.format}". Available: ${FORMAT_NAMES.join(', ')}`);
		process.exit(1);
	}

	// Load format
	const formatModule = await FORMATS[formatKey]();
	const format = formatModule.default;

	// Read input
	const inputPath = resolve(args.input);
	let input;
	try {
		input = readFileSync(inputPath, 'utf-8');
	} catch (err) {
		console.error(`Error reading file: ${inputPath}`);
		console.error(err.message);
		process.exit(1);
	}

	// Convert
	const output = convert(input, format);

	// Write output
	if (args.output) {
		const outputPath = resolve(args.output);
		writeFileSync(outputPath, output, 'utf-8');
		console.error(`Converted ${inputPath} -> ${outputPath} (format: ${format.name})`);
	} else {
		process.stdout.write(output);
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});

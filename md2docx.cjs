#!/usr/bin/env node
// md2docx.cjs - CLI wrapper for the shared Markdown to DOCX converter.

const fs = require('fs');
const path = require('path');

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node md2docx.cjs input.md [output.docx]');
    process.exit(1);
  }

  const outputFile = process.argv[3]
    || path.join(path.dirname(inputFile), path.basename(inputFile, path.extname(inputFile)) + '.docx');

  const { convertMarkdownToDocx } = await import('./server/convert-docx.js');
  const content = fs.readFileSync(inputFile, 'utf8');
  const buffer = await convertMarkdownToDocx(content);

  fs.writeFileSync(outputFile, buffer);
  console.log(`OK  ${outputFile}`);
  console.log('\nWord styles included:');
	console.log('   CoreBody, CoreHanging, HangingContinue');
	console.log('   CoreBulleted, HangingBullet, CoreNumberedList');
	console.log('   Boxed Text, CoreEpigraph, EpigraphAuthor');
	console.log('   List Heading, List Header, List Item, CreditLegal, Footnote');
	console.log('   TableTitle, TABLE HEADER, TABLE CELL');
	console.log('   Sidebar Heading, Sidebar Body, Sidebar Body Bullets');
	console.log('   Heading1-5');
}

main().catch((error)=>{
  console.error(error);
  process.exit(1);
});

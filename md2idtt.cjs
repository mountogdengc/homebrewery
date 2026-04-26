#!/usr/bin/env node
// md2idtt.cjs — Markdown to InDesign Tagged Text
// Mount Ogden Gaming Company / Cascade RPG
// Usage: node md2idtt.cjs input.md [output.txt]

const fs   = require('fs');
const path = require('path');

// ─── Style maps ─────────────────────────────────────────────────────────────

// Style names must include the group prefix (folder:style) to match InDesign.
const HEADING_MAP = {
  1: 'Headings:Heading1',
  2: 'Headings:Heading2',
  3: 'Headings:Heading3',
  4: 'Headings:Heading4',
  5: 'Headings:Heading5',
};

const RENDER_CALLOUTS = {
  note:    { heading: 'Sidebars:SidebarHeading', body: 'Sidebars:SidebarBody', bullet: 'Sidebars:SidebarBodyBullets' },
  warning: { heading: 'Sidebars:SidebarHeading', body: 'Sidebars:SidebarBody', bullet: 'Sidebars:SidebarBodyBullets' },
  example: { heading: 'Sidebars:SidebarHeading', body: 'Sidebars:SidebarBody', bullet: 'Sidebars:SidebarBodyBullets' },
};

// ─── Character encoding ──────────────────────────────────────────────────────
//
// InDesign Tagged Text files use latin1 (Windows-1252) encoding. Any Unicode
// character above U+00FF must be expressed as an IDTT hex escape: <0xHHHH>.
// The < character itself must also be escaped, since it opens IDTT tags.
//
// This single function handles both concerns in one pass over the raw text,
// so there is no risk of double-encoding.

function encodeForIDTT(text) {
  if (text == null) return '';
  let out = '';
  for (const ch of text) {        // iterates Unicode code points, not UTF-16 units
    const cp = ch.codePointAt(0);
    if (cp === 0x3C) {            // literal <
      out += '<0x003C>';
    } else if (cp > 0xFF) {       // any character outside latin1
      out += `<0x${cp.toString(16).toUpperCase().padStart(4, '0')}>`;
    } else {
      out += ch;
    }
  }
  return out;
}

// ─── Inline markdown ─────────────────────────────────────────────────────────

function processInline(rawText) {
  if (!rawText) return '';
  const result  = [];
  // Bold-italic must be tested before bold, bold before italic.
  const pattern = /(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/gs;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(rawText)) !== null) {
    if (match.index > lastIndex)
      result.push(encodeForIDTT(rawText.slice(lastIndex, match.index)));
    if (match[1].startsWith('***'))
      result.push(`<CharStyle:BoldItalic>${encodeForIDTT(match[2])}<CharStyle:>`);
    else if (match[1].startsWith('**'))
      result.push(`<CharStyle:Bold>${encodeForIDTT(match[3])}<CharStyle:>`);
    else if (match[1].startsWith('*'))
      result.push(`<CharStyle:Italic>${encodeForIDTT(match[4])}<CharStyle:>`);
    else if (match[1].startsWith('`'))
      result.push(`<CharStyle:Code>${encodeForIDTT(match[5])}<CharStyle:>`);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < rawText.length)
    result.push(encodeForIDTT(rawText.slice(lastIndex)));
  return result.join('');
}

function para(style, rawText) {
  return `<ParaStyle:${style}>${processInline(rawText)}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node md2idtt.cjs input.md [output.txt]');
  process.exit(1);
}

// Read as UTF-8 so smart quotes, em dashes, etc. are preserved correctly
// before we convert them to IDTT hex escapes.
const content = fs.readFileSync(inputFile, 'utf8');
const lines   = content.split('\n');
const output  = [];

output.push('<ANSI-WIN>');
output.push('<Version:8><FeatureSet:InDesign-Roman>');

let inCallout    = false;
let calloutStyle = null;
let skipBlock    = false;
let inTable      = false;
let firstRow     = true;
let i            = 0;

while (i < lines.length) {
  const raw     = lines[i];
  const trimmed = raw.trim();

  // ── Backslash page / column breaks (Homebrewery)
  if (/^\\page\b/.test(trimmed))   { output.push('<ParaStyle:Body Text:CoreBody><0x000C>'); i++; continue; }
  if (/^\\column\b/.test(trimmed)) { output.push('<ParaStyle:Body Text:CoreBody><0x000E>'); i++; continue; }

  // ── HTML comments
  if (/^<!--/.test(trimmed)) { i++; continue; }

  // ── Image lines
  if (/^!\[/.test(trimmed)) { i++; continue; }

  // ── Homebrewery block open  {{ ...
  if (/^\{\{/.test(trimmed) && !inCallout && !skipBlock) {
    const tagMatch = trimmed.match(/^\{\{(\w+)/);
    const tag      = tagMatch ? tagMatch[1].toLowerCase() : '';
    if (tag === 'pagenumber') { i++; continue; }         // self-closing, no matching }}
    if (RENDER_CALLOUTS[tag]) { inCallout = true; calloutStyle = RENDER_CALLOUTS[tag]; }
    else                      { skipBlock = true; }
    i++; continue;
  }

  // ── Block close
  if (trimmed === '}}') {
    if (inCallout) { inCallout = false; calloutStyle = null; }
    if (skipBlock) { skipBlock = false; }
    i++; continue;
  }

  // ── Inside a skip block
  if (skipBlock) { i++; continue; }

  // ── Inside a render callout (e.g. {{note}})
  if (inCallout) {
    if (trimmed === '') { i++; continue; }
    if (trimmed.startsWith('|')) {
      if (!inTable) { inTable = true; firstRow = true; }
      if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
      trimmed.split('|').map(c => c.trim()).filter(Boolean)
        .forEach(cell => output.push(para(firstRow ? 'SidebarHeading' : 'SidebarBody', cell)));
      i++; continue;
    } else { inTable = false; firstRow = true; }
    const hm = trimmed.match(/^(#+)\s+(.*)/);
    if (hm)                           output.push(para(calloutStyle.heading, hm[2]));
    else if (/^[-*]\s/.test(trimmed)) output.push(para(calloutStyle.bullet, trimmed.slice(2)));
    else                              output.push(para(calloutStyle.body, trimmed));
    i++; continue;
  }

  // ── Headings
  const hm = trimmed.match(/^(#+)\s+(.*)/);
  if (hm) {
    output.push(para(HEADING_MAP[Math.min(hm[1].length, 5)], hm[2]));
    i++; continue;
  }

  // ── Horizontal rule
  if (/^[-*]{3,}$/.test(trimmed)) { i++; continue; }

  // ── Tables
  if (trimmed.startsWith('|')) {
    if (!inTable) { inTable = true; firstRow = true; }
    if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
    trimmed.split('|').map(c => c.trim()).filter(Boolean)
      .forEach(cell => output.push(para(firstRow ? 'Table:TABLE_HEADER' : 'Table:TABLE_CELL', cell)));
    i++; continue;
  } else { inTable = false; firstRow = true; }

  // ── Unordered list
  if (/^[-*]\s/.test(trimmed)) {
    output.push(para('Body Text:CoreBulleted', trimmed.slice(2)));
    i++; continue;
  }

  // ── Ordered list
  if (/^\d+\.\s/.test(trimmed)) {
    output.push(para('Body Text:CoreNumberedList', trimmed.replace(/^\d+\.\s/, '')));
    i++; continue;
  }

  // ── NPC / stat block placeholder
  if (/^\[NPC:|^\[STAT/.test(trimmed)) {
    output.push(`<ParaStyle:Body Text:CoreBody>[[ STAT BLOCK: ${encodeForIDTT(trimmed)} ]]`);
    i++; continue;
  }

  // ── Blank line
  if (trimmed === '') { i++; continue; }

  // ── Body text
  output.push(para('Body Text:CoreBody', trimmed));
  i++;
}

// ─── Write ────────────────────────────────────────────────────────────────────
// Join paragraphs with bare CR (0x0D) — the IDTT paragraph separator.
// Write as latin1/binary so the CR bytes are written exactly and the IDTT hex
// escape sequences (which are all ASCII) pass through unchanged.

const outputFile = process.argv[3]
  || path.join(path.dirname(inputFile), path.basename(inputFile, path.extname(inputFile)) + '.txt');

const joined = output.join('\r\n') + '\r\n';
fs.writeFileSync(outputFile, joined, 'latin1');
console.log(`✓  ${outputFile}`);
console.log(`   ${output.length - 2} paragraphs`);

// Sanity check: report any characters that would have been problematic
// if we had NOT encoded them. Helps confirm the encoding step is working.
const unicodeCount = (joined.match(/<0x[0-9A-F]{4}>/g) || []).length;
if (unicodeCount > 0)
  console.log(`   ${unicodeCount} Unicode characters converted to IDTT hex escapes`);

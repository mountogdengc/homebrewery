// convert-docx.js — Markdown to .docx conversion (ES module)
// Mount Ogden Gaming Company / Cascade RPG
//
// Extracted from md2docx.cjs for use as an importable module.
// No file I/O — takes a markdown string, returns a Buffer.

import { Document, Packer, Paragraph, TextRun, PageBreak, ExternalHyperlink } from 'docx';

// ─── Style maps ─────────────────────────────────────────────────────────────

const HEADING_MAP = {
  1: 'Heading 1',
  2: 'Heading 2',
  3: 'Heading 3',
  4: 'Heading 4',
  5: 'Heading 5',
};

const RENDER_CALLOUTS = {
  note:    { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Bullets' },
  warning: { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Bullets' },
  example: { heading: 'Sidebar Heading', body: 'Sidebar Body', bullet: 'Sidebar Bullets' },
};

// ─── Inline markdown → TextRun[] ────────────────────────────────────────────

function parseInline(rawText) {
  if (!rawText) return [new TextRun('')];
  const runs = [];
  const pattern = /(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/gs;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(rawText)) !== null) {
    if (match.index > lastIndex)
      runs.push(new TextRun(rawText.slice(lastIndex, match.index)));
    if (match[1].startsWith('***'))
      runs.push(new TextRun({ text: match[2] || '', bold: true, italics: true }));
    else if (match[1].startsWith('**'))
      runs.push(new TextRun({ text: match[3] || '', bold: true }));
    else if (match[1].startsWith('*'))
      runs.push(new TextRun({ text: match[4] || '', italics: true }));
    else if (match[1].startsWith('`'))
      runs.push(new TextRun({ text: match[5] || '', font: 'Courier New' }));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length)
    runs.push(new TextRun(rawText.slice(lastIndex)));
  if (runs.length === 0)
    runs.push(new TextRun(''));

  return runs;
}

function styledPara(styleId, rawText) {
  return new Paragraph({ style: styleId, children: parseInline(rawText) });
}

// ─── Main conversion ────────────────────────────────────────────────────────

export async function convertMarkdownToDocx(markdown) {
  const lines = markdown.split('\n');
  const paragraphs = [];

  let inCallout    = false;
  let calloutStyle = null;
  let skipBlock    = false;
  let inTable      = false;
  let firstRow     = true;
  let i            = 0;

  while (i < lines.length) {
    const raw     = lines[i];
    const trimmed = raw.trim();

    // ── Page break
    if (/^\\page\b/.test(trimmed)) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      i++; continue;
    }

    // ── Column break — emit as page break
    if (/^\\column\b/.test(trimmed)) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      i++; continue;
    }

    // ── HTML comments — skip
    if (/^<!--/.test(trimmed)) { i++; continue; }

    // ── Image lines — skip
    if (/^!\[/.test(trimmed)) { i++; continue; }

    // ── Homebrewery block open  {{ ...
    if (/^\{\{/.test(trimmed) && !inCallout && !skipBlock) {
      const tagMatch = trimmed.match(/^\{\{(\w+)/);
      const tag      = tagMatch ? tagMatch[1].toLowerCase() : '';
      if (tag === 'pagenumber') { i++; continue; }
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

    // ── Inside a render callout
    if (inCallout) {
      if (trimmed === '') { i++; continue; }
      if (trimmed.startsWith('|')) {
        if (!inTable) { inTable = true; firstRow = true; }
        if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
        trimmed.split('|').map(c => c.trim()).filter(Boolean)
          .forEach(cell => paragraphs.push(styledPara(firstRow ? 'SidebarHeading' : 'SidebarBody', cell)));
        i++; continue;
      } else { inTable = false; firstRow = true; }
      const hm = trimmed.match(/^(#+)\s+(.*)/);
      if (hm)                           paragraphs.push(styledPara(calloutStyle.heading, hm[2]));
      else if (/^[-*]\s/.test(trimmed)) paragraphs.push(styledPara(calloutStyle.bullet, trimmed.slice(2)));
      else                              paragraphs.push(styledPara(calloutStyle.body, trimmed));
      i++; continue;
    }

    // ── Headings
    const hm = trimmed.match(/^(#+)\s+(.*)/);
    if (hm) {
      const level = Math.min(hm[1].length, 5);
      paragraphs.push(styledPara(HEADING_MAP[level], hm[2]));
      i++; continue;
    }

    // ── Horizontal rule — skip
    if (/^[-*]{3,}$/.test(trimmed)) { i++; continue; }

    // ── Tables
    if (trimmed.startsWith('|')) {
      if (!inTable) { inTable = true; firstRow = true; }
      if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
      trimmed.split('|').map(c => c.trim()).filter(Boolean)
        .forEach(cell => paragraphs.push(styledPara(firstRow ? 'Table Header' : 'Table Cell', cell)));
      i++; continue;
    } else { inTable = false; firstRow = true; }

    // ── Unordered list
    if (/^[-*]\s/.test(trimmed)) {
      paragraphs.push(styledPara('List Bullet', trimmed.slice(2)));
      i++; continue;
    }

    // ── Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      paragraphs.push(styledPara('List Number', trimmed.replace(/^\d+\.\s/, '')));
      i++; continue;
    }

    // ── NPC / stat block placeholder
    if (/^\[NPC:|^\[STAT/.test(trimmed)) {
      paragraphs.push(styledPara('Normal', `[[ STAT BLOCK: ${trimmed} ]]`));
      i++; continue;
    }

    // ── Blank line — skip
    if (trimmed === '') { i++; continue; }

    // ── Body text
    paragraphs.push(styledPara('Normal', trimmed));
    i++;
  }

  // ─── Build .docx ──────────────────────────────────────────────────────────

  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: 'Normal',           name: 'Normal' },
        { id: 'Heading 1',       name: 'Heading 1',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 36 } },
        { id: 'Heading 2',       name: 'Heading 2',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 28 } },
        { id: 'Heading 3',       name: 'Heading 3',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 24 } },
        { id: 'Heading 4',       name: 'Heading 4',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 22 } },
        { id: 'Heading 5',       name: 'Heading 5',       basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 20 } },
        { id: 'List Bullet',     name: 'List Bullet',     basedOn: 'Normal' },
        { id: 'List Number',     name: 'List Number',     basedOn: 'Normal' },
        { id: 'Sidebar Heading', name: 'Sidebar Heading', basedOn: 'Normal', run: { bold: true } },
        { id: 'Sidebar Body',    name: 'Sidebar Body',    basedOn: 'Normal' },
        { id: 'Sidebar Bullets', name: 'Sidebar Bullets', basedOn: 'Normal' },
        { id: 'Table Header',    name: 'Table Header',    basedOn: 'Normal', run: { bold: true } },
        { id: 'Table Cell',      name: 'Table Cell',      basedOn: 'Normal' },
      ],
    },
    sections: [{
      children: paragraphs,
    }],
  });

  return Packer.toBuffer(doc);
}

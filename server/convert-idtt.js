// convert-idtt.js — Markdown to InDesign Tagged Text (ES module)
// Mount Ogden Gaming Company / Cascade RPG
//
// Extracted from md2idtt.cjs for use as a reusable module.
// No file I/O — takes a markdown string, returns a Buffer.

// ─── Style maps ─────────────────────────────────────────────────────────────

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

// Tags whose content should be dropped entirely
const DROP_BLOCKS = new Set(['footnote', 'toc', 'pagenumber']);

// Inline-style tags: extract the text content and map to an IDTT style.
// Handles both self-closing  {{Tag text }}  and multi-line  {{Tag\ntext\n}}
const INLINE_STYLE_TAGS = {
  tabletitle: 'Table:TABLE_TITLE',
  epigraph:   'Body Text:CoreEpigraph',
};

// ─── Character encoding ──────────────────────────────────────────────────────
//
// InDesign Tagged Text files use latin1 (Windows-1252) encoding. Any Unicode
// character above U+00FF must be expressed as an IDTT hex escape: <0xHHHH>.
// The < character itself must also be escaped, since it opens IDTT tags.

function encodeForIDTT(text) {
  if (text == null) return '';
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp === 0x3C) {
      out += '<0x003C>';
    } else if (cp > 0xFF) {
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

// ─── Main conversion ─────────────────────────────────────────────────────────

/**
 * Convert a markdown string to InDesign Tagged Text.
 * @param {string} markdown - The markdown content (UTF-8 string).
 * @returns {Buffer} IDTT file contents encoded as latin1.
 */
export function convertMarkdownToIdtt(markdown) {
  const lines  = markdown.split('\n');
  const output = [];

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

    // ── Colon spacers (Homebrewery layout)
    if (/^:+$/.test(trimmed)) { i++; continue; }

    // ── Homebrewery block open  {{ ...
    if (/^\{\{/.test(trimmed) && !inCallout && !skipBlock) {
      const tagMatch = trimmed.match(/^\{\{(\w+)/);
      const tag      = tagMatch ? tagMatch[1].toLowerCase() : '';
      if (DROP_BLOCKS.has(tag)) {
        // Self-closing on one line (e.g. {{pageNumber,auto}}) — just skip the line
        if (/\}\}\s*$/.test(trimmed)) { i++; continue; }
        skipBlock = true; i++; continue;
      }
      if (RENDER_CALLOUTS[tag])      { inCallout = true; calloutStyle = RENDER_CALLOUTS[tag]; i++; continue; }

      // Inline-style tags (TableTitle, Epigraph, etc.) — extract text content
      if (INLINE_STYLE_TAGS[tag]) {
        const style = INLINE_STYLE_TAGS[tag];
        // Check for self-closing:  {{Tag text here }}
        const selfClose = trimmed.match(/^\{\{\w+\s+(.*?)\s*\}\}\s*$/);
        if (selfClose) {
          output.push(para(style, selfClose[1]));
        } else {
          // Multi-line: collect lines until }}
          i++;
          while (i < lines.length && lines[i].trim() !== '}}') {
            const content = lines[i].trim();
            if (content !== '') output.push(para(style, content));
            i++;
          }
          // i now points at }} — will be advanced by the i++ at end
        }
        i++; continue;
      }

      // Layout-only tags (wide, tight, etc.) — strip the tag, content falls through normally
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
        const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
        const style = firstRow ? 'SidebarHeading' : 'SidebarBody';
        output.push(`<ParaStyle:${style}>${cells.map(c => processInline(c)).join('\t')}`);
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

    // ── Tables (tab-delimited: one row per paragraph, cells separated by tabs)
    if (trimmed.startsWith('|')) {
      if (!inTable) { inTable = true; firstRow = true; }
      if (/^\|[\|\-\s:]+\|$/.test(trimmed)) { firstRow = false; i++; continue; }
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
      const style = firstRow ? 'Table:TABLE_HEADER' : 'Table:TABLE_CELL';
      output.push(`<ParaStyle:${style}>${cells.map(c => processInline(c)).join('\t')}`);
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

  const joined = output.join('\r\n') + '\r\n';
  return Buffer.from(joined, 'latin1');
}

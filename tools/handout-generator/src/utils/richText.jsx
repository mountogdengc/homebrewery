import React from 'react'

/**
 * Parses simple markdown-like formatting into React elements.
 *
 * Supported syntax:
 *   ***text***  or  ___text___  → bold italic
 *   **text**    or  __text__    → bold
 *   *text*      or  _text_      → italic
 *   ~~text~~                    → strikethrough
 *   - item  (at line start)    → bullet list
 *   Blank line                 → paragraph break
 */

/* ── inline formatting ──────────────────────────────── */

const INLINE_RULES = [
  // bold-italic must come before bold and italic
  { re: /\*\*\*(.+?)\*\*\*/g,  tag: 'bi' },
  { re: /___(.+?)___/g,        tag: 'bi' },
  // bold
  { re: /\*\*(.+?)\*\*/g,      tag: 'b'  },
  { re: /__(.+?)__/g,          tag: 'b'  },
  // italic
  { re: /\*(.+?)\*/g,          tag: 'i'  },
  { re: /_(.+?)_/g,            tag: 'i'  },
  // strikethrough
  { re: /~~(.+?)~~/g,          tag: 's'  },
]

function parseInline(text) {
  // Build a list of segments: { start, end, tag, inner }
  const segments = []

  for (const rule of INLINE_RULES) {
    rule.re.lastIndex = 0
    let m
    while ((m = rule.re.exec(text)) !== null) {
      // skip if this range overlaps with an earlier, higher-priority match
      const s = m.index, e = m.index + m[0].length
      if (segments.some(seg => !(e <= seg.start || s >= seg.end))) continue
      segments.push({ start: s, end: e, tag: rule.tag, inner: m[1] })
    }
  }

  if (segments.length === 0) return text

  segments.sort((a, b) => a.start - b.start)

  const parts = []
  let cursor = 0
  for (const seg of segments) {
    if (seg.start > cursor) parts.push(text.slice(cursor, seg.start))
    const key = `${seg.start}`
    if (seg.tag === 'bi') parts.push(<strong key={key}><em>{seg.inner}</em></strong>)
    else if (seg.tag === 'b') parts.push(<strong key={key}>{seg.inner}</strong>)
    else if (seg.tag === 'i') parts.push(<em key={key}>{seg.inner}</em>)
    else if (seg.tag === 's') parts.push(<s key={key}>{seg.inner}</s>)
    cursor = seg.end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

/* ── block-level rendering ──────────────────────────── */

/**
 * Renders a rich-text string into React elements.
 *
 * @param {string} text       – the raw text from the form field
 * @param {object} [pStyle]   – optional style object applied to each <p>
 * @returns React elements
 */
export function renderRichText(text, pStyle = {}) {
  if (!text) return null

  const lines = text.split('\n')
  const blocks = []       // { type: 'p' | 'ul', lines: string[] }

  for (const raw of lines) {
    const trimmed = raw.trimStart()
    const isBullet = /^[-•]\s/.test(trimmed)

    if (isBullet) {
      const content = trimmed.replace(/^[-•]\s+/, '')
      if (blocks.length && blocks[blocks.length - 1].type === 'ul') {
        blocks[blocks.length - 1].lines.push(content)
      } else {
        blocks.push({ type: 'ul', lines: [content] })
      }
    } else if (raw === '') {
      // blank line starts a new paragraph
      blocks.push({ type: 'break' })
    } else {
      // regular text line — append to current paragraph or start new
      if (blocks.length && blocks[blocks.length - 1].type === 'p') {
        blocks[blocks.length - 1].lines.push(raw)
      } else {
        blocks.push({ type: 'p', lines: [raw] })
      }
    }
  }

  const elements = []
  let key = 0

  for (const block of blocks) {
    if (block.type === 'break') continue // just separates paragraphs
    if (block.type === 'ul') {
      elements.push(
        <ul key={key++} style={{ margin: '6px 0', paddingLeft: '1.4em', ...pStyle }}>
          {block.lines.map((li, i) => (
            <li key={i} style={{ marginBottom: '2px' }}>{parseInline(li)}</li>
          ))}
        </ul>
      )
    } else {
      // Render each line with <br/> between them to preserve single line breaks
      const content = []
      block.lines.forEach((line, i) => {
        if (i > 0) content.push(<br key={`br${i}`} />)
        const parsed = parseInline(line)
        if (Array.isArray(parsed)) content.push(...parsed)
        else content.push(parsed)
      })
      elements.push(
        <p key={key++} style={{ marginBottom: '10px', ...pStyle }}>
          {content}
        </p>
      )
    }
  }

  return elements
}

/**
 * Renders inline-only rich text (no paragraphs/bullets) — for single-line fields like footerNote.
 */
export function renderInlineRichText(text) {
  if (!text) return null
  return parseInline(text)
}

// server/convert.api.js
// API endpoints for Markdown → DOCX and Markdown → IDTT conversion

import express      from 'express';
import asyncHandler from 'express-async-handler';
import { convertMarkdownToDocx } from './convert-docx.js';
import { convertMarkdownToIdtt } from './convert-idtt.js';

const router = express.Router();

router.post('/api/convert/docx', asyncHandler(async (req, res) => {
  const { markdown, filename = 'export' } = req.body;
  if (!markdown) return res.status(400).json({ error: 'markdown field is required' });

  const buffer = await convertMarkdownToDocx(markdown);
  res.set({
    'Content-Type'        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Disposition' : `attachment; filename="${encodeURIComponent(filename)}.docx"`,
    'Content-Length'      : buffer.length,
    'Cache-Control'       : 'no-cache'
  });
  res.status(200).end(buffer);
}));

router.post('/api/convert/idtt', asyncHandler(async (req, res) => {
  const { markdown, filename = 'export' } = req.body;
  if (!markdown) return res.status(400).json({ error: 'markdown field is required' });

  const buffer = convertMarkdownToIdtt(markdown);
  res.set({
    'Content-Type'        : 'text/plain; charset=windows-1252',
    'Content-Disposition' : `attachment; filename="${encodeURIComponent(filename)}.txt"`,
    'Content-Length'      : buffer.length,
    'Cache-Control'       : 'no-cache'
  });
  res.status(200).end(buffer);
}));

export default router;

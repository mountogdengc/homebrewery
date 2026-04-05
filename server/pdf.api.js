// ── PDF Export API ────────────────────────────────────────────────────
// Generates text-selectable PDFs for brews, statblocks, and character sheets.

import _              from 'lodash';
import express        from 'express';
import asyncHandler   from 'express-async-handler';
import config         from './config.js';
import Markdown       from '../shared/markdown.js';
import { splitTextStyleAndMetadata } from '../shared/helpers.js';
import { urlToPdf } from './pdf.service.js';

// Statblock renderers (shared code, works server-side)
import { render as render5eStatblock }         from '../shared/statblock/renderer.js';
import { render as renderWillowlightStatblock } from '../shared/willowlight/statblockRenderer.js';
import { renderPage1 as renderWlPortraitP1, renderPage2 as renderWlPortraitP2 } from '../shared/willowlight/portraitSheetRenderer.js';
import { render as renderBrpStatblock }         from '../shared/brpStatblock/renderer.js';
import { renderPage1 as renderBrpPortraitP1, renderPage2 as renderBrpPortraitP2 } from '../shared/brpStatblock/portraitSheetRenderer.js';
import { render as renderPalladiumStatblock }   from '../shared/palladiumStatblock/renderer.js';

const router = express.Router();

function getBaseUrl() {
	const port = process.env.PORT || config.get('web_port') || 8000;
	return `http://localhost:${port}`;
}

function sendPdf(res, buffer, filename) {
	res.set({
		'Content-Type'        : 'application/pdf',
		'Content-Disposition' : `attachment; filename="${encodeURIComponent(filename)}.pdf"`,
		'Content-Length'      : buffer.length,
		'Cache-Control'       : 'no-cache'
	});
	res.status(200).end(buffer);
}

// ── Statblock render helper (mirrors client-side renderStatblock) ────

function renderStatblock(sb, layout, opts = {}) {
	switch (sb._system) {
		case 'willowlight':       return renderWillowlightStatblock(sb, layout, opts);
		case 'willowlight-sheet': return (opts.page === 'p2' ? renderWlPortraitP2 : renderWlPortraitP1)(sb, layout, opts);
		case 'brp':               return renderBrpStatblock(sb, layout);
		case 'brp-sheet':         return (opts.page === 'p2' ? renderBrpPortraitP2 : renderBrpPortraitP1)(sb, layout, opts);
		case 'palladium':         return renderPalladiumStatblock(sb, layout);
		default:                  return render5eStatblock(sb, layout);
	}
}

// ── Resolve embed placeholders with server-side rendered HTML ────────

async function resolveEmbeds(html) {
	// Find all statblock embed placeholders (may have whitespace inside)
	const embedRegex = /<div class="statblock-embed[^"]*"([^>]*)>\s*<\/div>/g;
	const embeds = [];
	let match;
	while ((match = embedRegex.exec(html)) !== null) {
		const attrs = match[1];
		const id = attrs.match(/data-statblock-id="([^"]+)"/)?.[1];
		const system = attrs.match(/data-statblock-system="([^"]+)"/)?.[1];
		const layout = attrs.match(/data-statblock-layout="([^"]+)"/)?.[1] || 'narrow';
		const page = attrs.match(/data-statblock-page="([^"]+)"/)?.[1];
		const optsStr = attrs.match(/data-statblock-opts="([^"]+)"/)?.[1] || '';
		const isWide = match[0].includes('statblock-embed--wide');
		if(id) embeds.push({ fullMatch: match[0], id, system, layout, page, optsStr, isWide });
	}

	console.log(`[PDF] resolveEmbeds: found ${embeds.length} embeds`, embeds.map((e)=>({ id: e.id, system: e.system, page: e.page })));

	if(embeds.length === 0) return html;

	// Batch fetch all needed statblocks from DB
	const ids = [...new Set(embeds.map((e)=>e.id))];
	const statblockData = {};

	try {
		const { model: StatblockModel } = await import('./statblock.model.js');
		const { model: WillowlightModel } = await import('./willowlight.model.js');
		const { model: BrpModel } = await import('./brp-statblock.model.js');
		const { model: PalladiumModel } = await import('./palladium-statblock.model.js');

		const collections = [
			{ model: StatblockModel,   system: '5e' },
			{ model: WillowlightModel, system: 'willowlight' },
			{ model: BrpModel,         system: 'brp' },
			{ model: PalladiumModel,   system: 'palladium' },
		];

		const remaining = new Set(ids);
		for (const { model, system } of collections) {
			if(remaining.size === 0) break;
			try {
				const found = await model.find({ shareId: { $in: [...remaining] } }).lean().exec();
				for (const sb of found) {
					sb._system = system;
					statblockData[sb.shareId] = sb;
					remaining.delete(sb.shareId);
				}
			} catch (e) { /* skip */ }
		}
	} catch (e) {
		console.warn('PDF embed resolution: DB lookup failed:', e.message);
	}

	console.log(`[PDF] resolveEmbeds: fetched ${Object.keys(statblockData).length} statblocks:`, Object.keys(statblockData));

	// Replace each embed placeholder with rendered HTML
	for (const embed of embeds) {
		const sb = statblockData[embed.id];
		if(!sb) continue;

		// Override system from embed syntax (e.g. brp-sheet vs brp)
		if(embed.system) sb._system = embed.system;

		const opts = {};
		if(embed.optsStr.includes('bw')) opts.bw = true;
		if(embed.page) opts.page = embed.page;

		try {
			const rendered = renderStatblock(sb, embed.layout, opts);
			console.log(`[PDF] Rendered embed ${embed.id} (${sb._system}): ${rendered.length} chars`);
			const wideClass = embed.isWide ? ' statblock-embed--wide' : '';
			html = html.replace(embed.fullMatch, `<div class="statblock-embed${wideClass}" data-loaded="true">${rendered}</div>`);
		} catch (e) {
			console.warn(`PDF embed render failed for ${embed.id}:`, e.message, e.stack);
		}
	}

	return html;
}

// ── Brew: server-side render to standalone HTML ──────────────────────

const PAGEBREAK_REGEX_V3 = /^(?=\\page(?:break)?(?: *{[^\n{}]*})?$)/m;

async function renderBrewToHtml(brew, themeStyleUrls) {
	splitTextStyleAndMetadata(brew);

	const rawPages = (brew.text || '').split(PAGEBREAK_REGEX_V3);

	let pagesHtml = rawPages.map((pageText, index)=>{
		let classes = 'page';
		let styleAttr = '';

		// Parse \page directive for classes/styles
		if(pageText.startsWith('\\page')) {
			const firstLine = pageText.split('\n', 1)[0];
			const braceMatch = firstLine.match(/\{([^}]+)\}/);
			if(braceMatch) {
				const tokens = braceMatch[1].trim().split(/\s+/);
				const extraClasses = [];
				const styles = {};
				for (const t of tokens) {
					if(t.startsWith('.')) extraClasses.push(t.slice(1));
					else if(t.includes(':')) {
						const [k, v] = t.split(':');
						styles[k] = v;
					}
				}
				if(extraClasses.length) classes += ' ' + extraClasses.join(' ');
				const styleEntries = Object.entries(styles).map(([k, v])=>`${k}:${v}`).join(';');
				if(styleEntries) styleAttr = ` style="${styleEntries}"`;
			}
			pageText = pageText.includes('\n') ? pageText.substring(pageText.indexOf('\n') + 1) : '';
		}

		// Artificial column break at page end (matches client-side behavior)
		pageText += `\n\n&nbsp;\n\\column\n&nbsp;`;

		const html = Markdown.render(pageText, index);
		return `<div class="${classes}" id="p${index + 1}"${styleAttr}><div class="columnWrapper">${html}</div></div>`;
	}).join('\n');

	// Resolve statblock/sheet embeds server-side
	pagesHtml = await resolveEmbeds(pagesHtml);

	// Theme CSS as link tags (loaded from the same server, no CORS issues)
	const themeLinks = themeStyleUrls.map((url)=>`<link rel="stylesheet" href="${url}" />`).join('\n');

	// User custom styles from the brew
	const userStyle = brew.style || '';

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="//fonts.googleapis.com/css?family=Open+Sans:400,300,600,700" rel="stylesheet" type="text/css" />
<link href="/homebrew/bundle.css" rel="stylesheet" />
<link href="/client/homebrew/statblock/statblock.less" rel="stylesheet" />
<link href="/client/homebrew/willowlight/willowlight.less" rel="stylesheet" />
<link href="/client/homebrew/brpStatblock/brpStatblock.less" rel="stylesheet" />
<link href="/client/homebrew/palladiumStatblock/palladiumStatblock.less" rel="stylesheet" />
${themeLinks}
<style>${userStyle}</style>
<style>
	@page { margin: 0; size: letter; }
	body { margin: 0; padding: 0; background: white; }
	.brewRenderer { height: auto; overflow: visible; padding: 0; }
	.brewRenderer .pages { display: block; margin: 0; }
	.page { box-shadow: none; break-after: page; break-inside: avoid; margin: 0; }
</style>
</head>
<body>
<div class="brewRenderer">
	<div class="pages">
		${pagesHtml}
	</div>
</div>
</body>
</html>`;
}

// ── Brew render endpoint (HTML) ──────────────────────────────────────
// Puppeteer navigates here to generate the PDF. Served as a real page
// so CSS/fonts load without CORS issues.
router.get('/api/pdf/brew-render/:id', asyncHandler(async (req, res)=>{
	const { model: HomebrewModel } = await import('./homebrew.model.js');

	const brew = await HomebrewModel.get({ shareId: req.params.id })
		.catch(()=>{
			throw { name: 'Not Found', message: 'Brew not found', status: 404 };
		});

	const brewObj = brew.toObject ? brew.toObject() : brew;

	// Parse metadata block FIRST — this extracts theme, renderer, style from the text
	splitTextStyleAndMetadata(brewObj);

	// Now read theme/renderer (populated by splitTextStyleAndMetadata)
	const renderer = brewObj.renderer || 'V3';
	const theme = brewObj.theme || '5ePHB';
	const themeStyleUrls = [];

	try {
		const Themes = (await import('../themes/themes.json', { with: { type: 'json' } })).default;
		let currentTheme = theme;

		while (currentTheme) {
			themeStyleUrls.unshift(`/themes/${renderer}/${currentTheme}/style.css`);
			const themeConfig = Themes?.[renderer]?.[currentTheme];
			currentTheme = themeConfig?.baseTheme || null;
		}
	} catch (e) {
		themeStyleUrls.push(`/themes/${renderer}/${theme}/style.css`);
	}

	// renderBrewToHtml will call splitTextStyleAndMetadata again but that's harmless
	// since the metadata block is already stripped
	const html = await renderBrewToHtml(brewObj, themeStyleUrls);
	res.set({ 'Content-Type': 'text/html; charset=utf-8' });
	res.status(200).send(html);
}));

// ── Brew PDF ─────────────────────────────────────────────────────────
// Navigates Puppeteer to the brew-render endpoint (a real HTTP page),
// which avoids CORS issues with CSS/font loading.
router.get('/api/pdf/brew/:id', asyncHandler(async (req, res)=>{
	const base = getBaseUrl();
	const renderUrl = `${base}/api/pdf/brew-render/${req.params.id}`;
	const buffer = await urlToPdf(renderUrl);

	// Fetch brew name for the filename
	let name = `brew-${req.params.id}`;
	try {
		const { model: HomebrewModel } = await import('./homebrew.model.js');
		const brew = await HomebrewModel.get({ shareId: req.params.id });
		if(brew.title) name = brew.title;
	} catch (e) { /* use default name */ }

	sendPdf(res, buffer, name);
}));

// ── Statblock PDF (5e) ──────────────────────────────────────────────
router.get('/api/pdf/statblock/:id', asyncHandler(async (req, res)=>{
	const url = `${getBaseUrl()}/statblock/share/${req.params.id}`;
	const buffer = await urlToPdf(url);
	sendPdf(res, buffer, `statblock-${req.params.id}`);
}));

// ── BRP Statblock / Character Sheet PDF ──────────────────────────────
router.get('/api/pdf/brp/:id', asyncHandler(async (req, res)=>{
	const view = req.query.view === 'sheet' ? 'sheet' : 'share';
	const url = `${getBaseUrl()}/brp/${view}/${req.params.id}`;
	const buffer = await urlToPdf(url);
	sendPdf(res, buffer, `brp-${req.params.id}`);
}));

// ── Willowlight Character PDF ────────────────────────────────────────
router.get('/api/pdf/willowlight/:id', asyncHandler(async (req, res)=>{
	const url = `${getBaseUrl()}/willowlight/share/${req.params.id}`;
	const buffer = await urlToPdf(url);
	sendPdf(res, buffer, `willowlight-${req.params.id}`);
}));

// ── BESM Character PDF ──────────────────────────────────────────────
router.get('/api/pdf/besm/:id', asyncHandler(async (req, res)=>{
	const url = `${getBaseUrl()}/besm/share/${req.params.id}`;
	const buffer = await urlToPdf(url);
	sendPdf(res, buffer, `besm-${req.params.id}`);
}));

// ── Palladium Statblock PDF ──────────────────────────────────────────
router.get('/api/pdf/palladium/:id', asyncHandler(async (req, res)=>{
	const url = `${getBaseUrl()}/palladium/share/${req.params.id}`;
	const buffer = await urlToPdf(url);
	sendPdf(res, buffer, `palladium-${req.params.id}`);
}));

export default router;

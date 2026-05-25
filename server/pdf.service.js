// ── PDF Generation Service ────────────────────────────────────────────
// Uses Puppeteer to generate text-selectable PDFs from HTML or URLs.
// Maintains a shared browser instance for performance.
// Supports "flatten" mode: rasterizes each page as an image to produce
// a smaller, non-editable PDF without selectable text blocks.

import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

// Intercept WebP image responses and convert to JPEG so Chrome's PDF
// engine can embed them as native JPEG (PDF doesn't support WebP).
async function interceptWebpForPdf(page) {
	await page.setRequestInterception(true);
	page.on('request', async (req)=>{
		if(req.resourceType() === 'image' && req.url().endsWith('.webp')) {
			try {
				const response = await fetch(req.url());
				const buffer = Buffer.from(await response.arrayBuffer());
				const meta = await sharp(buffer).metadata();
				if(meta.hasAlpha) {
					const pngBuffer = await sharp(buffer).png().toBuffer();
					await req.respond({ status: 200, contentType: 'image/png', body: pngBuffer });
				} else {
					const jpegBuffer = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
					await req.respond({ status: 200, contentType: 'image/jpeg', body: jpegBuffer });
				}
			} catch (e) {
				req.continue();
			}
		} else {
			req.continue();
		}
	});
}

let browser = null;

async function getBrowser() {
	if(!browser || !browser.connected) {
		browser = await puppeteer.launch({
			headless : true,
			args     : [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-gpu',
				'--font-render-hinting=none'
			]
		});
	}
	return browser;
}

// Generate PDF from raw HTML string.
// The HTML should use absolute URLs for any external resources (CSS, fonts, images).
export async function htmlToPdf(html, opts = {}) {
	const b = await getBrowser();
	const page = await b.newPage();

	try {
		await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });

		await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

		// Extra wait for fonts and @import CSS to fully load and apply
		await page.evaluate(()=>new Promise((r)=>setTimeout(r, 2000)));

		return await page.pdf({
			format            : opts.format || 'Letter',
			landscape         : opts.landscape || false,
			printBackground   : true,
			preferCSSPageSize : true,
			margin            : opts.margin || { top: 0, right: 0, bottom: 0, left: 0 },
			displayHeaderFooter : false
		});
	} finally {
		await page.close();
	}
}

// Generate PDF by navigating to a URL (for statblock/character pages)
export async function urlToPdf(url, opts = {}) {
	const b = await getBrowser();
	const page = await b.newPage();

	try {
		await interceptWebpForPdf(page);
		// deviceScaleFactor 1 for text-selectable PDFs — Chrome renders text
		// as vectors so 2x only inflates embedded raster images.
		await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 1 });
		await page.emulateMediaType('print');

		await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
		await page.evaluate(()=>new Promise((r)=>setTimeout(r, 2000)));

		// Hide navbar/toolbar
		await page.evaluate(()=>{
			const hide = document.querySelectorAll('nav, .navbar, .headerNav, .toolBar');
			hide.forEach((el)=>el.style.display = 'none');
		});

		// Replace all raster images (both <img> and CSS backgrounds) with
		// compressed JPEG data URIs to reduce PDF size. Chrome's page.pdf()
		// embeds raster images as uncompressed/flate streams otherwise.
		await page.evaluate(async ()=>{
			const MAX = 1200;

			function hasTransparency(img, w, h) {
				const canvas = document.createElement('canvas');
				canvas.width = Math.min(w, 64);
				canvas.height = Math.min(h, 64);
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
				for (let i = 3; i < data.length; i += 4) {
					if(data[i] < 250) return true;
				}
				return false;
			}

			function compressToDataUrl(img, w, h, transparent) {
				const canvas = document.createElement('canvas');
				const scale = Math.min(MAX / w, MAX / h, 1);
				canvas.width = Math.round(w * scale);
				canvas.height = Math.round(h * scale);
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				// Use PNG for transparent images, JPEG for opaque
				return transparent
					? canvas.toDataURL('image/png')
					: canvas.toDataURL('image/jpeg', 0.85);
			}

			// Compress <img> elements
			document.querySelectorAll('img').forEach((img)=>{
				if(img.naturalWidth > MAX || img.naturalHeight > MAX) {
					const transparent = hasTransparency(img, img.naturalWidth, img.naturalHeight);
					img.src = compressToDataUrl(img, img.naturalWidth, img.naturalHeight, transparent);
				}
			});

			// Compress CSS background-image urls
			const allEls = document.querySelectorAll('*');
			const bgPromises = [];
			allEls.forEach((el)=>{
				const bg = getComputedStyle(el).backgroundImage;
				if(!bg || bg === 'none') return;
				const urlMatch = bg.match(/url\(["']?(.*?)["']?\)/);
				if(!urlMatch) return;
				const url = urlMatch[1];
				if(url.startsWith('data:')) return;

				bgPromises.push(new Promise((resolve)=>{
					const img = new Image();
					img.crossOrigin = 'anonymous';
					img.onload = ()=>{
						if(img.naturalWidth > MAX || img.naturalHeight > MAX) {
							const transparent = hasTransparency(img, img.naturalWidth, img.naturalHeight);
							const dataUrl = compressToDataUrl(img, img.naturalWidth, img.naturalHeight, transparent);
							el.style.backgroundImage = `url(${dataUrl})`;
						}
						resolve();
					};
					img.onerror = ()=>resolve();
					img.src = url;
				}));
			});
			await Promise.all(bgPromises);
		});

		return await page.pdf({
			format            : opts.format || 'Letter',
			landscape         : opts.landscape || false,
			printBackground   : true,
			preferCSSPageSize : true,
			margin            : opts.margin || { top: 0, right: 0, bottom: 0, left: 0 },
			displayHeaderFooter : false
		});
	} finally {
		await page.close();
	}
}

// Generate a flattened (rasterized) PDF by screenshotting each .page element.
// Produces an image-only PDF with no selectable text blocks — smaller file size
// and no layout artifacts when opened in PDF editors.
export async function urlToFlatPdf(url, opts = {}) {
	const b = await getBrowser();
	const page = await b.newPage();

	try {
		await interceptWebpForPdf(page);
		await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
		await page.emulateMediaType('print');

		await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
		await page.evaluate(()=>new Promise((r)=>setTimeout(r, 2000)));

		// Hide navbar/toolbar
		await page.evaluate(()=>{
			const hide = document.querySelectorAll('nav, .navbar, .headerNav, .toolBar');
			hide.forEach((el)=>el.style.display = 'none');
		});

		// Screenshot each .page element as JPEG via sharp for smaller file size
		const pageElements = await page.$$('.page');
		if(pageElements.length === 0) {
			// Fallback: no .page elements found, return normal PDF
			return await page.pdf({
				format: opts.format || 'Letter', printBackground: true,
				preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 },
				displayHeaderFooter: false
			});
		}

		// Letter size in points: 612 x 792
		const pdfDoc = await PDFDocument.create();
		const PAGE_W = 612;
		const PAGE_H = 792;

		for (const el of pageElements) {
			const pngShot = await el.screenshot({ type: 'png', omitBackground: false });
			const jpegBuffer = await sharp(pngShot).jpeg({ quality: 85 }).toBuffer();
			const img = await pdfDoc.embedJpg(jpegBuffer);

			const pdfPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
			pdfPage.drawImage(img, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
		}

		const pdfBytes = await pdfDoc.save();
		return Buffer.from(pdfBytes);
	} finally {
		await page.close();
	}
}

// Cleanup on process exit
process.on('exit', ()=>{
	if(browser) browser.close().catch(()=>{});
});
process.on('SIGINT', async ()=>{
	if(browser) await browser.close().catch(()=>{});
	process.exit();
});

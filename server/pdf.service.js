// ── PDF Generation Service ────────────────────────────────────────────
// Uses Puppeteer to generate text-selectable PDFs from HTML or URLs.
// Maintains a shared browser instance for performance.

import puppeteer from 'puppeteer';

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
		await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
		await page.emulateMediaType('print');

		await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
		await page.evaluate(()=>new Promise((r)=>setTimeout(r, 2000)));

		// Hide navbar/toolbar
		await page.evaluate(()=>{
			const hide = document.querySelectorAll('nav, .navbar, .headerNav, .toolBar');
			hide.forEach((el)=>el.style.display = 'none');
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

// Cleanup on process exit
process.on('exit', ()=>{
	if(browser) browser.close().catch(()=>{});
});
process.on('SIGINT', async ()=>{
	if(browser) await browser.close().catch(()=>{});
	process.exit();
});

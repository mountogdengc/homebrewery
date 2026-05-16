import _       from 'lodash';
import yaml    from 'js-yaml';
import request from '../client/homebrew/utils/request-middleware.js';

// Convert the templates from a brew to a Snippets Structure.
const brewSnippetsToJSON = (menuTitle, userBrewSnippets, themeBundleSnippets=null, full=true)=>{
	const textSplit  = /^(\\snippet +.+\n)/gm;
	const mpAsSnippets = [];
	// Snippets from Themes first.
	if(themeBundleSnippets) {
		for (const themes of themeBundleSnippets) {
			if(typeof themes !== 'string') {
				const userSnippets = [];
				const snipSplit = themes.snippets.trim().split(textSplit).slice(1);
				for (let snips = 0; snips < snipSplit.length; snips+=2) {
					if(!snipSplit[snips].startsWith('\\snippet ')) break;
					const snippetName = snipSplit[snips].split(/\\snippet +/)[1].split('\n')[0].trim();
					if(snippetName.length != 0) {
						userSnippets.push({
							name : snippetName,
							icon : '',
							gen  : snipSplit[snips + 1].replace(/\n$/, ''),
						});
					}
				}
				if(userSnippets.length > 0) {
					mpAsSnippets.push({
						name        : themes.name,
						icon        : '',
						gen         : '',
						subsnippets : userSnippets
					});
				}
			}
		}
	}
	// Local Snippets
	if(userBrewSnippets) {
		const userSnippets = [];
		const snipSplit = userBrewSnippets.trim().split(textSplit).slice(1);
		for (let snips = 0; snips < snipSplit.length; snips+=2) {
			if(!snipSplit[snips].startsWith('\\snippet ')) break;
			const snippetName = snipSplit[snips].split(/\\snippet +/)[1].split('\n')[0].trim();
			if(snippetName.length != 0) {
				const subSnip = {
					name : snippetName,
					gen  : snipSplit[snips + 1].replace(/\n$/, ''),
				};
				// if(full) subSnip.icon = '';
				userSnippets.push(subSnip);
			}
		}
		if(userSnippets.length) {
			mpAsSnippets.push({
				name        : menuTitle,
				// icon        : '',
				subsnippets : userSnippets
			});
		}
	}

	const returnObj = {
		snippets : mpAsSnippets
	};

	if(full) {
		returnObj.groupName = 'Brew Snippets';
		returnObj.icon = 'fas fa-th-list';
		returnObj.view = 'text';
	}

	return returnObj;
};

const yamlSnippetsToText = (yamlObj)=>{
	if(typeof yamlObj == 'string') return yamlObj;

	let snippetsText = '';

	for (const snippet of yamlObj) {
		for (const subSnippet of snippet.subsnippets) {
			snippetsText = `${snippetsText}\\snippet ${subSnippet.name}\n${subSnippet.gen || ''}\n`;
		}
	}
	return snippetsText;
};

const splitTextStyleAndMetadata = (brew)=>{
	brew.text = brew.text.replaceAll('\r\n', '\n');
	if(brew.text.startsWith('```metadata')) {
		const index = brew.text.indexOf('\n```\n\n');
		const metadataSection = brew.text.slice(11, index + 1);
		const metadata = yaml.load(metadataSection);
		Object.assign(brew, _.pick(metadata, ['title', 'description', 'renderer', 'theme', 'lang']));
		brew.snippets = yamlSnippetsToText(_.pick(metadata, ['snippets']).snippets || '');
		brew.text = brew.text.slice(index + 6);
	}
	if(brew.text.startsWith('```css')) {
		const index = brew.text.indexOf('\n```\n\n');
		brew.style = brew.text.slice(7, index + 1);
		brew.text = brew.text.slice(index + 6);
	}

	// Handle old brews that still have empty strings in the tags metadata
	if(typeof brew.tags === 'string') brew.tags = brew.tags ? [brew.tags] : [];
};

const printCurrentBrew = ()=>{
	if(window.typeof !== 'undefined') {
		window.frames['BrewRenderer'].contentWindow.print();
		//Force DOM reflow; Print dialog causes a repaint, and @media print CSS somehow makes out-of-view pages disappear
		const node = window.frames['BrewRenderer'].contentDocument.getElementsByClassName('brewRenderer').item(0);
		node.style.display='none';
		node.offsetHeight; // accessing this is enough to trigger a reflow
		node.style.display='';
	}
};

const fetchThemeBundle = async (setError, setThemeBundle, renderer, theme)=>{
	if(!renderer || !theme) return;
	const res = await request
			.get(`/api/theme/${renderer}/${theme}`)
			.catch((err)=>{
				setError(err);
			});
	if(!res) {
		setThemeBundle({});
		return;
	}
	const themeBundle = res.body;
	themeBundle.joinedStyles = themeBundle.styles.map((style)=>`<style>${style}</style>`).join('\n\n');
	setThemeBundle(themeBundle);
	setError(null);
};

const debugTextMismatch = (clientTextRaw, serverTextRaw, label)=>{
	const clientText = clientTextRaw?.normalize('NFC') || '';
	const serverText = serverTextRaw?.normalize('NFC') || '';

	const clientBuffer = Buffer.from(clientText, 'utf8');
	const serverBuffer = Buffer.from(serverText, 'utf8');

	if(clientBuffer.equals(serverBuffer)) {
		console.log(`✅ ${label} text matches byte-for-byte.`);
		return;
	}

	console.warn(`❗${label} text mismatch detected.`);
	console.log(`Client length: ${clientBuffer.length}`);
	console.log(`Server length: ${serverBuffer.length}`);

	// Byte-level diff
	for (let i = 0; i < Math.min(clientBuffer.length, serverBuffer.length); i++) {
		if(clientBuffer[i] !== serverBuffer[i]) {
			console.log(`Byte mismatch at offset ${i}: client=0x${clientBuffer[i].toString(16)} server=0x${serverBuffer[i].toString(16)}`);
			break;
		}
	}

	// Char-level diff
	for (let i = 0; i < Math.min(clientText.length, serverText.length); i++) {
		if(clientText[i] !== serverText[i]) {
			console.log(`Char mismatch at index ${i}:`);
			console.log(`  Client: '${clientText[i]}' (U+${clientText.charCodeAt(i).toString(16).toUpperCase()})`);
			console.log(`  Server: '${serverText[i]}' (U+${serverText.charCodeAt(i).toString(16).toUpperCase()})`);
			break;
		}
	}
};

const convertToMarkdown = (brewText)=>{
	let markdown = brewText;

	// Remove homebrewery inline spans: {{ [styles] text }}
	// Pattern: {{ optional-classes,optional-ids style:value,style:value text content }}
	// Match single-line mustache spans and extract just the text content
	markdown = markdown.replace(/\{\{([^}\n]*?)\s+([^}]+?)\s*\}\}(?!\})/g, (match, styles, content)=>{
		// Extract just the text content from the span
		return content.trim();
	});

	// Handle block-level mustache divs: {{ [styles] \n content \n }}
	// Match opening {{ with optional styles, capture content, match closing }}
	markdown = markdown.replace(/^\s*\{\{\s*([^\n}]*?)\s*\n([\s\S]*?)\n\s*\}\}\s*$/gm, (match, openTag, content)=>{
		// If the opening tag only has styles/classes, just return the content
		// Otherwise include a markdown comment with the class info for reference
		const styleInfo = openTag.trim();
		if(!styleInfo || styleInfo === '') {
			return content;
		}
		return `<!-- Block: ${styleInfo} -->\n${content}`;
	});

	// Convert statblock/character embeds to HTML comments for preservation
	markdown = markdown.replace(/\{\{(statblock|besm-statblock|willowlight-statblock|brp-statblock|palladium-statblock):([^}]*)\}\}/gi,
		(match, type, id)=>{
			return `<!-- Embed: ${type}:${id} -->`;
		});

	// Convert other embed types (e.g., {{tableofcontents}}, {{youtube:id}}, etc.)
	markdown = markdown.replace(/\{\{([a-z-]+):?([^}]*)\}\}/gi, (match, type, param)=>{
		if(param && param.trim()) {
			return `<!-- Embed: ${type}:${param} -->`;
		}
		return `<!-- Embed: ${type} -->`;
	});

	// Remove any remaining double-brace syntax (fallback for unmatched braces)
	markdown = markdown.replace(/\{\{([^}]*)\}\}/g, (match, content)=>{
		const text = content.trim();
		return text || '';
	});

	// Remove HTML div wrappers but preserve content
	markdown = markdown.replace(/<div[^>]*>/gi, '');
	markdown = markdown.replace(/<\/div>/gi, '');

	// Convert HTML span wrappers but preserve content (for inline elements)
	markdown = markdown.replace(/<span[^>]*>([^]*?)<\/span>/gi, '$1');

	return markdown;
};

export {
	splitTextStyleAndMetadata,
	printCurrentBrew,
	fetchThemeBundle,
	brewSnippetsToJSON,
	debugTextMismatch,
	convertToMarkdown
};

/*eslint max-lines: ["warn", {"max": 300, "skipBlankLines": true, "skipComments": true}]*/
import brewRendererStylesUrl from './brewRenderer.less?url';
import headerNavStylesUrl from './headerNav/headerNav.less?url';
import './brewRenderer.less';
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import _ from 'lodash';

import MarkdownLegacy from '@shared/markdownLegacy.js';
import Markdown from '@shared/markdown.js';
import ErrorBar from './errorBar/errorBar.jsx';
import ToolBar  from './toolBar/toolBar.jsx';

//TODO: move to the brew renderer
import RenderWarnings from '../../components/renderWarnings/renderWarnings.jsx';
import NotificationPopup from './notificationPopup/notificationPopup.jsx';
import Frame from 'react-frame-component';
import dedent from 'dedent';
import { printCurrentBrew } from '@shared/helpers.js';

import HeaderNav from './headerNav/headerNav.jsx';
import safeHTML from './safeHTML.js';
import statblockStylesUrl from '../statblock/statblock.less?url';
import willowlightStylesUrl from '../willowlight/willowlight.less?url';
import brpStylesUrl from '../brpStatblock/brpStatblock.less?url';
import palladiumStylesUrl from '../palladiumStatblock/palladiumStatblock.less?url';
import { render as render5eStatblock }         from '@shared/statblock/renderer.js';
import { render as renderWillowlightStatblock } from '@shared/willowlight/statblockRenderer.js';
import { renderPage1 as renderWlPortraitP1, renderPage2 as renderWlPortraitP2, BLANK_CHARACTER as WL_BLANK } from '@shared/willowlight/portraitSheetRenderer.js';
import { render as renderBrpStatblock }         from '@shared/brpStatblock/renderer.js';
import { renderPage1 as renderBrpPortraitP1, renderPage2 as renderBrpPortraitP2 } from '@shared/brpStatblock/portraitSheetRenderer.js';
import { render as renderPalladiumStatblock }   from '@shared/palladiumStatblock/renderer.js';
import { initArtBlockInteraction } from './artBlockInteraction.js';

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

const PAGEBREAK_REGEX_V3 = /^(?=\\page(?:break)?(?: *{[^\n{}]*})?$)/m;
const PAGEBREAK_REGEX_LEGACY = /\\page(?:break)?/m;
const COLUMNBREAK_REGEX_LEGACY = /\\column(:?break)?/m;
const PAGE_HEIGHT = 1056;

const TOOLBAR_STATE_KEY = 'HB_renderer_toolbarState';

const INITIAL_CONTENT = dedent`
	<!DOCTYPE html><html><head>
	<link href="//fonts.googleapis.com/css?family=Open+Sans:400,300,600,700" rel="stylesheet" type="text/css" />
	<link href='/homebrew/bundle.css' type="text/css" rel='stylesheet' />
	<link href="${brewRendererStylesUrl}" rel="stylesheet" />
	<link href="${headerNavStylesUrl}" rel="stylesheet" />
	<link href="${statblockStylesUrl}" rel="stylesheet" />
	<link href="${willowlightStylesUrl}" rel="stylesheet" />
	<link href="${brpStylesUrl}" rel="stylesheet" />
	<link href="${palladiumStylesUrl}" rel="stylesheet" />
	<base target=_blank>
	</head><body style='overflow: hidden'><div></div></body></html>`;


//v=====----------------------< Brew Page Component >---------------------=====v//
const BrewPage = (props)=>{
	props = {
		contents : '',
		index    : 0,
		...props
	};
	const pageRef   = useRef(null);
	const cleanText = safeHTML(props.contents);

	useEffect(()=>{
		if(!pageRef.current) return;

		// Observer for tracking pages within the `.pages` div
		const visibleObserver = new IntersectionObserver(
			(entries)=>{
				entries.forEach((entry)=>{
					if(entry.isIntersecting)
						props.onVisibilityChange(props.index + 1, true, false); // add page to array of visible pages.
					else
						props.onVisibilityChange(props.index + 1, false, false);
				});
			},
			{ threshold: .3, rootMargin: '0px 0px 0px 0px'  } // detect when >30% of page is within bounds.
		);

		// Observer for tracking the page at the center of the iframe.
		const centerObserver = new IntersectionObserver(
			(entries)=>{
				entries.forEach((entry)=>{
					if(entry.isIntersecting)
						props.onVisibilityChange(props.index + 1, true, true); // Set this page as the center page
				});
			},
			{ threshold: 0, rootMargin: '-50% 0px -50% 0px' } // Detect when the page is at the center
		);

		// attach observers to each `.page`
		visibleObserver.observe(pageRef.current);
		centerObserver.observe(pageRef.current);
		return ()=>{
			visibleObserver.disconnect();
			centerObserver.disconnect();
		};
	}, []);

	return <div className={props.className} id={`p${props.index + 1}`} data-index={props.index} ref={pageRef} style={props.style} {...props.attributes}>
	         <div className='columnWrapper' dangerouslySetInnerHTML={{ __html: cleanText }} />
	       </div>;
};


//v=====--------------------< Brew Renderer Component >-------------------=====v//
let renderedPages = [];
let rawPages      = [];

const BrewRenderer = (props)=>{
	props = {
		text                       : '',
		style                      : '',
		renderer                   : 'legacy',
		theme                      : '5ePHB',
		lang                       : '',
		errors                     : [],
		currentEditorCursorPageNum : 1,
		currentEditorViewPageNum   : 1,
		currentBrewRendererPageNum : 1,
		themeBundle                : {},
		onPageChange               : ()=>{},
		onPreviewClick             : null,
		onArtBlockUpdate           : null,
		...props
	};

	const [state, setState] = useState({
		isMounted    : false,
		visibility   : 'hidden',
		visiblePages : [],
		centerPage   : 1
	});

	const [displayOptions, setDisplayOptions] = useState({
		zoomLevel    : 100,
		spread       : 'single',
		startOnRight : true,
		pageShadows  : true,
		rowGap       : 5,
		columnGap    : 10,
	});

	//useEffect to store or gather toolbar state from storage
	useEffect(()=>{
		const toolbarState = JSON.parse(window.localStorage.getItem(TOOLBAR_STATE_KEY));
		toolbarState &&	setDisplayOptions(toolbarState);
	}, []);

	const [headerState, setHeaderState] = useState(false);

	const mainRef  = useRef(null);
	const pagesRef = useRef(null);

	if(props.renderer == 'legacy') {
		rawPages = props.text.split(PAGEBREAK_REGEX_LEGACY);
	} else {
		rawPages = props.text.split(PAGEBREAK_REGEX_V3);
	}

	const handlePageVisibilityChange = (pageNum, isVisible, isCenter)=>{
		setState((prevState)=>{
			const updatedVisiblePages = new Set(prevState.visiblePages);
			if(!isCenter)
				isVisible ? updatedVisiblePages.add(pageNum) : updatedVisiblePages.delete(pageNum);

			return {
				...prevState,
				visiblePages : [...updatedVisiblePages].sort((a, b)=>a - b),
				centerPage   : isCenter ? pageNum : prevState.centerPage
			};
		});

		if(isCenter)
			props.onPageChange(pageNum);
	};

	const isInView = (index)=>{
		if(!state.isMounted)
			return false;

		if(index == props.currentEditorCursorPageNum - 1)	//Already rendered before this step
			return false;

		if(Math.abs(index - props.currentBrewRendererPageNum - 1) <= 3)
			return true;

		return false;
	};

	const renderDummyPage = (index)=>{
		return <div className='phb page' id={`p${index + 1}`} key={index}>
			<i className='fas fa-spinner fa-spin' />
		</div>;
	};

	const renderStyle = ()=>{
		const themeStyles = props.themeBundle?.joinedStyles ?? '<style>@import url("/themes/V3/Blank/style.css");</style>';
		const cleanStyle = safeHTML(`${themeStyles} \n\n <style> ${props.style} </style>`);
		return <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: cleanStyle }} />;
	};

	const renderPage = (pageText, index)=>{

		let styles = {
			...(!displayOptions.pageShadows ? { boxShadow: 'none' } : {})
			// Add more conditions as needed
		};
		let classes    = 'page';
		let attributes = {};

		if(props.renderer == 'legacy') {
			pageText.replace(COLUMNBREAK_REGEX_LEGACY, '```\n````\n'); // Allow Legacy brews to use `\column(break)`
			const html = MarkdownLegacy.render(pageText);

			return <BrewPage className='page phb' index={index} key={index} contents={html} style={styles} onVisibilityChange={handlePageVisibilityChange} />;
		} else {
			if(pageText.startsWith('\\page')) {
				const firstLineTokens  = Markdown.marked.lexer(pageText.split('\n', 1)[0])[0].tokens;
				const injectedTags = firstLineTokens?.find((obj)=>obj.injectedTags !== undefined)?.injectedTags;
				if(injectedTags) {
					styles     = { ...styles, ...injectedTags.styles };
					styles     = _.mapKeys(styles, (v, k)=>k.startsWith('--') ? k : _.camelCase(k)); // Convert CSS to camelCase for React
					classes    = [classes, injectedTags.classes].join(' ').trim();
					attributes = injectedTags.attributes;
				}
				pageText = pageText.includes('\n') ? pageText.substring(pageText.indexOf('\n') + 1) : ''; // Remove the \page line
			}

			// DO NOT REMOVE!!! REQUIRED FOR BACKWARDS COMPATIBILITY WITH NON-UPGRADABLE VERSIONS OF CHROME.
			pageText += `\n\n&nbsp;\n\\column\n&nbsp;`; //Artificial column break at page end to emulate column-fill:auto (until `wide` is used, when column-fill:balance will reappear)

			const html = Markdown.render(pageText, index);

			return <BrewPage className={classes} index={index} key={index} contents={html} style={styles} attributes={attributes} onVisibilityChange={handlePageVisibilityChange} />;
		}
	};

	const renderPages = ()=>{
		if(props.errors && props.errors.length)
			return renderedPages;

		if(rawPages.length != renderedPages.length) // Re-render all pages when page count changes
			renderedPages.length = 0;

		// Render currently-edited page first so cross-page effects (variables, links) can propagate out first
		if(rawPages.length > props.currentEditorCursorPageNum -1)
			renderedPages[props.currentEditorCursorPageNum - 1] = renderPage(rawPages[props.currentEditorCursorPageNum - 1], props.currentEditorCursorPageNum - 1);

		_.forEach(rawPages, (page, index)=>{
			if((isInView(index) || !renderedPages[index]) && typeof window !== 'undefined'){
				renderedPages[index] = renderPage(page, index); // Render any page not yet rendered, but only re-render those in PPR range
			}
		});
		return renderedPages;
	};

	const handleControlKeys = (e)=>{
		if(!(e.ctrlKey || e.metaKey)) return;
		const P_KEY = 80;
		if(e.keyCode == P_KEY && props.allowPrint) printCurrentBrew();
		if(e.keyCode == P_KEY) {
			e.stopPropagation();
			e.preventDefault();
		}
	};

	const scrollToHash = (hash)=>{
		if(!hash) return;

		const iframeDoc = document.getElementById('BrewRenderer').contentDocument;
		let anchor = iframeDoc.querySelector(hash);

		if(anchor) {
			anchor.scrollIntoView({ behavior: 'smooth' });
		} else {
			// Use MutationObserver to wait for the element if it's not immediately available
			new MutationObserver((mutations, obs)=>{
				anchor = iframeDoc.querySelector(hash);
				if(anchor) {
					anchor.scrollIntoView({ behavior: 'smooth' });
					obs.disconnect();
				}
			}).observe(iframeDoc, { childList: true, subtree: true });
		}
	};

	const frameDidMount = ()=>{	//This triggers when iFrame finishes internal "componentDidMount"
		scrollToHash(window.location.hash);

		setTimeout(()=>{	//We still see a flicker where the style isn't applied yet, so wait 100ms before showing iFrame
			renderPages(); //Make sure page is renderable before showing
			setState((prevState)=>({
				...prevState,
				isMounted  : true,
				visibility : 'visible'
			}));
		}, 100);
	};

	const emitClick = ()=>{ // Allow clicks inside iFrame to interact with dropdowns, etc. from outside
		if(!window || !document) return;
		document.dispatchEvent(new MouseEvent('click'));
	};

	const handlePreviewClick = (e)=>{
		if(!props.onPreviewClick) return;

		// Find the nearest meaningful element (not just a span or inline)
		let el = e.target;
		// Walk up to find an element with meaningful text
		while (el && el.classList && el.classList.contains('columnWrapper') === false && el.tagName !== 'DIV') {
			if(el.tagName === 'P' || el.tagName === 'LI' || el.tagName === 'H1' || el.tagName === 'H2' ||
			   el.tagName === 'H3' || el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6' ||
			   el.tagName === 'BLOCKQUOTE' || el.tagName === 'TH' || el.tagName === 'TD' ||
			   el.tagName === 'DT' || el.tagName === 'DD' || el.tagName === 'PRE') {
				break;
			}
			el = el.parentElement;
		}
		if(!el) return;

		// Get the text content, trimmed
		const text = el.textContent?.trim();
		if(!text || text.length < 2) return;

		// Find which page this element is on
		let pageEl = el;
		while (pageEl && !pageEl.classList?.contains('page')) {
			pageEl = pageEl.parentElement;
		}
		const pageNum = pageEl ? parseInt(pageEl.id?.replace('p', ''), 10) : null;

		props.onPreviewClick(text, pageNum);
	};

	const handleDisplayOptionsChange = (newDisplayOptions)=>{
		setDisplayOptions(newDisplayOptions);
		localStorage.setItem(TOOLBAR_STATE_KEY, JSON.stringify(newDisplayOptions));
	};

	const pagesStyle = {
		zoom      : `${displayOptions.zoomLevel}%`,
		columnGap : `${displayOptions.columnGap}px`,
		rowGap    : `${displayOptions.rowGap}px`
	};

	const renderedStyle = useMemo(()=>renderStyle(), [props.style, props.themeBundle]);
	renderedPages = useMemo(()=>renderPages(), [props.text, displayOptions]);

	// Stat block embed rendering — fetch data and inject HTML into placeholders
	const statblockCache = useRef({});
	const proceduralImageCache = useRef({});

	const processStatblockEmbeds = useCallback(()=>{
		const iframeDoc = document.getElementById('BrewRenderer')?.contentDocument;
		if(!iframeDoc) return;

		const embeds = iframeDoc.querySelectorAll('.statblock-embed:not([data-loaded])');
		if(embeds.length === 0) return;

		const idsToFetch = [];
		embeds.forEach((el)=>{
			const id = el.getAttribute('data-statblock-id');
			if(id === 'blank') {
				// Pre-populate cache with blank character for sheet embeds
				statblockCache.current['blank'] = { ...WL_BLANK };
			} else if(id && !statblockCache.current[id]) {
				idsToFetch.push(id);
			}
		});

		const fillEmbeds = ()=>{
			embeds.forEach((el)=>{
				const id = el.getAttribute('data-statblock-id');
				const layout = el.getAttribute('data-statblock-layout') || 'narrow';
				const system = el.getAttribute('data-statblock-system');
				const opts = (el.getAttribute('data-statblock-opts') || '').split(',').filter(Boolean);
				const sb = id === 'blank' ? { ...WL_BLANK } : statblockCache.current[id];
				if(sb) {
					// Prefer the system from the embed syntax, fall back to server-tagged _system
					if(system) sb._system = system;
					const renderOpts = {};
					if(opts.includes('bw')) renderOpts.bw = true;
					const page = el.getAttribute('data-statblock-page');
					if(page) renderOpts.page = page;
					el.innerHTML = renderStatblock(sb, layout, renderOpts);
					el.setAttribute('data-loaded', 'true');
				} else {
					el.innerHTML = `<div style="color:#999;padding:8px;font-style:italic;">Stat block not found: ${id}</div>`;
					el.setAttribute('data-loaded', 'true');
				}
			});
		};

		if(idsToFetch.length > 0) {
			fetch(`/api/statblocks/batch?ids=${idsToFetch.join(',')}`)
				.then((res)=>res.json())
				.then((data)=>{
					Object.assign(statblockCache.current, data);
					fillEmbeds();
				})
				.catch(()=>fillEmbeds());
		} else {
			fillEmbeds();
		}
	}, []);

	const processProceduralImageEmbeds = useCallback(()=>{
		const iframeDoc = document.getElementById('BrewRenderer')?.contentDocument;
		if(!iframeDoc) return;

		// Handle all procedural image types: seals, insignias, etc.
		const types = ['seal', 'insignia', 'heraldry', 'icon'];

		types.forEach((type)=>{
			const embeds = iframeDoc.querySelectorAll(`.${type}-embed:not([data-loaded])`);
			if(embeds.length === 0) return;

			const idsToFetch = [];
			embeds.forEach((el)=>{
				const id = el.getAttribute(`data-${type}-id`);
				if(id && !proceduralImageCache.current[id]) idsToFetch.push({ id, type });
			});

			const fillEmbeds = ()=>{
				embeds.forEach((el)=>{
					const id = el.getAttribute(`data-${type}-id`);
					const img = proceduralImageCache.current[id];
					if(img) {
						const sizeClass = el.className.match(new RegExp(`${type}-embed--(\\w+)`))?.[1] || '';
						const sizeMap = {
							small: '256px',
							large: '512px'
						};
						const size = sizeMap[sizeClass] || '300px';
						el.innerHTML = `<img src="/api/procedural-image/${id}/render?size=${parseInt(size)}" alt="Procedural image" style="max-width:100%;height:auto;border-radius:4px;" />`;
						el.setAttribute('data-loaded', 'true');
					} else {
						el.innerHTML = `<div style="color:#999;padding:8px;font-style:italic;">Image not found</div>`;
						el.setAttribute('data-loaded', 'true');
					}
				});
			};

			if(idsToFetch.length > 0) {
				// Fetch image metadata for each type
				Promise.all(idsToFetch.map(({ id })=>
					fetch(`/api/procedural-image/share/${id}`)
						.then((res)=>res.ok ? res.json() : null)
						.catch(()=>null)
				)).then((results)=>{
					idsToFetch.forEach(({ id }, idx)=>{
						if(results[idx]) {
							proceduralImageCache.current[id] = results[idx];
						}
					});
					fillEmbeds();
				});
			} else {
				fillEmbeds();
			}
		});
	}, []);

	// Run on render and watch for new embeds via MutationObserver
	useEffect(()=>{
		if(!state.isMounted) return;

		const timer = setTimeout(()=>{
			processStatblockEmbeds();
			processProceduralImageEmbeds();
		}, 200);

		// Watch iframe for new embed elements
		const iframeDoc = document.getElementById('BrewRenderer')?.contentDocument;
		if(!iframeDoc) return ()=>clearTimeout(timer);

		const observer = new MutationObserver(()=>{
			setTimeout(()=>{
				processStatblockEmbeds();
				processProceduralImageEmbeds();
			}, 100);
		});
		observer.observe(iframeDoc.body, { childList: true, subtree: true });

		return ()=>{
			clearTimeout(timer);
			observer.disconnect();
		};
	}, [renderedPages, state.isMounted, processStatblockEmbeds, processProceduralImageEmbeds]);

	// Initialize art block interaction after content renders
	const artCleanupRef = useRef(null);
	useEffect(()=>{
		if(!state.isMounted || !props.onArtBlockUpdate) return;

		const iframeDoc = document.getElementById('BrewRenderer')?.contentDocument;
		if(!iframeDoc) return;

		// Delay slightly to ensure DOM is fully rendered after React updates
		const timer = setTimeout(()=>{
			// Clean up previous interaction handlers before rebinding
			if(artCleanupRef.current) artCleanupRef.current();
			artCleanupRef.current = initArtBlockInteraction(iframeDoc, ({ artIndex, props: newProps })=>{
				props.onArtBlockUpdate(artIndex, newProps);
			});
		}, 300);

		return ()=>{
			clearTimeout(timer);
			if(artCleanupRef.current) {
				artCleanupRef.current();
				artCleanupRef.current = null;
			}
		};
	}, [props.text, state.isMounted]);

	return (
		<>
			{/*render dummy page while iFrame is mounting.*/}
			{!state.isMounted
				? <div className='brewRenderer'>
					<div className='pages'>
						{renderDummyPage(1)}
					</div>
				</div>
				: null}

			<ErrorBar errors={props.errors} />
			<div className='popups' ref={mainRef}>
				<RenderWarnings />
				<NotificationPopup />
			</div>

			<ToolBar displayOptions={displayOptions} onDisplayOptionsChange={handleDisplayOptionsChange} visiblePages={state.visiblePages.length > 0 ? state.visiblePages : [state.centerPage]} totalPages={rawPages.length} headerState={headerState} setHeaderState={setHeaderState}/>

			{/*render in iFrame so broken code doesn't crash the site.*/}
			<Frame id='BrewRenderer' initialContent={INITIAL_CONTENT}
				style={{ width: '100%', height: '100%', visibility: state.visibility }}
				contentDidMount={frameDidMount}
				onClick={(e)=>{
				emitClick();
				// Intercept internal anchor links (e.g. ToC #p30) — scroll within iframe instead of opening new window
				const anchor = e.target.closest?.('a[href^="#"]');
				if(anchor) {
					e.preventDefault();
					scrollToHash(anchor.getAttribute('href'));
					return;
				}
				handlePreviewClick(e);
			}}
			>
				<div className='brewRenderer'
					onKeyDown={handleControlKeys}
					tabIndex={-1}
				>

					{/* Apply CSS from Style tab and render pages from Markdown tab */}
					{state.isMounted
						&&
						<>
							{renderedStyle}
							<div className={`pages ${displayOptions.startOnRight ? 'recto' : 'verso'}	${displayOptions.spread}`} lang={`${props.lang || 'en'}`} style={pagesStyle} ref={pagesRef}>
								{renderedPages}
							</div>
						</>
					}
				</div>
				{headerState ? <HeaderNav ref={pagesRef} /> : <></>}
			</Frame>
		</>
	);
};

export default BrewRenderer;

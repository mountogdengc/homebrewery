import './landingPage.less';
import React, { useState, useRef } from 'react';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const LandingPage = ()=>{
	const [converting, setConverting] = useState(false);
	const docxInputRef = useRef(null);
	const idttInputRef = useRef(null);

	const handleConvert = async (file, format)=>{
		if(converting || !file) return;
		setConverting(true);
		try {
			const markdown = await file.text();
			const basename = file.name.replace(/\.[^.]+$/, '');
			const res = await fetch(`/api/convert/${format}`, {
				method  : 'POST',
				headers : { 'Content-Type': 'application/json' },
				body    : JSON.stringify({ markdown, filename: basename })
			});
			if(!res.ok) throw new Error(`Conversion failed: ${res.status}`);
			const blob = await res.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = `${basename}.${format === 'docx' ? 'docx' : 'txt'}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error('Conversion failed:', err);
			alert(`Conversion failed: ${err.message}`);
		} finally {
			setConverting(false);
		}
	};

	return (
		<div className="landingPage">
			<Navbar>
				<Nav.section>
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div className="landingContent">
				<div className="landingTitle">
					<h1><strong>Mount Ogden</strong> Gaming Company Toolkit</h1>
					<p>Build characters, stat blocks, and adventures for any tabletop RPG</p>
				</div>

				{/* ── Game Systems (alphabetical) ──────────────────────── */}
				<div className="toolRow">
					<h2 className="rowTitle">Game Systems</h2>
					<div className="toolCards">
						<a className="toolCard" href="/besm/library">
							<div className="toolIcon">
								<i className="fas fa-bolt" />
							</div>
							<h3 className="toolName">BESM 4e</h3>
							<p className="toolDesc">
								Create BESM 4th Edition characters with a guided
								builder, AI generation, printable character sheets,
								and embeddable stat blocks.
							</p>
						</a>

						<a className="toolCard" href="/brp/library">
							<div className="toolIcon">
								<i className="fas fa-scroll" />
							</div>
							<h3 className="toolName">BRP</h3>
							<p className="toolDesc">
								Build Chaosium BRP (Basic Roleplaying) creature and
								NPC stat blocks with characteristics, skills, weapons,
								spells, and hit locations.
							</p>
						</a>

						<a className="toolCard" href="/statblock/library">
							<div className="toolIcon">
								<i className="fas fa-dragon" />
							</div>
							<h3 className="toolName">D&amp;D 5e (2024)</h3>
							<p className="toolDesc">
								Build monster and NPC stat blocks with a form-based
								editor, live preview, and AI generation. Save to your
								library and embed directly in your brews.
							</p>
						</a>

						<a className="toolCard" href="/palladium/library">
							<div className="toolIcon">
								<i className="fas fa-skull-crossbones" />
							</div>
							<h3 className="toolName">Palladium</h3>
							<p className="toolDesc">
								Build stat blocks for Rifts, Palladium Fantasy RPG,
								and TMNT &amp; Other Strangeness. Supports MDC/SDC,
								magic, psionics, and mutant animals.
							</p>
						</a>

						<a className="toolCard" href="/willowlight/library">
							<div className="toolIcon">
								<img src="/assets/lolgo_200x200.webp" alt="Cascade" style={{ width: '40px', height: '40px' }} />
							</div>
							<h3 className="toolName">Cascade</h3>
							<p className="toolDesc">
								Build stat blocks and full character sheets for
								Cascade. Includes AI generation, playtest
								table, and embeddable stat blocks.
							</p>
						</a>
					</div>
				</div>

				{/* ── Tools (alphabetical) ─────────────────────────────── */}
				<div className="toolRow">
					<h2 className="rowTitle">Tools</h2>
					<div className="toolCards">
						<a className="toolCard" href="/new">
							<div className="toolIcon">
								<i className="fas fa-beer" />
							</div>
							<h3 className="toolName">Brew Editor</h3>
							<p className="toolDesc">
								Write and format homebrew documents using Markdown.
								Create adventures, supplements, and rule books with
								professional styling and PDF export.
							</p>
						</a>

						<a className="toolCard" href="/adventure">
							<div className="toolIcon">
								<i className="fas fa-rocket" />
							</div>
							<h3 className="toolName">Adventure Generator</h3>
							<p className="toolDesc">
								Generate complete starship adventures with deck plans,
								factions, loot tables, and image prompts. Powered by AI
								with sci-fi mission briefing styling.
							</p>
						</a>

						<a className="toolCard" href="/handout">
							<div className="toolIcon">
								<i className="fas fa-envelope-open-text" />
							</div>
							<h3 className="toolName">Handout Generator</h3>
							<p className="toolDesc">
								Create in-world handouts like letters, journal entries,
								official writs, tavern notices, and parchment lists
								with live preview and print support.
							</p>
						</a>

						<div className="toolCard indesignCard">
							<div className="toolIcon">
								<i className="fas fa-file-export" />
							</div>
							<h3 className="toolName">InDesign Export</h3>
							<p className="toolDesc">
								Convert Markdown files to Word (.docx) or InDesign
								Tagged Text for professional print layout.
							</p>
							<div className="convertButtons">
								<button
									className="convertBtn"
									disabled={converting}
									onClick={()=>docxInputRef.current?.click()}
								>
									<i className="fas fa-file-word" /> {converting ? 'Converting...' : 'Upload .docx'}
								</button>
								<button
									className="convertBtn"
									disabled={converting}
									onClick={()=>idttInputRef.current?.click()}
								>
									<i className="fas fa-file-alt" /> {converting ? 'Converting...' : 'Upload IDTT'}
								</button>
							</div>
							<input
								ref={docxInputRef}
								type="file"
								accept=".md,.txt,.markdown"
								style={{ display: 'none' }}
								onChange={(e)=>{
									handleConvert(e.target.files[0], 'docx');
									e.target.value = '';
								}}
							/>
							<input
								ref={idttInputRef}
								type="file"
								accept=".md,.txt,.markdown"
								style={{ display: 'none' }}
								onChange={(e)=>{
									handleConvert(e.target.files[0], 'idtt');
									e.target.value = '';
								}}
							/>
						</div>

						<a className="toolCard" href="/mapgen">
							<div className="toolIcon">
								<i className="fas fa-mountain" />
							</div>
							<h3 className="toolName">Map Generator</h3>
							<p className="toolDesc">
								Generate procedural outdoor encounter maps with
								configurable terrain, rock outcroppings, and boulders.
								Export as SVG for use in your brews.
							</p>
						</a>

						<a className="toolCard" href="/playtest">
							<div className="toolIcon">
								<i className="fas fa-dice-d20" />
							</div>
							<h3 className="toolName">Playtest Table</h3>
							<p className="toolDesc">
								Run Cascade sessions with a GM dashboard.
								Track party health, roll dice against NPCs, manage
								tides, taint, and encounters.
							</p>
						</a>
					</div>
				</div>

				<div className="quickLinks">
					<a href="/besm/library">BESM 4e</a>
					<a href="/brp/library">BRP</a>
					<a href="/statblock/library">D&amp;D 5e</a>
					<a href="/palladium/library">Palladium</a>
					<a href="/willowlight/library">Willowlight</a>
					<a href="/new">Brew Editor</a>
					<a href="/adventure">Adventure Generator</a>
					<a href="/handout">Handout Generator</a>
					<a href="/mapgen">Map Generator</a>
					<a href="/playtest">Playtest Table</a>
					<a href="/vault">The Vault</a>
					<a href="/changelog">Changelog</a>
					<a href="/faq">FAQ</a>
				</div>
			</div>
		</div>
	);
};

export default LandingPage;

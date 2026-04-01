import './landingPage.less';
import React from 'react';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const LandingPage = ()=>{
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
							<h3 className="toolName">D&amp;D 5e</h3>
							<p className="toolDesc">
								Build monster and NPC stat blocks with a form-based
								editor, live preview, and AI generation. Save to your
								library and embed directly in your brews.
							</p>
						</a>

						<a className="toolCard" href="/willowlight/library">
							<div className="toolIcon">
								<i className="fas fa-moon" />
							</div>
							<h3 className="toolName">Willowlight Engine</h3>
							<p className="toolDesc">
								Build stat blocks and full character sheets for the
								Willowlight Engine. Includes AI generation, playtest
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
								Run Willowlight Engine sessions with a GM dashboard.
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
					<a href="/willowlight/library">Willowlight</a>
					<a href="/new">Brew Editor</a>
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

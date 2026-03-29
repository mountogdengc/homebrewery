import './landingPage.less';
import React from 'react';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';
import HelpNavItem    from '@navbar/help.navitem.jsx';

const LandingPage = ()=>{
	return (
		<div className="landingPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<AccountNavItem />
					<HelpNavItem />
				</Nav.section>
			</Navbar>

			<div className="landingContent">
				<div className="landingTitle">
					<h1><strong>The Homebrewery</strong> Toolkit</h1>
					<p>Create authentic-looking homebrew content for tabletop RPGs</p>
				</div>

				{/* ── Documents ─────────────────────────────────────────── */}
				<div className="toolRow">
					<h2 className="rowTitle">Documents</h2>
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
					</div>
				</div>

				{/* ── Stat Blocks ───────────────────────────────────────── */}
				<div className="toolRow">
					<h2 className="rowTitle">Stat Blocks</h2>
					<div className="toolCards">
						<a className="toolCard" href="/statblock/new">
							<div className="toolIcon">
								<i className="fas fa-dragon" />
							</div>
							<h3 className="toolName">D&amp;D 5e Stat Block</h3>
							<p className="toolDesc">
								Build monster stat blocks with a form-based editor
								and live preview. Save to your library and embed
								directly in your brews.
							</p>
						</a>

						<a className="toolCard" href="/brp/new">
							<div className="toolIcon">
								<i className="fas fa-scroll" />
							</div>
							<h3 className="toolName">BRP Stat Block</h3>
							<p className="toolDesc">
								Build Chaosium BRP (Basic Roleplaying) creature and
								NPC stat blocks with characteristics, skills, weapons,
								spells, and hit locations.
							</p>
						</a>

						<a className="toolCard" href="/willowlight/new">
							<div className="toolIcon">
								<i className="fas fa-moon" />
							</div>
							<h3 className="toolName">Willowlight Engine Stat Block</h3>
							<p className="toolDesc">
								Create stat blocks for the Willowlight Engine with
								attributes, health tracks, edges, aspects, burdens,
								and attacks.
							</p>
						</a>
					</div>
				</div>

				{/* ── Characters ────────────────────────────────────────── */}
				<div className="toolRow">
					<h2 className="rowTitle">Characters</h2>
					<div className="toolCards">
						<a className="toolCard" href="/besm/new">
							<div className="toolIcon">
								<i className="fas fa-bolt" />
							</div>
							<h3 className="toolName">BESM 4e Character</h3>
							<p className="toolDesc">
								Create BESM 4th Edition characters with a guided
								step-by-step wizard. Allocate Character Points to
								Stats, Attributes, Defects, and Skills.
							</p>
						</a>

						<a className="toolCard toolCard--coming" href="/willowlight-character/new">
							<div className="toolIcon">
								<i className="fas fa-moon" />
							</div>
							<h3 className="toolName">Willowlight Engine Character</h3>
							<p className="toolDesc">
								Build full Willowlight Engine character sheets with
								attributes, skills, health tracks, contacts, secrets,
								milestones, and more.
							</p>
						</a>
					</div>
				</div>

				{/* ── Tools ────────────────────────────────────────── */}
				<div className="toolRow">
					<h2 className="rowTitle">Tools</h2>
					<div className="toolCards">
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
					<a href="/new">New Brew</a>
					<a href="/statblock/library">5e Stat Blocks</a>
					<a href="/brp/library">BRP Stat Blocks</a>
					<a href="/willowlight/library">Willowlight Stat Blocks</a>
					<a href="/besm/library">BESM Characters</a>
					<a href="/willowlight-character/library">Willowlight Characters</a>
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

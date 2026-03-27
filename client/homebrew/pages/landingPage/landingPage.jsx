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

				<div className="toolCards">
					<a className="toolCard" href="/new">
						<div className="toolIcon">
							<i className="fas fa-beer" />
						</div>
						<h2 className="toolName">Brew Editor</h2>
						<p className="toolDesc">
							Write and format homebrew documents using Markdown.
							Create adventures, supplements, and rule books with
							professional styling and PDF export.
						</p>
					</a>

					<a className="toolCard" href="/statblock/new">
						<div className="toolIcon">
							<i className="fas fa-dragon" />
						</div>
						<h2 className="toolName">Stat Block Builder</h2>
						<p className="toolDesc">
							Build monster stat blocks with a form-based editor
							and live preview. Save to your library and embed
							directly in your brews.
						</p>
					</a>
				</div>

				<div className="quickLinks">
					<a href="/new">New Brew</a>
					<a href="/statblock/library">Stat Block Library</a>
					<a href="/vault">The Vault</a>
					<a href="/changelog">Changelog</a>
					<a href="/faq">FAQ</a>
				</div>
			</div>
		</div>
	);
};

export default LandingPage;

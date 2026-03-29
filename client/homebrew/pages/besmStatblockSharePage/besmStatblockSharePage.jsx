import '../../besmStatblock/besmStatblock.less';
import React, { useState } from 'react';
import BesmStatblockPreview from '../../besmStatblock/besmStatblockPreview.jsx';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const BesmStatblockSharePage = (props)=>{
	const character = props.besmCharacter || {};
	const [layout, setLayout] = useState('narrow');
	const [copied, setCopied] = useState(false);

	const toggleLayout = ()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow');

	const copyEmbed = ()=>{
		const code = layout === 'wide'
			? `{{besm-statblock:${character.shareId}|wide}}`
			: `{{besm-statblock:${character.shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	return (
		<div className="statblockEditorPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item color="pink">{character.name || 'BESM Stat Block'}</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item
						icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'}
						onClick={toggleLayout}
					>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>
					{character.shareId && (
						<Nav.item
							icon={copied ? 'fas fa-check' : 'fas fa-code'}
							onClick={copyEmbed}
						>
							{copied ? 'Copied!' : 'Copy Embed'}
						</Nav.item>
					)}
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div style={{ flex: 1, overflow: 'auto' }}>
				<BesmStatblockPreview character={character} layout={layout} />
			</div>
		</div>
	);
};

export default BesmStatblockSharePage;

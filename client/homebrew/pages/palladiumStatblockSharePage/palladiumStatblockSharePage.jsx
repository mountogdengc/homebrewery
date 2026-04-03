import '../../palladiumStatblock/palladiumStatblock.less';
import '../../statblock/statblock.less';
import React, { useState } from 'react';
import PalladiumStatblockPreview from '../../palladiumStatblock/palladiumStatblockPreview.jsx';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const PalladiumStatblockSharePage = (props)=>{
	const statblock = props.palladiumStatblock || {};
	const [layout, setLayout] = useState('narrow');
	const [copied, setCopied] = useState(false);

	const toggleLayout = ()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow');

	const copyEmbed = ()=>{
		const code = layout === 'wide'
			? `{{palladium-statblock:${statblock.shareId}|wide}}`
			: `{{palladium-statblock:${statblock.shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	const gameLabel = statblock.game || 'Palladium';

	return (
		<div className="palladiumStatblockEditorPage">
			<Navbar>
				<Nav.section>
					<Nav.item color="orange">{statblock.name || `${gameLabel} Stat Block`}</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'} onClick={toggleLayout}>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>
					{statblock.shareId && (
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Copy Embed'}
						</Nav.item>
					)}
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div style={{ flex: 1, overflow: 'auto' }}>
				<PalladiumStatblockPreview statblock={statblock} layout={layout} />
			</div>
		</div>
	);
};

export default PalladiumStatblockSharePage;

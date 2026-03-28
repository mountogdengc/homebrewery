import '../../willowlightStatblock/willowlightStatblock.less';
import '../../statblock/statblock.less';
import React, { useState } from 'react';
import WillowlightStatblockPreview from '../../willowlightStatblock/willowlightStatblockPreview.jsx';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const WillowlightStatblockSharePage = (props)=>{
	const statblock = props.willowlightStatblock || {};
	const [layout, setLayout] = useState('narrow');
	const [copied, setCopied] = useState(false);

	const toggleLayout = ()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow');

	const copyEmbed = ()=>{
		const code = layout === 'wide'
			? `{{willowlight-statblock:${statblock.shareId}|wide}}`
			: `{{willowlight-statblock:${statblock.shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	return (
		<div className="willowlightStatblockEditorPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item color="blue">{statblock.name || 'Willowlight Stat Block'}</Nav.item>
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
				<WillowlightStatblockPreview statblock={statblock} layout={layout} />
			</div>
		</div>
	);
};

export default WillowlightStatblockSharePage;

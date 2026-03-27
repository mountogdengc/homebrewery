import '../../statblock/statblock.less';
import React, { useState } from 'react';
import StatblockPreview from '../../statblock/statblockPreview.jsx';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const StatblockSharePage = (props)=>{
	const statblock = props.statblock || {};
	const [layout, setLayout] = useState('narrow');
	const [copied, setCopied] = useState(false);

	const toggleLayout = ()=>{
		setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow');
	};

	const copyEmbed = ()=>{
		const code = layout === 'wide'
			? `{{statblock:${statblock.shareId}|wide}}`
			: `{{statblock:${statblock.shareId}}}`;
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
					<Nav.item color="purple">
						{statblock.name || 'Stat Block'}
					</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item
						icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'}
						onClick={toggleLayout}
					>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>
					{statblock.shareId && (
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
				<StatblockPreview statblock={statblock} layout={layout} />
			</div>
		</div>
	);
};

export default StatblockSharePage;

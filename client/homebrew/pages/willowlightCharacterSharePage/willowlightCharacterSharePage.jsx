import '../../willowlightStatblock/willowlightStatblock.less';
import '../../willowlightCharacter/willowlightCharacter.less';
import '../../statblock/statblock.less';
import React, { useState } from 'react';
import WillowlightCharacterPreview from '../../willowlightCharacter/willowlightCharacterPreview.jsx';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const WillowlightCharacterSharePage = (props)=>{
	const character = props.willowlightCharacter || {};
	const [layout, setLayout] = useState('narrow');
	const [bw, setBw] = useState(false);
	const [copied, setCopied] = useState(false);

	const copyEmbed = ()=>{
		const opts = [layout === 'wide' ? 'wide' : '', bw ? 'bw' : ''].filter(Boolean).join(',');
		const code = opts ? `{{willowlight-character:${character.shareId}|${opts}}}` : `{{willowlight-character:${character.shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	return (
		<div className="willowlightCharacterEditorPage">
			<Navbar>
				<Nav.logo />
				<Nav.section>
					<Nav.item color="blue">{character.name || 'Willowlight Character'}</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item icon={layout === 'narrow' ? 'fas fa-columns' : 'fas fa-align-justify'}
						onClick={()=>setLayout((l)=>l === 'narrow' ? 'wide' : 'narrow')}>
						{layout === 'narrow' ? 'Wide' : 'Narrow'}
					</Nav.item>
					<Nav.item icon={bw ? 'fas fa-palette' : 'fas fa-adjust'} onClick={()=>setBw((b)=>!b)}>
						{bw ? 'Color' : 'B&W'}
					</Nav.item>
					{character.shareId && (
						<Nav.item icon={copied ? 'fas fa-check' : 'fas fa-code'} onClick={copyEmbed}>
							{copied ? 'Copied!' : 'Copy Embed'}
						</Nav.item>
					)}
					<AccountNavItem />
				</Nav.section>
			</Navbar>

			<div style={{ flex: 1, overflow: 'auto' }}>
				<WillowlightCharacterPreview character={character} layout={layout} bw={bw} />
			</div>
		</div>
	);
};

export default WillowlightCharacterSharePage;

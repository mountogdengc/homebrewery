import '../../willowlight/willowlight.less';
import '../../statblock/statblock.less';
import React, { useState } from 'react';
import WillowlightStatblockPreview from '../../willowlight/willowlightStatblockPreview.jsx';
import WillowlightSheetPreview     from '../../willowlight/willowlightSheetPreview.jsx';

import Nav            from '@navbar/nav.jsx';
import Navbar         from '@navbar/navbar.jsx';
import AccountNavItem from '@navbar/account.navitem.jsx';

const WillowlightSharePage = (props)=>{
	const character = props.willowlightCharacter || {};
	const [layout, setLayout] = useState('narrow');
	const [bw, setBw] = useState(false);
	const [copied, setCopied] = useState(false);
	const [viewMode, setViewMode] = useState('statblock'); // 'statblock' or 'sheet'

	const copyEmbed = ()=>{
		const opts = [layout === 'wide' ? 'wide' : '', bw ? 'bw' : ''].filter(Boolean).join(',');
		const code = opts ? `{{willowlight:${character.shareId}|${opts}}}` : `{{willowlight:${character.shareId}}}`;
		navigator.clipboard.writeText(code).then(()=>{
			setCopied(true);
			setTimeout(()=>setCopied(false), 2000);
		});
	};

	const PreviewComponent = viewMode === 'sheet' ? WillowlightSheetPreview : WillowlightStatblockPreview;

	return (
		<div className="willowlightEditorPage">
			<Navbar>
				<Nav.section>
					<Nav.item color="blue">{character.name || 'Willowlight Character'}</Nav.item>
				</Nav.section>
				<Nav.section>
					<Nav.item
						icon={viewMode === 'statblock' ? 'fas fa-id-card' : 'fas fa-file-alt'}
						onClick={()=>setViewMode((m)=>m === 'statblock' ? 'sheet' : 'statblock')}
					>
						{viewMode === 'statblock' ? 'Sheet View' : 'Stat Block View'}
					</Nav.item>
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
				<PreviewComponent character={character} layout={layout} bw={bw} />
			</div>
		</div>
	);
};

export default WillowlightSharePage;
